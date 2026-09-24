const crypto = require("crypto");

function getAdminEmail() {
  return process.env.ADMIN_EMAIL;
}

function verifyPassword(password) {
  const [salt, storedHash] = (process.env.ADMIN_PASSWORD_HASH || "").split(":");
  if (!salt || !storedHash || !password) return false;

  const derivedHash = crypto.scryptSync(password, salt, 64).toString("hex");
  const storedBuffer = Buffer.from(storedHash, "hex");
  const derivedBuffer = Buffer.from(derivedHash, "hex");

  return (
    storedBuffer.length === derivedBuffer.length &&
    crypto.timingSafeEqual(storedBuffer, derivedBuffer)
  );
}

function createSessionToken(email) {
  const expiresAt = Date.now() + 8 * 60 * 60 * 1000;
  const payload = Buffer.from(
    JSON.stringify({ email, expiresAt }),
  ).toString("base64url");
  const signature = crypto
    .createHmac("sha256", process.env.AUTH_SECRET)
    .update(payload)
    .digest("base64url");

  return `${payload}.${signature}`;
}

function verifySessionToken(token) {
  const [payload, signature] = (token || "").split(".");
  if (!payload || !signature || !process.env.AUTH_SECRET) return null;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.AUTH_SECRET)
    .update(payload)
    .digest("base64url");
  const receivedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    receivedBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(receivedBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString());
    return session.expiresAt > Date.now() ? session : null;
  } catch {
    return null;
  }
}

function login(request, response) {
  const { email, password } = request.body || {};

  if (!getAdminEmail() || !process.env.ADMIN_PASSWORD_HASH || !process.env.AUTH_SECRET) {
    return response.status(500).json({
      message: "The backend authentication credentials are not configured.",
    });
  }

  if (email !== getAdminEmail() || !verifyPassword(password)) {
    return response.status(401).json({ message: "Invalid credentials." });
  }

  return response.json({
    token: createSessionToken(email),
    user: { email, role: "admin" },
  });
}

function requireAuth(request, response, next) {
  const authorization = request.get("authorization") || "";
  const token = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : "";
  const session = verifySessionToken(token);

  if (!session) {
    return response.status(401).json({ message: "Authentication required." });
  }

  request.user = session;
  return next();
}

function requestPasswordReset(request, response) {
  const { email } = request.body || {};

  if (!email) {
    return response.status(400).json({ message: "Email is required." });
  }

  return response.status(202).json({
    message: "If an account exists for that email, a reset link will be sent.",
  });
}

module.exports = { login, requestPasswordReset, requireAuth };