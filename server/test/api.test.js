const assert = require("node:assert/strict");
const { after, before, describe, it } = require("node:test");

process.env.FRONTEND_URL = "https://alpha-admin-gold.vercel.app,https://internshipmanagement-userpannel.vercel.app";
process.env.INTERNAL_API_SECRET = "test-internal-secret";
process.env.FIREBASE_SERVICE_ACCOUNT_JSON = "";
process.env.AUTH_SECRET = "api-tests-only-secret";

const app = require("../src/server");
const adminRoutes = require("../src/routes/adminRoutes");
const jwt = require("jsonwebtoken");
const {
  cancelCommandAtomically,
  claimCommandForConfirmation,
  completeCommandWithAudit,
  failCommandWithAudit,
  matchIntent,
} = require("../src/controllers/commandController");
const { validateTransition } = require("../src/services/applicationService");
const { validatePayload } = require("../src/services/firestoreRepository");
const { validateApplication, validateProfile } = require("../src/controllers/studentController");
const { createStudentAuthMiddleware } = require("../src/middleware/requireStudentAuth");
const studentRoutes = require("../src/routes/studentRoutes");
const { Timestamp } = require("firebase-admin/firestore");
const { serializeValue } = require("../src/services/firestore");

let server;
let baseUrl;

function adminCookie() {
  const token = jwt.sign({ role: "admin" }, process.env.AUTH_SECRET, {
    algorithm: "HS256",
    audience: "alpha-admin-frontend",
    expiresIn: 600,
    issuer: "alpha-admin-api",
    subject: "admin@example.test",
  });
  return `alpha_admin_auth=${token}`;
}

function createCommandDatabase(initialCommand) {
  const commands = new Map([[initialCommand.id, { ...initialCommand }]]);
  const auditLogs = [];
  let auditId = 0;
  return {
    commands,
    auditLogs,
    collection(name) {
      return {
        doc(id) {
          return { collection: name, id: id || `audit-${++auditId}` };
        },
      };
    },
    async runTransaction(callback) {
      const updates = [];
      const creates = [];
      const transaction = {
        async get(reference) {
          const record = reference.collection === "commands" ? commands.get(reference.id) : undefined;
          return {
            exists: Boolean(record),
            id: reference.id,
            data: () => (record ? { ...record } : undefined),
          };
        },
        update(reference, changes) {
          updates.push([reference, changes]);
        },
        create(reference, value) {
          creates.push([reference, value]);
        },
      };
      const result = await callback(transaction);
      for (const [reference, changes] of updates) {
        Object.assign(commands.get(reference.id), changes);
      }
      for (const [reference, value] of creates) {
        assert.equal(reference.collection, "auditLogs");
        auditLogs.push(value);
      }
      return result;
    },
  };
}

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server) await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

describe("admin API foundation", () => {
  it("registers the core report endpoint groups", () => {
    const routes = adminRoutes.stack.filter((layer) => layer.route).map((layer) => layer.route.path);
    for (const path of [
      "/data",
      "/dashboard/stats",
      "/analytics/applications",
      "/tasks",
      "/applications",
      "/internships",
      "/records",
      "/records/export",
      "/logs/audit",
      "/inbox",
      "/templates/certificates",
      "/backups",
      "/certificate-requests",
    ]) {
      assert.ok(routes.includes(path), `Expected admin route ${path}`);
    }
  });

  it("returns the standard error envelope for unknown API paths", async () => {
    const response = await fetch(`${baseUrl}/api/not-a-real-endpoint`);
    const body = await response.json();
    assert.equal(response.status, 404);
    assert.equal(body.error.code, "NOT_FOUND");
    assert.equal(body.error.requestId, response.headers.get("x-request-id"));
  });

  it("rejects protected admin data without a session", async () => {
    const response = await fetch(`${baseUrl}/api/admin/data`);
    assert.equal(response.status, 401);
    assert.equal(response.headers.get("x-request-id")?.length, 36);
  });

  it("protects the NLP routes with the existing admin session", async () => {
    const response = await fetch(`${baseUrl}/api/admin/ai/actions`);
    const body = await response.json();
    assert.equal(response.status, 401);
    assert.equal(body.message, "Authentication required.");
  });

  it("registers protected student routes without accepting requests anonymously", async () => {
    const routes = studentRoutes.stack.filter((layer) => layer.route).map((layer) => layer.route.path);
    for (const path of ["/profile", "/applications", "/stipends", "/certificates", "/notifications"]) {
      assert.ok(routes.includes(path), `Expected student route ${path}`);
    }

    const response = await fetch(`${baseUrl}/api/student/profile`);
    const body = await response.json();
    assert.equal(response.status, 401);
    assert.equal(body.error.code, "STUDENT_AUTH_REQUIRED");
    assert.equal(body.error.requestId, response.headers.get("x-request-id"));
  });

  it("derives student identity only from a verified Firebase token", async () => {
    const request = { get: () => "Bearer valid-token" };
    const verifiedIdentity = { uid: "verified-uid", email: "student@example.test", email_verified: true };
    const middleware = createStudentAuthMiddleware(async (token) => {
      assert.equal(token, "valid-token");
      return verifiedIdentity;
    });
    let middlewareError;
    await middleware(request, {}, (error) => { middlewareError = error; });
    assert.equal(middlewareError, undefined);
    assert.deepEqual(request.student, {
      uid: "verified-uid",
      email: "student@example.test",
      name: null,
      emailVerified: true,
    });
  });

  it("rejects invalid student tokens without exposing verifier errors", async () => {
    const request = { get: () => "Bearer invalid-token" };
    const middleware = createStudentAuthMiddleware(async () => {
      throw new Error("verifier detail must not reach the client");
    });
    let middlewareError;
    await middleware(request, {}, (error) => { middlewareError = error; });
    assert.equal(middlewareError.statusCode, 401);
    assert.equal(middlewareError.code, "INVALID_STUDENT_TOKEN");
    assert.doesNotMatch(middlewareError.message, /verifier detail/);
  });

  it("validates student-owned profile and application fields", () => {
    assert.deepEqual(validateProfile({ name: " Student ", skills: ["JavaScript"] }), {
      name: "Student",
      skills: ["JavaScript"],
    });
    assert.throws(() => validateProfile({ uid: "other-user" }), { code: "UNKNOWN_FIELD" });
    assert.throws(() => validateProfile({ skills: [""] }), { code: "INVALID_PROFILE" });
    assert.deepEqual(validateApplication({
      internshipId: "internship-1",
      coverLetter: "I am interested.",
    }), { internshipId: "internship-1", coverLetter: "I am interested." });
    assert.throws(() => validateApplication({
      internshipId: "internship-1",
      coverLetter: "I am interested.",
      userId: "other-user",
    }), { code: "UNKNOWN_FIELD" });
    assert.throws(() => validateApplication({ internshipId: "../other", coverLetter: "Hello" }), {
      code: "INVALID_INTERNSHIP_ID",
    });
  });

  it("returns an advisory NLP query plan to an authenticated admin", async () => {
    const response = await fetch(`${baseUrl}/api/admin/ai/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookie() },
      body: JSON.stringify({ query: "find top 5 interns with Python last week" }),
    });
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.data.action, "search");
    assert.equal(body.data.requiresHumanReview, true);
    assert.equal(body.data.result.intent, "candidate_search");
    assert.deepEqual(body.data.result.filters.skills, ["python"]);
    assert.match(body.data.result.answer, /does not fetch records/);
    assert.equal(body.meta.requestId, response.headers.get("x-request-id"));
  });

  it("rejects unknown NLP input fields using the API error envelope", async () => {
    const response = await fetch(`${baseUrl}/api/admin/ai/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookie() },
      body: JSON.stringify({ query: "find candidates", execute: true }),
    });
    const body = await response.json();
    assert.equal(response.status, 400);
    assert.equal(body.error.code, "INVALID_AI_INPUT");
    assert.equal(body.error.requestId, response.headers.get("x-request-id"));
  });

  it("answers preflight for the configured production frontend", async () => {
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: "OPTIONS",
      headers: {
        Origin: "https://alpha-admin-gold.vercel.app",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type",
      },
    });

    it("allows preflight requests from the student portal origin", async () => {
      const response = await fetch(`${baseUrl}/api/student/profile`, {
        method: "OPTIONS",
        headers: {
          Origin: "https://internshipmanagement-userpannel.vercel.app",
          "Access-Control-Request-Method": "GET",
          "Access-Control-Request-Headers": "authorization",
        },
      });
      assert.equal(response.status, 204);
      assert.equal(response.headers.get("access-control-allow-origin"), "https://internshipmanagement-userpannel.vercel.app");
      assert.match(response.headers.get("access-control-allow-headers"), /authorization/i);
    });
    assert.equal(response.status, 204);
    assert.equal(response.headers.get("access-control-allow-origin"), "https://alpha-admin-gold.vercel.app");
    assert.equal(response.headers.get("access-control-allow-credentials"), "true");
  });

  it("returns a structured configuration error when Firestore is missing", async () => {
    const response = await fetch(`${baseUrl}/api/public/internships`);
    const body = await response.json();
    assert.equal(response.status, 503);
    assert.equal(body.error.code, "FIREBASE_NOT_CONFIGURED");
    assert.equal(body.error.requestId, response.headers.get("x-request-id"));
  });

  it("rejects internal requests without the shared secret", async () => {
    const response = await fetch(`${baseUrl}/api/internal/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-internal-secret": "wrong-secret" },
      body: JSON.stringify({}),
    });
    const body = await response.json();
    assert.equal(response.status, 401);
    assert.equal(body.error.code, "INVALID_INTERNAL_CREDENTIAL");
  });

  it("allows only valid application transitions and required decision reasons", () => {
    assert.doesNotThrow(() => validateTransition("Submitted", "Shortlisted"));
    assert.throws(() => validateTransition("Submitted", "Completed"), { code: "INVALID_STATUS_TRANSITION" });
    assert.throws(() => validateTransition("Submitted", "Selected"), { code: "DECISION_REASON_REQUIRED" });
  });

  it("rejects write fields outside a resource's allowlist", () => {
    assert.deepEqual(validatePayload({ title: "Interview" }, ["title"], ["title"]), { title: "Interview" });
    assert.throws(() => validatePayload({ createdBy: "attacker" }, ["title"]), { code: "UNKNOWN_FIELD" });
  });

  it("matches configured intents without executing them", () => {
    const match = matchIntent("please review applications", [{
      id: "review-applications",
      name: "Review applications",
      systemAction: "set_application_status",
      keywords: ["review", "applications"],
      confidenceMin: 0.5,
    }]);
    assert.equal(match.intent.id, "review-applications");
    assert.equal(match.confidence, 1);
  });

  it("atomically claims a command once and audits its terminal state", async () => {
    const database = createCommandDatabase({ id: "cmd-1", status: "pending", proposedAction: "create_task" });
    const command = await claimCommandForConfirmation(database, "cmd-1", "admin@example.test");
    assert.equal(command.status, "pending");
    assert.equal(database.commands.get("cmd-1").status, "processing");
    await assert.rejects(
      claimCommandForConfirmation(database, "cmd-1", "admin@example.test"),
      { statusCode: 409, code: "COMMAND_NOT_PENDING" },
    );

    await completeCommandWithAudit(database, {
      commandId: "cmd-1",
      actorId: "admin@example.test",
      requestId: "request-1",
      proposedAction: "create_task",
    });
    assert.equal(database.commands.get("cmd-1").status, "completed");
    assert.equal(database.auditLogs.length, 1);
    assert.equal(database.auditLogs[0].action, "command.confirmed");
    await assert.rejects(
      claimCommandForConfirmation(database, "cmd-1", "admin@example.test"),
      { statusCode: 409, code: "COMMAND_NOT_PENDING" },
    );
  });

  it("atomically cancels pending commands and marks failed actions for reconciliation", async () => {
    const cancelled = createCommandDatabase({ id: "cmd-cancel", status: "pending" });
    await cancelCommandAtomically(cancelled, {
      commandId: "cmd-cancel",
      actorId: "admin@example.test",
      requestId: "request-2",
    });
    assert.equal(cancelled.commands.get("cmd-cancel").status, "cancelled");
    assert.equal(cancelled.auditLogs[0].action, "command.cancelled");

    const failed = createCommandDatabase({ id: "cmd-fail", status: "processing" });
    await failCommandWithAudit(failed, {
      commandId: "cmd-fail",
      actorId: "admin@example.test",
      requestId: "request-3",
      errorCode: "ACTION_FAILED",
    });
    assert.equal(failed.commands.get("cmd-fail").status, "failed");
    assert.equal(failed.commands.get("cmd-fail").failureCode, "ACTION_FAILED");
    assert.equal(failed.auditLogs[0].action, "command.confirmation_failed");
  });

  it("serializes Firestore timestamps to ISO strings", () => {
    const result = serializeValue({
      at: Timestamp.fromDate(new Date("2026-01-02T03:04:05.000Z")),
      nested: [Timestamp.fromDate(new Date("2026-01-03T00:00:00.000Z"))],
    });
    assert.equal(result.at, "2026-01-02T03:04:05.000Z");
    assert.equal(result.nested[0], "2026-01-03T00:00:00.000Z");
  });
});
