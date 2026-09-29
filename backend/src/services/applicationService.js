const { FieldValue } = require("firebase-admin/firestore");
const { ApiError } = require("./firestoreRepository");
const { getFirestoreDb } = require("./firestore");

const allowedTransitions = {
  Submitted: ["Under Review", "Shortlisted", "On Hold", "Selected", "Rejected"],
  "Under Review": ["Shortlisted", "On Hold", "Selected", "Rejected"],
  Shortlisted: ["Under Review", "On Hold", "Selected", "Rejected"],
  "On Hold": ["Under Review", "Shortlisted", "Selected", "Rejected"],
  Selected: [],
  Rejected: [],
  Withdrawn: [],
  Onboarded: [],
  Completed: [],
};

function validateTransition(currentStatus, nextStatus, reason) {
  if (!Object.hasOwn(allowedTransitions, nextStatus)) {
    throw new ApiError(400, "INVALID_APPLICATION_STATUS", "The requested application status is invalid.");
  }
  if (currentStatus && !allowedTransitions[currentStatus]?.includes(nextStatus)) {
    throw new ApiError(409, "INVALID_STATUS_TRANSITION", "That application status transition is not allowed.");
  }
  if (["Selected", "Rejected"].includes(nextStatus) && !reason?.trim()) {
    throw new ApiError(400, "DECISION_REASON_REQUIRED", "A reason is required for this decision.");
  }
}

function createSideEffectReferences(database, applicationId, userId) {
  return {
    history: database.collection("applicationHistory").doc(),
    audit: database.collection("auditLogs").doc(),
    notification: database.collection("notifications").doc(),
    applicationId,
    userId,
  };
}

function writeStatusSideEffects(transaction, references, { currentStatus, nextStatus, reason, actorId, requestId }) {
  const timestamp = FieldValue.serverTimestamp();
  const history = {
    applicationId: references.applicationId,
    from: currentStatus,
    to: nextStatus,
    actorType: "admin",
    actorId,
    reason: reason || null,
    at: timestamp,
    createdAt: timestamp,
  };

  transaction.create(references.history, history);
  transaction.create(references.audit, {
    actorType: "admin",
    actorId,
    action: "application.status.changed",
    entity: "application",
    entityId: references.applicationId,
    before: { status: currentStatus },
    after: { status: nextStatus },
    source: "ui",
    requestId,
    at: timestamp,
    createdAt: timestamp,
  });
  transaction.create(references.notification, {
    userId: references.userId,
    type: "application.status",
    title: "Application status updated",
    body: `Your application status changed to ${nextStatus}.`,
    link: `/applications/${references.applicationId}`,
    read: false,
    source: "admin",
    createdAt: timestamp,
  });

  return history;
}

async function changeApplicationStatus({ applicationId, nextStatus, reason, actorId, requestId }) {
  validateTransition(undefined, nextStatus, reason);
  const database = getFirestoreDb();
  const applicationReference = database.collection("applications").doc(applicationId);
  const references = createSideEffectReferences(database, applicationId, "");

  const history = await database.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(applicationReference);
    if (!snapshot.exists) {
      throw new ApiError(404, "APPLICATION_NOT_FOUND", "The application was not found.");
    }

    const application = snapshot.data();
    validateTransition(application.status, nextStatus, reason);
    references.userId = application.userId;
    const timestamp = FieldValue.serverTimestamp();
    transaction.update(applicationReference, {
      status: nextStatus,
      decision: { by: actorId, reason: reason || null, at: timestamp },
      updatedAt: timestamp,
    });
    return writeStatusSideEffects(transaction, references, {
      currentStatus: application.status,
      nextStatus,
      reason,
      actorId,
      requestId,
    });
  });

  return {
    id: applicationId,
    status: nextStatus,
    history: [{ ...history, at: new Date().toISOString(), createdAt: new Date().toISOString() }],
  };
}

async function changeApplicationsStatus({ applicationIds, nextStatus, reason, actorId, requestId }) {
  if (!Array.isArray(applicationIds) || applicationIds.length === 0 || applicationIds.length > 100) {
    throw new ApiError(400, "INVALID_APPLICATION_IDS", "Provide between 1 and 100 application IDs.");
  }
  if (new Set(applicationIds).size !== applicationIds.length || applicationIds.some((id) => typeof id !== "string" || !id.trim())) {
    throw new ApiError(400, "INVALID_APPLICATION_IDS", "Application IDs must be unique non-empty strings.");
  }

  const database = getFirestoreDb();
  const references = applicationIds.map((applicationId) => ({
    applicationReference: database.collection("applications").doc(applicationId),
    sideEffects: createSideEffectReferences(database, applicationId, ""),
  }));

  return database.runTransaction(async (transaction) => {
    const snapshots = await transaction.getAll(...references.map(({ applicationReference }) => applicationReference));
    const applications = snapshots.map((snapshot, index) => {
      if (!snapshot.exists) {
        throw new ApiError(404, "APPLICATION_NOT_FOUND", `Application '${applicationIds[index]}' was not found.`);
      }
      const application = snapshot.data();
      validateTransition(application.status, nextStatus, reason);
      return application;
    });

    return references.map(({ applicationReference, sideEffects }, index) => {
      const application = applications[index];
      sideEffects.userId = application.userId;
      const timestamp = FieldValue.serverTimestamp();
      transaction.update(applicationReference, {
        status: nextStatus,
        decision: { by: actorId, reason: reason || null, at: timestamp },
        updatedAt: timestamp,
      });
      writeStatusSideEffects(transaction, sideEffects, {
        currentStatus: application.status,
        nextStatus,
        reason,
        actorId,
        requestId,
      });
      return { id: applicationIds[index], status: nextStatus };
    });
  });
}

module.exports = { changeApplicationStatus, changeApplicationsStatus, validateTransition };
