const { FieldValue } = require("firebase-admin/firestore");
const { getFirestoreDb } = require("./firestore");

class ApiError extends Error {
  constructor(statusCode, code, message) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

function serializeValue(value) {
  if (value && typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }
  if (Array.isArray(value)) return value.map(serializeValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [key, serializeValue(nestedValue)]),
    );
  }
  return value;
}

function serializeDocument(document) {
  return { id: document.id, ...serializeValue(document.data()) };
}

function parsePageOptions(query = {}) {
  const requestedPage = Number.parseInt(query.page, 10);
  const requestedLimit = Number.parseInt(query.limit, 10);
  return {
    page: Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1,
    limit: Number.isInteger(requestedLimit) && requestedLimit > 0
      ? Math.min(requestedLimit, 100)
      : 20,
  };
}

function validatePayload(payload, allowedFields, requiredFields = []) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new ApiError(400, "INVALID_BODY", "A JSON object is required.");
  }

  const cleanPayload = {};
  for (const [field, value] of Object.entries(payload)) {
    if (!allowedFields.includes(field)) {
      throw new ApiError(400, "UNKNOWN_FIELD", `Field '${field}' cannot be changed.`);
    }
    if (value !== undefined) cleanPayload[field] = value;
  }

  for (const field of requiredFields) {
    if (cleanPayload[field] === undefined || cleanPayload[field] === "") {
      throw new ApiError(400, "REQUIRED_FIELD", `Field '${field}' is required.`);
    }
  }
  return cleanPayload;
}

async function listCollection(collectionName, { filters = [], query = {}, orderBy = "createdAt" } = {}) {
  const { page, limit } = parsePageOptions(query);
  const database = getFirestoreDb();
  let baseQuery = database.collection(collectionName);
  for (const [field, operator, value] of filters) {
    baseQuery = baseQuery.where(field, operator, value);
  }

  const countSnapshot = await baseQuery.count().get();
  const snapshot = await baseQuery
    .orderBy(orderBy, "desc")
    .offset((page - 1) * limit)
    .limit(limit)
    .get();

  return {
    data: snapshot.docs.map(serializeDocument),
    meta: { page, limit, total: countSnapshot.data().count },
  };
}

async function getDocument(collectionName, id) {
  const snapshot = await getFirestoreDb().collection(collectionName).doc(id).get();
  if (!snapshot.exists) {
    throw new ApiError(404, "NOT_FOUND", "The requested resource was not found.");
  }
  return serializeDocument(snapshot);
}

async function createDocument(collectionName, payload) {
  const timestamp = FieldValue.serverTimestamp();
  const reference = getFirestoreDb().collection(collectionName).doc();
  await reference.set({ ...payload, createdAt: timestamp, updatedAt: timestamp });
  return getDocument(collectionName, reference.id);
}

async function updateDocument(collectionName, id, payload) {
  const reference = getFirestoreDb().collection(collectionName).doc(id);
  const snapshot = await reference.get();
  if (!snapshot.exists) {
    throw new ApiError(404, "NOT_FOUND", "The requested resource was not found.");
  }
  await reference.update({ ...payload, updatedAt: FieldValue.serverTimestamp() });
  return getDocument(collectionName, id);
}

async function archiveDocument(collectionName, id) {
  return updateDocument(collectionName, id, { status: "archived", archivedAt: FieldValue.serverTimestamp() });
}

async function deleteDocument(collectionName, id) {
  const reference = getFirestoreDb().collection(collectionName).doc(id);
  const snapshot = await reference.get();
  if (!snapshot.exists) {
    throw new ApiError(404, "NOT_FOUND", "The requested resource was not found.");
  }
  await reference.delete();
}

async function writeAuditLog({ actorId, action, entity, entityId, requestId, before, after }) {
  const timestamp = FieldValue.serverTimestamp();
  await getFirestoreDb().collection("auditLogs").add({
    actorType: "admin",
    actorId,
    action,
    entity,
    entityId,
    requestId,
    before: before || null,
    after: after || null,
    source: "ui",
    at: timestamp,
    createdAt: timestamp,
  });
}

module.exports = {
  ApiError,
  archiveDocument,
  createDocument,
  deleteDocument,
  getDocument,
  listCollection,
  updateDocument,
  validatePayload,
  writeAuditLog,
};
