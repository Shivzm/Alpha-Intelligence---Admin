const { FieldValue } = require("firebase-admin/firestore");
const { ApiError, getDocument, updateDocument, writeAuditLog } = require("../services/firestoreRepository");
const { listDocuments } = require("../services/firestore");

const internshipTransitions = {
  draft: ["open", "archived"],
  open: ["closed", "archived"],
  closed: ["draft", "open", "archived"],
  archived: [],
};
const recordTransitions = {
  active: ["completed", "terminated"],
  completed: [],
  terminated: [],
};

async function changeLifecycleStatus({ collection, id, nextStatus, transitions, request }) {
  const current = await getDocument(collection, id);
  if (!Object.hasOwn(transitions, nextStatus)) {
    throw new ApiError(400, "INVALID_STATUS", "The requested status is not supported.");
  }
  if (!transitions[current.status]?.includes(nextStatus)) {
    throw new ApiError(409, "INVALID_STATUS_TRANSITION", `Cannot change ${collection} from '${current.status}' to '${nextStatus}'.`);
  }
  const updated = await updateDocument(collection, id, {
    status: nextStatus,
    statusChangedBy: request.user.email,
    statusChangedAt: FieldValue.serverTimestamp(),
  });
  await writeAuditLog({
    actorId: request.user.email,
    action: `${collection}.status.changed`,
    entity: collection,
    entityId: id,
    requestId: request.requestId,
    before: { status: current.status },
    after: { status: nextStatus },
  });
  return updated;
}

async function changeInternshipStatus(request, response) {
  const status = request.body?.status;
  if (typeof status !== "string") throw new ApiError(400, "INVALID_STATUS", "A status is required.");
  const data = await changeLifecycleStatus({
    collection: "internships",
    id: request.params.id,
    nextStatus: status,
    transitions: internshipTransitions,
    request,
  });
  return response.json({ data });
}

async function changeRecordStatus(request, response) {
  const status = request.body?.status;
  if (typeof status !== "string") throw new ApiError(400, "INVALID_STATUS", "A status is required.");
  const data = await changeLifecycleStatus({
    collection: "records",
    id: request.params.id,
    nextStatus: status,
    transitions: recordTransitions,
    request,
  });
  return response.json({ data });
}

function cursorToDate(value) {
  if (!value) return new Date(0);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ApiError(400, "INVALID_CURSOR", "The since cursor must be a valid date or ISO timestamp.");
  }
  return date;
}

function afterCursor(document, cursor) {
  const timestamp = document.updatedAt || document.createdAt || document.appliedAt || document.at;
  const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
  return !Number.isNaN(date.getTime()) && date > cursor;
}

async function getChanges(request, response) {
  const cursor = cursorToDate(request.query.since);
  const [applications, users, certificateRequests] = await Promise.all([
    listDocuments("applications", 500),
    listDocuments("users", 500),
    listDocuments("certificateRequests", 500),
  ]);
  const now = new Date();
  return response.json({
    data: {
      applications: applications.filter((item) => afterCursor(item, cursor)),
      users: users.filter((item) => afterCursor(item, cursor)),
      certificateRequests: certificateRequests.filter((item) => afterCursor(item, cursor)),
    },
    meta: { cursor: now.toISOString(), sampleLimitPerCollection: 500 },
  });
}

module.exports = { changeInternshipStatus, changeRecordStatus, getChanges };
