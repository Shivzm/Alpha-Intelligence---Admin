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
  const command = await getDocument("commands", request.params.id);
  if (command.status !== "pending") {
    throw new ApiError(409, "COMMAND_NOT_PENDING", "Only pending commands can be confirmed.");
  }
  const result = await executeCommandAction(command, request);
  await updateDocument("commands", command.id, {
    status: "completed",
    confirmedBy: request.user.email,
    confirmedAt: FieldValue.serverTimestamp(),
  });
  await writeAuditLog({
    actorId: request.user.email,
    action: "command.confirmed",
    entity: "command",
    entityId: command.id,
    requestId: request.requestId,
    after: { status: "completed", proposedAction: command.proposedAction },
  });
  return response.json({ data: { id: command.id, status: "completed", result } });
}

async function cancelCommand(request, response) {
  const command = await getDocument("commands", request.params.id);
  if (command.status !== "pending") {
    throw new ApiError(409, "COMMAND_NOT_PENDING", "Only pending commands can be cancelled.");
  }
  const updated = await updateDocument("commands", command.id, {
    status: "cancelled",
    cancelledBy: request.user.email,
    cancelledAt: FieldValue.serverTimestamp(),
  });
  await writeAuditLog({
    actorId: request.user.email,
    action: "command.cancelled",
    entity: "command",
    entityId: command.id,
    requestId: request.requestId,
  });
  return response.json({ data: updated });
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
  confirmCommand,
  deleteIntent,
  getCommand,
  listCommands,
  matchIntent,
  submitCommand,
  testIntent,
};
