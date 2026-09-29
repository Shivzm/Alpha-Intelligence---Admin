const { getStorage } = require("firebase-admin/storage");
const { FieldValue } = require("firebase-admin/firestore");
const { ApiError, getDocument, listCollection, updateDocument, validatePayload, writeAuditLog } = require("../services/firestoreRepository");
const { getFirebaseApp } = require("../services/firestore");

function getStorageBucket() {
  if (!process.env.FIREBASE_STORAGE_BUCKET) {
    throw new ApiError(503, "STORAGE_NOT_CONFIGURED", "Cloud Storage is not configured for document operations.");
  }
  return getStorage(getFirebaseApp()).bucket(process.env.FIREBASE_STORAGE_BUCKET);
}

async function listDocuments(request, response) {
  const filters = ["type", "userId"]
    .filter((field) => typeof request.query[field] === "string" && request.query[field] !== "")
    .map((field) => [field, "==", request.query[field]]);
  return response.json(await listCollection("certificates", { filters, query: request.query }));
}

async function getDocumentDetails(request, response) {
  return response.json({ data: await getDocument("certificates", request.params.id) });
}

async function downloadDocument(request, response) {
  const document = await getDocument("certificates", request.params.id);
  if (!document.fileRef) {
    throw new ApiError(404, "DOCUMENT_FILE_NOT_FOUND", "This document does not have a stored file.");
  }
  const filePath = document.fileRef.replace(/^gs:\/\/[^/]+\//, "");
  const expiresAt = Date.now() + 5 * 60 * 1000;
  const [url] = await getStorageBucket().file(filePath).getSignedUrl({ action: "read", expires: expiresAt });
  return response.json({ data: { url, expiresAt: new Date(expiresAt).toISOString() } });
}

async function archiveDocument(request, response) {
  const document = await getDocument("certificates", request.params.id);
  const updated = await updateDocument("certificates", document.id, {
    archivedAt: FieldValue.serverTimestamp(),
    archivedBy: request.user.email,
  });
  await writeAuditLog({
    actorId: request.user.email,
    action: "document.archived",
    entity: "certificate",
    entityId: document.id,
    requestId: request.requestId,
  });
  return response.json({ data: updated });
}

async function revokeDocument(request, response) {
  const payload = validatePayload(request.body || {}, ["reason"]);
  const document = await getDocument("certificates", request.params.id);
  if (document.revokedAt) {
    throw new ApiError(409, "DOCUMENT_ALREADY_REVOKED", "This document has already been revoked.");
  }
  const updated = await updateDocument("certificates", document.id, {
    revokedAt: new Date(),
    revokedBy: request.user.email,
    revocationReason: payload.reason || null,
  });
  await writeAuditLog({
    actorId: request.user.email,
    action: "document.revoked",
    entity: "certificate",
    entityId: document.id,
    requestId: request.requestId,
    before: { revoked: false },
    after: { revoked: true },
  });
  return response.json({ data: updated });
}

async function generateDocuments(request, response) {
  throw new ApiError(503, "DOCUMENT_GENERATION_NOT_CONFIGURED", "A document renderer and Cloud Storage bucket must be configured before documents can be generated.");
}

async function reissueDocument(request, response) {
  throw new ApiError(503, "DOCUMENT_GENERATION_NOT_CONFIGURED", "A document renderer and Cloud Storage bucket must be configured before a document can be reissued.");
}

async function previewTemplate(request, response) {
  const template = await getDocument(request.templateCollection, request.params.id);
  const sampleData = request.body?.sampleData || {};
  if (!sampleData || typeof sampleData !== "object" || Array.isArray(sampleData)) {
    throw new ApiError(400, "INVALID_SAMPLE_DATA", "sampleData must be a JSON object.");
  }
  return response.json({ data: { templateId: template.id, layout: template.layout, sampleData, rendered: false } });
}

module.exports = {
  archiveDocument,
  downloadDocument,
  generateDocuments,
  getDocumentDetails,
  listDocuments,
  previewTemplate,
  reissueDocument,
  revokeDocument,
};
