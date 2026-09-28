const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const jwksClient = require("jwks-rsa");

const AUTH_COOKIE_NAME = "alpha_admin_auth";
const TOKEN_TTL_SECONDS = 10 * 60;
const providerKeys = {
  google: jwksClient({
    jwksUri: "https://www.googleapis.com/oauth2/v3/certs",
    cache: true,
    rateLimit: true,
  }),
};

function getCookieOptions() {
  const sameSite = process.env.AUTH_COOKIE_SAME_SITE || (
    process.env.NODE_ENV === "production" ? "none" : "lax"
  );

  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" || sameSite === "none",
    sameSite,
    path: "/",
    maxAge: TOKEN_TTL_SECONDS * 1000,
  };
}

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

function createAuthToken(email) {
  return jwt.sign(
    { role: "admin" },
    process.env.AUTH_SECRET,
    {
      algorithm: "HS256",
      audience: "alpha-admin-frontend",
      expiresIn: TOKEN_TTL_SECONDS,
      issuer: "alpha-admin-api",
      subject: email,
    },
  );
}

function setAdminSession(email, response) {
  const token = createAuthToken(email);
  const session = verifyAuthToken(token);
  response.cookie(AUTH_COOKIE_NAME, token, getCookieOptions());

  return {
    expiresAt: session.expiresAt,
    user: { email, role: "admin" },
  };
}

function verifyAuthToken(token) {
  if (!token || !process.env.AUTH_SECRET) return null;

  try {
    const payload = jwt.verify(token, process.env.AUTH_SECRET, {
      algorithms: ["HS256"],
      audience: "alpha-admin-frontend",
      issuer: "alpha-admin-api",
    });

    if (typeof payload === "string" || payload.role !== "admin" || !payload.sub) {
      return null;
    }

    return {
      email: payload.sub,
      expiresAt: payload.exp * 1000,
      role: payload.role,
    };
  } catch {
    return null;
  }
}

async function verifyGoogleCredential(credential) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const decoded = typeof credential === "string"
    ? jwt.decode(credential, { complete: true })
    : null;

  if (!clientId || !decoded?.header?.kid || decoded.header.alg !== "RS256") {
    return null;
  }

  try {
    const signingKey = await providerKeys.google.getSigningKey(decoded.header.kid);
    const claims = jwt.verify(credential, signingKey.getPublicKey(), {
      algorithms: ["RS256"],
      audience: clientId,
      issuer: ["https://accounts.google.com", "accounts.google.com"],
    });

    if (typeof claims === "string") return null;

    const emailIsVerified = claims.email_verified === true || claims.email_verified === "true";
    if (!claims.sub || !claims.email || !emailIsVerified) return null;

    return { email: claims.email };
  } catch {
    return null;
  }
}

async function loginWithGoogle(request, response) {
  const credential = request.body?.credential;
  const clientId = process.env.GOOGLE_CLIENT_ID;

  if (!clientId) {
    return response.status(503).json({ message: "Google sign-in is not configured." });
  }

  if (!getAdminEmail() || !process.env.AUTH_SECRET) {
    return response.status(500).json({
      message: "The backend authentication credentials are not configured.",
    });
  }

  const identity = await verifyGoogleCredential(credential);
  if (!identity || identity.email.toLowerCase() !== getAdminEmail().toLowerCase()) {
    return response.status(401).json({ message: "This account is not authorized." });
  }

  return response.json(setAdminSession(identity.email, response));
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

  return response.json(setAdminSession(email, response));
}

function requireAuth(request, response, next) {
  const session = verifyAuthToken(request.cookies?.[AUTH_COOKIE_NAME]);

  if (!session) {
    return response.status(401).json({ message: "Authentication required." });
  }

  request.user = session;
  return next();
}

function getCurrentUser(request, response) {
  return response.json({
    expiresAt: request.user.expiresAt,
    user: { email: request.user.email, role: request.user.role },
  });
}

function logout(request, response) {
  const { maxAge, ...options } = getCookieOptions();
  response.clearCookie(AUTH_COOKIE_NAME, options);
  return response.status(204).end();
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

module.exports = {
  getCurrentUser,
  login,
  loginWithGoogle,
  logout,
  requestPasswordReset,
  requireAuth,
};