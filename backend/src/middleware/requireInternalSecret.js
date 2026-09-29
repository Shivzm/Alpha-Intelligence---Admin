const { timingSafeEqual } = require("node:crypto");
const { ApiError } = require("../services/firestoreRepository");

function requireInternalSecret(request, response, next) {
  const expected = process.env.INTERNAL_API_SECRET;
  if (!expected) {
    return next(new ApiError(503, "INTERNAL_API_NOT_CONFIGURED", "Internal service authentication is not configured."));
  }

  const supplied = request.get("x-internal-secret") || "";
  const expectedBuffer = Buffer.from(expected);
  const suppliedBuffer = Buffer.from(supplied);
  if (expectedBuffer.length !== suppliedBuffer.length || !timingSafeEqual(expectedBuffer, suppliedBuffer)) {
    return next(new ApiError(401, "INVALID_INTERNAL_CREDENTIAL", "The internal service credential is invalid."));
  }

  return next();
}

module.exports = { requireInternalSecret };
