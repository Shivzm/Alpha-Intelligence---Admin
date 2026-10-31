const { FieldValue } = require("firebase-admin/firestore");
const {
  ApiError,
  createDocument,
  getDocument,
  listCollection,
  updateDocument,
  validatePayload,
  writeAuditLog,
} = require("../services/firestoreRepository");
const { getFirestoreDb } = require("../services/firestore");
const { changeApplicationsStatus } = require("../services/applicationService");

function getCommandReference(database, commandId) {
  return database.collection("commands").doc(commandId);
}

function assertCommandExists(snapshot) {
  if (!snapshot.exists) {
    throw new ApiError(404, "NOT_FOUND", "The requested resource was not found.");
  }
}

function assertCommandStatus(command, expectedStatus, errorCode, message) {
  if (command.status !== expectedStatus) {
    throw new ApiError(409, errorCode, message);
  }
}

async function claimCommandForConfirmation(database, commandId, actorId) {
  const reference = getCommandReference(database, commandId);
  return database.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(reference);
    assertCommandExists(snapshot);
    const command = { id: snapshot.id, ...snapshot.data() };
    assertCommandStatus(command, "pending", "COMMAND_NOT_PENDING", "Only pending commands can be confirmed.");
    transaction.update(reference, {
      status: "processing",
      confirmationStartedAt: FieldValue.serverTimestamp(),
      confirmedBy: actorId,
    });
    return command;
  });
}

async function completeCommandWithAudit(database, { commandId, actorId, requestId, proposedAction }) {
  const reference = getCommandReference(database, commandId);
  const auditReference = database.collection("auditLogs").doc();
  await database.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(reference);
    assertCommandExists(snapshot);
    const command = snapshot.data();
    assertCommandStatus(command, "processing", "COMMAND_NOT_PROCESSING", "The command is not being processed.");
    const timestamp = FieldValue.serverTimestamp();
    transaction.update(reference, {
      status: "completed",
      confirmedAt: timestamp,
    });
    transaction.create(auditReference, {
      actorType: "admin",
      actorId,
      action: "command.confirmed",
      entity: "command",
      entityId: commandId,
      requestId,
      before: { status: "processing" },
      after: { status: "completed", proposedAction },
      source: "ui",
      at: timestamp,
      createdAt: timestamp,
    });
  });
}

async function failCommandWithAudit(database, { commandId, actorId, requestId, errorCode }) {
  const reference = getCommandReference(database, commandId);
  const auditReference = database.collection("auditLogs").doc();
  const safeErrorCode = typeof errorCode === "string" && /^[A-Z0-9_]{1,80}$/.test(errorCode)
    ? errorCode
    : "ACTION_FAILED";
  await database.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(reference);
    assertCommandExists(snapshot);
    const command = snapshot.data();
    assertCommandStatus(command, "processing", "COMMAND_NOT_PROCESSING", "The command is not being processed.");
    const timestamp = FieldValue.serverTimestamp();
    transaction.update(reference, {
      status: "failed",
      failureCode: safeErrorCode,
      failedAt: timestamp,
    });
    transaction.create(auditReference, {
      actorType: "admin",
      actorId,
      action: "command.confirmation_failed",
      entity: "command",
      entityId: commandId,
      requestId,
      before: { status: "processing" },
      after: { status: "failed", errorCode: safeErrorCode },
      source: "ui",
      at: timestamp,
      createdAt: timestamp,
    });
  });
}

async function cancelCommandAtomically(database, { commandId, actorId, requestId }) {
  const reference = getCommandReference(database, commandId);
  const auditReference = database.collection("auditLogs").doc();
  await database.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(reference);
    assertCommandExists(snapshot);
    const command = snapshot.data();
    assertCommandStatus(command, "pending", "COMMAND_NOT_PENDING", "Only pending commands can be cancelled.");
    const timestamp = FieldValue.serverTimestamp();
    transaction.update(reference, {
      status: "cancelled",
      cancelledBy: actorId,
      cancelledAt: timestamp,
    });
    transaction.create(auditReference, {
      actorType: "admin",
      actorId,
      action: "command.cancelled",
      entity: "command",
      entityId: commandId,
      requestId,
      before: { status: "pending" },
      after: { status: "cancelled" },
      source: "ui",
      at: timestamp,
      createdAt: timestamp,
    });
  });
}

function matchIntent(input, intents) {
  const normalizedInput = input.toLowerCase();
  let bestMatch = null;

  for (const intent of intents) {
    if (intent.enabled === false || !Array.isArray(intent.keywords)) continue;
    const matchedKeywords = intent.keywords
      .filter((keyword) => typeof keyword === "string" && keyword.trim())
      .filter((keyword) => normalizedInput.includes(keyword.toLowerCase()));
    const confidence = intent.keywords.length ? matchedKeywords.length / intent.keywords.length : 0;
    if (matchedKeywords.length && confidence >= (Number(intent.confidenceMin) || 0) && (!bestMatch || confidence > bestMatch.confidence)) {
      bestMatch = { intent, matchedKeywords, confidence };
    }
  }
  return bestMatch;
}

async function submitCommand(request, response) {
  const payload = validatePayload(request.body, ["input", "actionPayload"], ["input"]);
  const input = payload.input.trim();
  if (!input || input.length > 1000) {
    throw new ApiError(400, "INVALID_COMMAND", "Command text must be between 1 and 1000 characters.");
  }

  const startedAt = Date.now();
  const intents = await listCollection("intents", { query: { page: 1, limit: 100 } });
  const match = matchIntent(input, intents.data);
  const command = await createDocument("commands", {
    input,
    intentId: match?.intent.id || null,
    matchedKeywords: match?.matchedKeywords || [],
    confidence: match?.confidence || 0,
    proposedAction: match?.intent.systemAction || null,
    actionPayload: payload.actionPayload || null,
    status: match ? "pending" : "unrecognized",
    createdBy: request.user.email,
  });
  await createDocument("inferences", {
    commandId: command.id,
    intentId: command.intentId,
    confidence: command.confidence,
    latencyMs: Date.now() - startedAt,
    createdBy: request.user.email,
  });

  return response.status(201).json({ data: command });
}

async function listCommands(request, response) {
  return response.json(await listCollection("commands", {
    filters: request.query.status ? [["status", "==", request.query.status]] : [],
    query: request.query,
  }));
}

async function getCommand(request, response) {
  return response.json({ data: await getDocument("commands", request.params.id) });
}

async function executeCommandAction(command, request) {
  const actionPayload = command.actionPayload || {};
  switch (command.proposedAction) {
    case "set_application_status":
      return changeApplicationsStatus({
        applicationIds: actionPayload.applicationIds,
        nextStatus: actionPayload.to,
        reason: actionPayload.reason,
        actorId: request.user.email,
        requestId: request.requestId,
      });
    case "resolve_alert": {
      if (!actionPayload.alertId) {
        throw new ApiError(400, "ACTION_PAYLOAD_REQUIRED", "The command requires an alertId.");
      }
      const updated = await updateDocument("alerts", actionPayload.alertId, {
        resolved: true,
        resolvedBy: request.user.email,
        resolvedAt: FieldValue.serverTimestamp(),
      });
      return { alert: updated };
    }
    case "create_task": {
      const task = validatePayload(actionPayload, ["title", "description", "status", "assignee", "dueDate", "priority"], ["title"]);
      return createDocument("tasks", { ...task, createdBy: request.user.email });
    }
    default:
      throw new ApiError(501, "ACTION_NOT_SUPPORTED", "This intent has no configured action executor.");
  }
}

async function confirmCommand(request, response) {
  const database = getFirestoreDb();
  const command = await claimCommandForConfirmation(database, request.params.id, request.user.email);
  let result;
  try {
    result = await executeCommandAction(command, request);
  } catch (error) {
    await failCommandWithAudit(database, {
      commandId: command.id,
      actorId: request.user.email,
      requestId: request.requestId,
      errorCode: error.code,
    });
    throw error;
  }
  await completeCommandWithAudit(database, {
    commandId: command.id,
    actorId: request.user.email,
    requestId: request.requestId,
    proposedAction: command.proposedAction,
  });
  return response.json({ data: { id: command.id, status: "completed", result } });
}

async function cancelCommand(request, response) {
  const database = getFirestoreDb();
  await cancelCommandAtomically(database, {
    commandId: request.params.id,
    actorId: request.user.email,
    requestId: request.requestId,
  });
  return response.json({ data: await getDocument("commands", request.params.id) });
}

async function testIntent(request, response) {
  const payload = validatePayload(request.body, ["phrase"], ["phrase"]);
  const intents = await listCollection("intents", { query: { page: 1, limit: 100 } });
  const match = matchIntent(payload.phrase, intents.data);
  return response.json({
    data: match
      ? { intentId: match.intent.id, name: match.intent.name, proposedAction: match.intent.systemAction, confidence: match.confidence, matchedKeywords: match.matchedKeywords }
      : { intentId: null, proposedAction: null, confidence: 0, matchedKeywords: [] },
  });
}

async function deleteIntent(request, response) {
  const database = getFirestoreDb();
  const reference = database.collection("intents").doc(request.params.id);
  const snapshot = await reference.get();
  if (!snapshot.exists) throw new ApiError(404, "INTENT_NOT_FOUND", "The intent was not found.");
  await reference.delete();
  await writeAuditLog({
    actorId: request.user.email,
    action: "intent.deleted",
    entity: "intent",
    entityId: request.params.id,
    requestId: request.requestId,
  });
  return response.status(204).end();
}

module.exports = {
  cancelCommand,
  cancelCommandAtomically,
  claimCommandForConfirmation,
  completeCommandWithAudit,
  confirmCommand,
  deleteIntent,
  getCommand,
  listCommands,
  matchIntent,
  failCommandWithAudit,
  submitCommand,
  testIntent,
};
