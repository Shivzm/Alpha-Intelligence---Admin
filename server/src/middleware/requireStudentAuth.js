const { getAuth } = require("firebase-admin/auth");
const { ApiError } = require("../services/firestoreRepository");
const { getFirebaseApp } = require("../services/firestore");

function createStudentAuthMiddleware(verifyToken) {
  return async function requireStudentAuth(request, response, next) {
    const authorization = request.get("authorization") || "";
    if (!authorization.startsWith("Bearer ")) {
      return next(new ApiError(401, "STUDENT_AUTH_REQUIRED", "A Firebase ID token is required."));
    }

    const token = authorization.slice(7).trim();
    if (!token) {
      return next(new ApiError(401, "STUDENT_AUTH_REQUIRED", "A Firebase ID token is required."));
    }

    try {
      const identity = await verifyToken(token);
      request.student = {
        uid: identity.uid,
        email: identity.email || null,
        name: identity.name || null,
        emailVerified: identity.email_verified === true,
      };
      return next();
    } catch (error) {
      if (error.statusCode === 503) return next(error);
      return next(new ApiError(401, "INVALID_STUDENT_TOKEN", "The Firebase ID token is invalid or expired."));
    }
  };
}

const requireStudentAuth = createStudentAuthMiddleware((token) => (
  getAuth(getFirebaseApp()).verifyIdToken(token, true)
));

module.exports = { createStudentAuthMiddleware, requireStudentAuth };
