const { createHash } = require("node:crypto");
const { FieldValue } = require("firebase-admin/firestore");
const { ApiError, listCollection } = require("../services/firestoreRepository");
const { getFirestoreDb, serializeValue } = require("../services/firestore");

const PROFILE_FIELDS = ["name", "education", "location", "skills", "bio"];
const PROFILE_TEXT_LIMITS = { name: 120, education: 200, location: 160, bio: 2000 };
const MAX_APPLICATIONS_PER_PAGE = 100;
const STUDENT_COLLECTION_FIELDS = {
  stipends: ["internshipTitle", "period", "amount", "currency", "status", "paidAt", "createdAt"],
  certificates: ["name", "title", "program", "issuedAt", "revokedAt"],
  notifications: ["type", "title", "body", "link", "read", "createdAt"],
};

function requireObject(value, message = "A JSON object is required.") {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ApiError(400, "INVALID_BODY", message);
  }
}

function validateProfile(payload) {
  requireObject(payload);
  const profile = {};
  for (const [field, value] of Object.entries(payload)) {
    if (!PROFILE_FIELDS.includes(field)) {
      throw new ApiError(400, "UNKNOWN_FIELD", `Field '${field}' cannot be changed.`);
    }
    if (field === "skills") {
      if (!Array.isArray(value) || value.length > 100 || value.some((skill) => (
        typeof skill !== "string" || !skill.trim() || skill.length > 60
      ))) {
        throw new ApiError(400, "INVALID_PROFILE", "skills must contain at most 100 non-empty strings of at most 60 characters.");
      }
      profile.skills = value.map((skill) => skill.trim());
      continue;
    }
    if (typeof value !== "string" || value.length > PROFILE_TEXT_LIMITS[field]) {
      throw new ApiError(400, "INVALID_PROFILE", `${field} must be a string of at most ${PROFILE_TEXT_LIMITS[field]} characters.`);
    }
    profile[field] = value.trim();
  }
  if (!Object.keys(profile).length) {
    throw new ApiError(400, "EMPTY_PROFILE", "At least one supported profile field is required.");
  }
  return profile;
}

function validateApplication(payload) {
  requireObject(payload);
  const allowedFields = ["internshipId", "coverLetter"];
  const unknownField = Object.keys(payload).find((field) => !allowedFields.includes(field));
  if (unknownField) {
    throw new ApiError(400, "UNKNOWN_FIELD", `Field '${unknownField}' cannot be supplied.`);
  }
  const internshipId = typeof payload.internshipId === "string" ? payload.internshipId.trim() : "";
  const coverLetter = typeof payload.coverLetter === "string" ? payload.coverLetter.trim() : "";
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(internshipId)) {
    throw new ApiError(400, "INVALID_INTERNSHIP_ID", "A valid internshipId is required.");
  }
  if (!coverLetter || coverLetter.length > 5000) {
    throw new ApiError(400, "INVALID_COVER_LETTER", "A cover letter of 1 to 5000 characters is required.");
  }
  return { internshipId, coverLetter };
}

function pickProfile(profile = {}, student) {
  const data = {};
  for (const field of PROFILE_FIELDS) {
    if (profile[field] !== undefined) data[field] = serializeValue(profile[field]);
  }
  return {
    ...data,
    uid: student.uid,
    email: student.email,
    name: data.name || student.name || "",
  };
}

async function getStudentProfile(request, response) {
  const snapshot = await getFirestoreDb().collection("users").doc(request.student.uid).get();
  return response.json({ data: pickProfile(snapshot.exists ? snapshot.data() : {}, request.student) });
}

async function saveStudentProfile(request, response) {
  const profile = validateProfile(request.body);
  const database = getFirestoreDb();
  const reference = database.collection("users").doc(request.student.uid);
  const auditReference = database.collection("auditLogs").doc();
  const existing = await reference.get();
  const timestamp = FieldValue.serverTimestamp();
  const update = {
    ...profile,
    email: request.student.email,
    updatedAt: timestamp,
  };
  if (!existing.exists) update.createdAt = timestamp;

  const batch = database.batch();
  batch.set(reference, update, { merge: true });
  batch.create(auditReference, {
    actorType: "student",
    actorId: request.student.uid,
    action: "student.profile.updated",
    entity: "user",
    entityId: request.student.uid,
    requestId: request.requestId,
    after: { changedFields: Object.keys(profile) },
    source: "student-api",
    at: timestamp,
    createdAt: timestamp,
  });
  await batch.commit();
  return response.json({ data: pickProfile({ ...existing.data(), ...profile }, request.student) });
}

async function listStudentApplications(request, response) {
  const query = { page: request.query.page, limit: request.query.limit || MAX_APPLICATIONS_PER_PAGE };
  const result = await listCollection("applications", {
    filters: [["userId", "==", request.student.uid]],
    query,
  });
  return response.json(result);
}

async function submitStudentApplication(request, response) {
  const { internshipId, coverLetter } = validateApplication(request.body);
  const database = getFirestoreDb();
  const lockId = createHash("sha256")
    .update(`${request.student.uid}\0${internshipId}`)
    .digest("hex");
  const lockReference = database.collection("applicationLocks").doc(lockId);
  const existingApplicationQuery = database.collection("applications")
    .where("userId", "==", request.student.uid)
    .where("internshipId", "==", internshipId)
    .limit(1);
  const internshipReference = database.collection("internships").doc(internshipId);
  const profileReference = database.collection("users").doc(request.student.uid);
  const applicationReference = database.collection("applications").doc();
  const inboxReference = database.collection("adminInbox").doc();
  const auditReference = database.collection("auditLogs").doc();

  const application = await database.runTransaction(async (transaction) => {
    const [lockSnapshot, existingApplicationSnapshot, internshipSnapshot, profileSnapshot] = await Promise.all([
      transaction.get(lockReference),
      transaction.get(existingApplicationQuery),
      transaction.get(internshipReference),
      transaction.get(profileReference),
    ]);
    if (lockSnapshot.exists || !existingApplicationSnapshot.empty) {
      throw new ApiError(409, "ALREADY_APPLIED", "You have already applied for this internship.");
    }
    if (!internshipSnapshot.exists || internshipSnapshot.data().status !== "open") {
      throw new ApiError(404, "INTERNSHIP_NOT_AVAILABLE", "This internship is not currently available.");
    }

    const posting = internshipSnapshot.data();
    const profile = profileSnapshot.exists ? profileSnapshot.data() : {};
    const now = FieldValue.serverTimestamp();
    const name = profile.name || request.student.name || "";
    const applicantSnapshot = {
      name,
      email: request.student.email,
    };
    const record = {
      userId: request.student.uid,
      internshipId,
      internshipTitle: posting.title,
      applicantSnapshot,
      coverLetter,
      status: "Submitted",
      appliedAt: now,
      createdAt: now,
      updatedAt: now,
    };
    transaction.create(applicationReference, record);
    transaction.create(lockReference, {
      applicationId: applicationReference.id,
      userId: request.student.uid,
      internshipId,
      createdAt: now,
    });
    transaction.create(inboxReference, {
      kind: "application",
      refCollection: "applications",
      refId: applicationReference.id,
      summary: `New application submitted for ${posting.title || "an internship"}`,
      createdAt: now,
      ackAt: null,
    });
    transaction.create(auditReference, {
      actorType: "student",
      actorId: request.student.uid,
      action: "application.submitted",
      entity: "application",
      entityId: applicationReference.id,
      requestId: request.requestId,
      after: { status: "Submitted", internshipId },
      source: "student-api",
      at: now,
      createdAt: now,
    });
    return {
      id: applicationReference.id,
      ...record,
      appliedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });

  return response.status(201).json({ data: application });
}

async function listStudentCollection(collectionName, request, response) {
  const result = await listCollection(collectionName, {
    filters: [["userId", "==", request.student.uid]],
    query: { page: request.query.page, limit: request.query.limit || MAX_APPLICATIONS_PER_PAGE },
  });
  const allowedFields = STUDENT_COLLECTION_FIELDS[collectionName];
  return response.json({
    ...result,
    data: result.data.map((item) => ({
      id: item.id,
      ...Object.fromEntries(allowedFields
        .filter((field) => item[field] !== undefined)
        .map((field) => [field, item[field]])),
    })),
  });
}

function listStudentStipends(request, response) {
  return listStudentCollection("stipends", request, response);
}

function listStudentCertificates(request, response) {
  return listStudentCollection("certificates", request, response);
}

function listStudentNotifications(request, response) {
  return listStudentCollection("notifications", request, response);
}

module.exports = {
  getStudentProfile,
  listStudentApplications,
  listStudentCertificates,
  listStudentNotifications,
  listStudentStipends,
  saveStudentProfile,
  submitStudentApplication,
  validateApplication,
  validateProfile,
};
