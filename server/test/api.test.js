const assert = require("node:assert/strict");
const { after, before, describe, it } = require("node:test");

process.env.FRONTEND_URL = "https://alpha-admin-gold.vercel.app";
process.env.INTERNAL_API_SECRET = "test-internal-secret";
process.env.FIREBASE_SERVICE_ACCOUNT_JSON = "";

const app = require("../src/server");
const adminRoutes = require("../src/routes/adminRoutes");
const { matchIntent } = require("../src/controllers/commandController");
const { validateTransition } = require("../src/services/applicationService");
const { validatePayload } = require("../src/services/firestoreRepository");
const { Timestamp } = require("firebase-admin/firestore");
const { serializeValue } = require("../src/services/firestore");

let server;
let baseUrl;

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

  it("answers preflight for the configured production frontend", async () => {
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: "OPTIONS",
      headers: {
        Origin: "https://alpha-admin-gold.vercel.app",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type",
      },
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

  it("serializes Firestore timestamps to ISO strings", () => {
    const result = serializeValue({
      at: Timestamp.fromDate(new Date("2026-01-02T03:04:05.000Z")),
      nested: [Timestamp.fromDate(new Date("2026-01-03T00:00:00.000Z"))],
    });
    assert.equal(result.at, "2026-01-02T03:04:05.000Z");
    assert.equal(result.nested[0], "2026-01-03T00:00:00.000Z");
  });
});
