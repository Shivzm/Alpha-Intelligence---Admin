const { FieldValue } = require("firebase-admin/firestore");
const { ApiError, listCollection } = require("../services/firestoreRepository");
const { countDocuments, getFirestoreDb } = require("../services/firestore");

async function listPublicInternships(request, response) {
  const result = await listCollection("internships", {
    filters: [["status", "==", "open"]],
    query: { page: request.query.page, limit: request.query.limit || 12 },
  });
  const data = result.data.map(({ id, title, domain, description, requirements, mode, location, durationWeeks, stipend, openings, deadline }) => ({
    id, title, domain, description, requirements, mode, location, durationWeeks, stipend, openings, deadline,
  }));
  response.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
  return response.json({ data, meta: result.meta });
}

async function getPublicStats(request, response) {
  const [openRoles, applicants, issuedCertificates] = await Promise.all([
    countDocuments("internships", [["status", "==", "open"]]),
    countDocuments("applications"),
    countDocuments("certificates"),
  ]);
  response.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
  return response.json({ data: { openRoles, applicants, certificatesIssued: issuedCertificates } });
}

async function submitEnquiry(request, response) {
  const payload = request.body || {};
  const allowedFields = ["name", "email", "message"];
  for (const key of Object.keys(payload)) {
    if (!allowedFields.includes(key)) {
      throw new ApiError(400, "UNKNOWN_FIELD", `Field '${key}' is not supported.`);
    }
  }
  const name = typeof payload.name === "string" ? payload.name.trim() : "";
  const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
  const message = typeof payload.message === "string" ? payload.message.trim() : "";
  if (!name || name.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || !message || message.length > 5000) {
    throw new ApiError(400, "INVALID_ENQUIRY", "Provide a name, valid email address, and message of at most 5000 characters.");
  }

  const database = getFirestoreDb();
  const enquiryReference = database.collection("enquiries").doc();
  const inboxReference = database.collection("adminInbox").doc();
  const timestamp = FieldValue.serverTimestamp();
  const batch = database.batch();
  batch.create(enquiryReference, { name, email, message, status: "new", createdAt: timestamp });
  batch.create(inboxReference, {
    kind: "enquiry",
    refCollection: "enquiries",
    refId: enquiryReference.id,
    summary: `New enquiry from ${name}`,
    createdAt: timestamp,
    ackAt: null,
  });
  await batch.commit();
  return response.status(201).json({ data: { id: enquiryReference.id, status: "new" } });
}

async function verifyCertificate(request, response) {
  const code = request.params.code.trim();
  if (!code || code.length > 100) {
    throw new ApiError(400, "INVALID_VERIFICATION_CODE", "The verification code is invalid.");
  }
  const snapshot = await getFirestoreDb()
    .collection("certificates")
    .where("verificationCode", "==", code)
    .limit(1)
    .get();
  if (snapshot.empty) {
    return response.status(404).json({ data: { valid: false, revoked: false } });
  }

  const certificate = snapshot.docs[0].data();
  const revoked = Boolean(certificate.revokedAt);
  const issuedAt = certificate.issuedAt?.toDate
    ? certificate.issuedAt.toDate().toISOString()
    : certificate.issuedAt || null;
  return response.json({
    data: {
      valid: !revoked,
      holder: certificate.holderName || certificate.holder || null,
      program: certificate.program || null,
      issuedAt,
      revoked,
    },
  });
}

module.exports = { getPublicStats, listPublicInternships, submitEnquiry, verifyCertificate };
