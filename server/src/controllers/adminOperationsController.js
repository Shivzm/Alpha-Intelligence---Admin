const { FieldValue } = require("firebase-admin/firestore");
const {
  ApiError,
  getDocument,
  listCollection,
  updateDocument,
  validatePayload,
  writeAuditLog,
} = require("../services/firestoreRepository");
const { getFirestoreDb } = require("../services/firestore");
const { toCsv } = require("../services/csv");

const DEFAULT_ALERT_CHANNELS = { email: true, sms: false, dashboard: true };
const INBOX_COLLECTION = "adminInbox";

function filtersFromQuery(request, fields) {
  return fields
    .filter((field) => typeof request.query[field] === "string" && request.query[field] !== "")
    .map((field) => [field, "==", request.query[field]]);
}

async function listAuditLogs(request, response) {
  const result = await listCollection("auditLogs", {
    filters: filtersFromQuery(request, ["actorType", "actorId", "entity", "source"]),
    query: request.query,
    orderBy: "createdAt",
  });
  return response.json(result);
}

async function exportAuditLogs(request, response) {
  const result = await listCollection("auditLogs", {
    filters: filtersFromQuery(request, ["actorType", "actorId", "entity", "source"]),
    query: { page: 1, limit: 100 },
    orderBy: "createdAt",
  });
  const rows = result.data.map((entry) => [entry.id, entry.at, entry.actorType, entry.actorId, entry.action, entry.entity, entry.entityId, entry.source, entry.requestId]);
  response.type("text/csv").attachment("audit-logs.csv");
  return response.send(toCsv(["id", "at", "actorType", "actorId", "action", "entity", "entityId", "source", "requestId"], rows));
}

async function getAuditLog(request, response) {
  return response.json({ data: await getDocument("auditLogs", request.params.id) });
}

async function listInbox(request, response) {
  const filters = filtersFromQuery(request, ["kind"]);
  if (request.query.unread === "true") filters.push(["ackAt", "==", null]);
  return response.json(await listCollection(INBOX_COLLECTION, {
    filters,
    query: request.query,
  }));
}

async function getInboxUnreadCount(request, response) {
  const snapshot = await getFirestoreDb()
    .collection(INBOX_COLLECTION)
    .where("ackAt", "==", null)
    .count()
    .get();
  return response.json({ data: { unread: snapshot.data().count } });
}

async function acknowledgeInboxItem(request, response) {
  const database = getFirestoreDb();
  const reference = database.collection(INBOX_COLLECTION).doc(request.params.id);
  const snapshot = await reference.get();
  if (!snapshot.exists) {
    throw new ApiError(404, "INBOX_ITEM_NOT_FOUND", "The inbox item was not found.");
  }
  const ackAt = FieldValue.serverTimestamp();
  await reference.update({ ackBy: request.user.email, ackAt });
  await writeAuditLog({
    actorId: request.user.email,
    action: "inbox.acknowledged",
    entity: "adminInbox",
    entityId: request.params.id,
    requestId: request.requestId,
  });
  return response.json({ data: { id: request.params.id, acknowledged: true } });
}

async function listAlerts(request, response) {
  const filters = filtersFromQuery(request, ["severity"]);
  if (request.query.resolved === "true" || request.query.resolved === "false") {
    filters.push(["resolved", "==", request.query.resolved === "true"]);
  }
  return response.json(await listCollection("alerts", { filters, query: request.query }));
}

async function getAlert(request, response) {
  return response.json({ data: await getDocument("alerts", request.params.id) });
}

async function resolveAlert(request, response) {
  const payload = validatePayload(request.body || {}, ["note"]);
  const before = await getDocument("alerts", request.params.id);
  const updated = await updateDocument("alerts", request.params.id, {
    resolved: true,
    resolvedBy: request.user.email,
    resolvedAt: FieldValue.serverTimestamp(),
    resolutionNote: payload.note || null,
  });
  await writeAuditLog({
    actorId: request.user.email,
    action: "alert.resolved",
    entity: "alert",
    entityId: request.params.id,
    requestId: request.requestId,
    before: { resolved: before.resolved || false },
    after: { resolved: true },
  });
  return response.json({ data: updated });
}

async function getAlertChannels(request, response) {
  const snapshot = await getFirestoreDb().collection("settings").doc("alertChannels").get();
  return response.json({
    data: snapshot.exists ? { ...DEFAULT_ALERT_CHANNELS, ...snapshot.data() } : DEFAULT_ALERT_CHANNELS,
  });
}

async function updateAlertChannel(request, response) {
  const payload = validatePayload(request.body, ["enabled"], ["enabled"]);
  if (!Object.hasOwn(DEFAULT_ALERT_CHANNELS, request.params.id) || typeof payload.enabled !== "boolean") {
    throw new ApiError(400, "INVALID_ALERT_CHANNEL", "Choose a supported channel and provide a boolean enabled value.");
  }
  const database = getFirestoreDb();
  await database.collection("settings").doc("alertChannels").set({
    [request.params.id]: payload.enabled,
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
  await writeAuditLog({
    actorId: request.user.email,
    action: "alert-channel.updated",
    entity: "alertChannel",
    entityId: request.params.id,
    requestId: request.requestId,
    after: { enabled: payload.enabled },
  });
  return response.json({ data: { id: request.params.id, enabled: payload.enabled } });
}

async function listEnquiries(request, response) {
  return response.json(await listCollection("enquiries", {
    filters: filtersFromQuery(request, ["status"]),
    query: request.query,
  }));
}

async function updateEnquiry(request, response) {
  const payload = validatePayload(request.body, ["status", "responseNote"]);
  if (!Object.keys(payload).length) {
    throw new ApiError(400, "EMPTY_PATCH", "Provide a status or response note.");
  }
  if (payload.status && !["new", "in_progress", "responded", "closed"].includes(payload.status)) {
    throw new ApiError(400, "INVALID_ENQUIRY_STATUS", "The requested enquiry status is invalid.");
  }
  const updated = await updateDocument("enquiries", request.params.id, {
    ...payload,
    updatedBy: request.user.email,
  });
  await writeAuditLog({
    actorId: request.user.email,
    action: "enquiry.updated",
    entity: "enquiry",
    entityId: request.params.id,
    requestId: request.requestId,
  });
  return response.json({ data: updated });
}

async function listCertificateRequests(request, response) {
  return response.json(await listCollection("certificateRequests", {
    filters: filtersFromQuery(request, ["status", "userId"]),
    query: request.query,
  }));
}

async function decideCertificateRequest(request, response) {
  const payload = validatePayload(request.body, ["status", "note"], ["status"]);
  if (!["approved", "rejected"].includes(payload.status)) {
    throw new ApiError(400, "INVALID_REQUEST_STATUS", "Certificate requests can only be approved or rejected.");
  }
  if (payload.status === "approved") {
    throw new ApiError(503, "DOCUMENT_GENERATION_NOT_CONFIGURED", "Certificate approval requires the document-generation service and storage bucket.");
  }

  const database = getFirestoreDb();
  const requestReference = database.collection("certificateRequests").doc(request.params.id);
  const notificationReference = database.collection("notifications").doc();
  const auditReference = database.collection("auditLogs").doc();
  const timestamp = FieldValue.serverTimestamp();
  const result = await database.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(requestReference);
    if (!snapshot.exists) {
      throw new ApiError(404, "CERTIFICATE_REQUEST_NOT_FOUND", "The certificate request was not found.");
    }
    const certificateRequest = snapshot.data();
    if (certificateRequest.status !== "pending") {
      throw new ApiError(409, "CERTIFICATE_REQUEST_NOT_PENDING", "Only pending certificate requests can be decided.");
    }
    transaction.update(requestReference, {
      status: "rejected",
      note: payload.note || null,
      decidedBy: request.user.email,
      decidedAt: timestamp,
      updatedAt: timestamp,
    });
    transaction.create(notificationReference, {
      userId: certificateRequest.userId,
      type: "certificate.request.rejected",
      title: "Certificate request update",
      body: payload.note?.trim() || "Your certificate request was not approved.",
      link: "/certificate",
      read: false,
      source: "admin",
      createdAt: timestamp,
    });
    transaction.create(auditReference, {
      actorType: "admin",
      actorId: request.user.email,
      action: "certificate-request.rejected",
      entity: "certificateRequest",
      entityId: request.params.id,
      before: { status: "pending" },
      after: { status: "rejected" },
      source: "ui",
      requestId: request.requestId,
      at: timestamp,
      createdAt: timestamp,
    });
    return { id: request.params.id, status: "rejected" };
  });
  return response.json({ data: result });
}

async function sendNotifications(request, response) {
  const payload = validatePayload(request.body, ["userIds", "segment", "type", "title", "body", "link"], ["title", "body"]);
  const database = getFirestoreDb();
  let userIds = payload.userIds;
  if (payload.segment) {
    const segment = validatePayload(payload.segment, ["field", "value"], ["field", "value"]);
    const collection = database.collection("users");
    if (!["status", "college"].includes(segment.field)) {
      throw new ApiError(400, "INVALID_SEGMENT", "Notification segments support status or college filters.");
    }
    const field = segment.field === "college" ? "education.college" : segment.field;
    const users = await collection.where(field, "==", segment.value).limit(100).get();
    userIds = users.docs.map((document) => document.id);
  }
  if (!Array.isArray(userIds) || userIds.length === 0 || userIds.length > 100) {
    throw new ApiError(400, "INVALID_RECIPIENTS", "Provide between 1 and 100 user IDs or a supported segment.");
  }

  const batch = database.batch();
  const timestamp = FieldValue.serverTimestamp();
  for (const userId of new Set(userIds)) {
    const reference = database.collection("notifications").doc();
    batch.create(reference, {
      userId,
      type: payload.type || "admin.broadcast",
      title: payload.title.trim(),
      body: payload.body.trim(),
      link: payload.link || null,
      read: false,
      source: "admin",
      createdAt: timestamp,
    });
  }
  await batch.commit();
  await writeAuditLog({
    actorId: request.user.email,
    action: "notifications.sent",
    entity: "notification",
    entityId: "broadcast",
    requestId: request.requestId,
    after: { recipientCount: new Set(userIds).size },
  });
  return response.status(201).json({ data: { recipientCount: new Set(userIds).size } });
}

async function getAdminProfile(request, response) {
  const documentId = encodeURIComponent(request.user.email);
  const snapshot = await getFirestoreDb().collection("admins").doc(documentId).get();
  const storedProfile = snapshot.exists ? snapshot.data() : {};
  return response.json({
    data: {
      email: request.user.email,
      name: storedProfile.name || request.user.email,
      firstName: storedProfile.firstName || "",
      lastName: storedProfile.lastName || "",
      avatar: storedProfile.avatar || "",
      role: "admin",
    },
  });
}

async function updateAdminProfile(request, response) {
  const payload = validatePayload(request.body, ["name", "firstName", "lastName", "avatar"]);
  if (!Object.keys(payload).length) {
    throw new ApiError(400, "EMPTY_PATCH", "Provide a profile field to update.");
  }
  if (payload.name && payload.name.length > 120) {
    throw new ApiError(400, "INVALID_NAME", "The profile name must be 120 characters or fewer.");
  }
  if ([payload.firstName, payload.lastName].some((name) => name !== undefined && (typeof name !== "string" || name.length > 80))) {
    throw new ApiError(400, "INVALID_NAME", "Profile names must be 80 characters or fewer.");
  }
  const documentId = encodeURIComponent(request.user.email);
  await getFirestoreDb().collection("admins").doc(documentId).set({
    email: request.user.email,
    ...payload,
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
  await writeAuditLog({
    actorId: request.user.email,
    action: "admin.profile.updated",
    entity: "admin",
    entityId: documentId,
    requestId: request.requestId,
  });
  return getAdminProfile(request, response);
}

async function listAdmins(request, response) {
  const result = await listCollection("admins", { query: request.query });
  const data = result.data.length
    ? result.data.map(({ id, email, name, role, status, createdAt }) => ({ id, email, name, role, status, createdAt }))
    : [{ id: encodeURIComponent(request.user.email), email: request.user.email, name: request.user.email, role: "admin", status: "active" }];
  return response.json({ data, meta: result.meta });
}

async function getPermissions(request, response) {
  return response.json({
    data: {
      roles: [{
        id: "admin",
        name: "Administrator",
        permissions: ["dashboard:*", "users:*", "applications:*", "records:*", "settings:*", "security:*"],
      }],
      multiAdminManagement: false,
    },
  });
}

async function getDatabaseSettings(request, response) {
  const database = getFirestoreDb();
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || null;
  await database.collection("settings").doc("health").get();
  return response.json({
    data: { provider: "Cloud Firestore", projectId, status: "connected", credentialsConfigured: true },
  });
}

async function updateDatabaseSettings(request, response) {
  throw new ApiError(
    409,
    "DEPLOYMENT_CONFIGURATION_REQUIRED",
    "Database credentials are deployment environment variables and cannot be changed through the admin API.",
  );
}

async function getBackups(request, response) {
  return response.json(await listCollection("backups", { query: request.query }));
}

async function createBackup(request, response) {
  throw new ApiError(503, "BACKUP_PROVIDER_NOT_CONFIGURED", "A managed Firestore export destination and job runner are required before backups can run.");
}

async function getBackupSchedule(request, response) {
  const snapshot = await getFirestoreDb().collection("settings").doc("backupSchedule").get();
  return response.json({ data: snapshot.exists ? snapshot.data() : { enabled: false, cron: null, timezone: "UTC" } });
}

async function updateBackupSchedule(request, response) {
  throw new ApiError(409, "DEPLOYMENT_CONFIGURATION_REQUIRED", "Scheduled jobs are deployment configuration and cannot be changed through the admin API.");
}

module.exports = {
  acknowledgeInboxItem,
  exportAuditLogs,
  getAlert,
  getAlertChannels,
  getAdminProfile,
  getAuditLog,
  getBackups,
  getBackupSchedule,
  getDatabaseSettings,
  getPermissions,
  getInboxUnreadCount,
  decideCertificateRequest,
  listAdmins,
  listAlerts,
  listAuditLogs,
  listCertificateRequests,
  listEnquiries,
  listInbox,
  resolveAlert,
  createBackup,
  sendNotifications,
  updateAlertChannel,
  updateAdminProfile,
  updateBackupSchedule,
  updateDatabaseSettings,
  updateEnquiry,
};
