const { FieldValue } = require("firebase-admin/firestore");
const { ApiError, validatePayload } = require("../services/firestoreRepository");
const { getFirestoreDb } = require("../services/firestore");

const eventKinds = {
  "user.registered": { kind: "user", collection: "users" },
  "profile.updated": { kind: "user", collection: "users" },
  "application.submitted": { kind: "application", collection: "applications" },
  "application.withdrawn": { kind: "application", collection: "applications" },
  "certificate.requested": { kind: "certificate-request", collection: "certificateRequests" },
  "enquiry.created": { kind: "enquiry", collection: "enquiries" },
};

async function ingestEvent(request, response) {
  const payload = validatePayload(request.body, ["eventId", "type", "entityId", "summary"], ["eventId", "type", "entityId", "summary"]);
  if (!Object.hasOwn(eventKinds, payload.type)) {
    throw new ApiError(400, "UNSUPPORTED_EVENT", "This event type is not supported.");
  }
  if (!/^[A-Za-z0-9._-]{1,128}$/.test(payload.eventId) || typeof payload.entityId !== "string" || payload.entityId.length > 200 || payload.summary.length > 250) {
    throw new ApiError(400, "INVALID_EVENT", "The event identifier, entity ID, or summary is invalid.");
  }

  const database = getFirestoreDb();
  const eventReference = database.collection("domainEvents").doc(payload.eventId);
  const inboxReference = database.collection("adminInbox").doc();
  const timestamp = FieldValue.serverTimestamp();
  const result = await database.runTransaction(async (transaction) => {
    const existingEvent = await transaction.get(eventReference);
    if (existingEvent.exists) return { duplicate: true, eventId: payload.eventId };
    const event = eventKinds[payload.type];
    transaction.create(eventReference, {
      type: payload.type,
      entityId: payload.entityId,
      receivedAt: timestamp,
      requestId: request.requestId,
    });
    transaction.create(inboxReference, {
      kind: event.kind,
      refCollection: event.collection,
      refId: payload.entityId,
      summary: payload.summary.trim(),
      createdAt: timestamp,
      ackAt: null,
    });
    return { duplicate: false, eventId: payload.eventId, inboxId: inboxReference.id };
  });
  return response.status(result.duplicate ? 200 : 202).json({ data: result });
}

async function firebaseUserCreated(request, response) {
  const payload = validatePayload(request.body, ["uid", "email", "displayName"], ["uid", "email"]);
  if (payload.uid.length > 128 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
    throw new ApiError(400, "INVALID_USER_EVENT", "A valid Firebase UID and email are required.");
  }

  const database = getFirestoreDb();
  const userReference = database.collection("users").doc(payload.uid);
  const inboxReference = database.collection("adminInbox").doc();
  const timestamp = FieldValue.serverTimestamp();
  const result = await database.runTransaction(async (transaction) => {
    const existing = await transaction.get(userReference);
    const userData = {
      uid: payload.uid,
      email: payload.email.toLowerCase(),
      displayName: payload.displayName?.trim() || "",
      status: existing.exists ? existing.data().status || "active" : "active",
      updatedAt: timestamp,
    };
    if (!existing.exists) userData.createdAt = timestamp;
    transaction.set(userReference, userData, { merge: true });
    if (!existing.exists) {
      transaction.create(inboxReference, {
        kind: "user",
        refCollection: "users",
        refId: payload.uid,
        summary: `New user registered: ${userData.displayName || userData.email}`,
        createdAt: timestamp,
        ackAt: null,
      });
    }
    return { uid: payload.uid, created: !existing.exists };
  });
  return response.status(result.created ? 201 : 200).json({ data: result });
}

async function firebaseUserDeleted(request, response) {
  const payload = validatePayload(request.body, ["uid"], ["uid"]);
  const database = getFirestoreDb();
  const userReference = database.collection("users").doc(payload.uid);
  const timestamp = FieldValue.serverTimestamp();
  const snapshot = await userReference.get();
  if (!snapshot.exists) return response.status(204).end();
  await userReference.update({ status: "deleted", deletedAt: timestamp, updatedAt: timestamp });
  return response.status(204).end();
}

async function runBackup(request, response) {
  throw new ApiError(503, "BACKUP_PROVIDER_NOT_CONFIGURED", "A managed Firestore export destination and job runner are required before backups can run.");
}

async function runCleanup(request, response) {
  throw new ApiError(503, "CLEANUP_POLICY_REQUIRED", "Configure retention periods and the scheduled-job datastore before cleanup can run.");
}

module.exports = { firebaseUserCreated, firebaseUserDeleted, ingestEvent, runBackup, runCleanup };
