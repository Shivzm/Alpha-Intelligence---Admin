const test = require("node:test");
const assert = require("node:assert/strict");
const { AI_ACTIONS, ai } = require("../src/services/nlpService");

const nlpPromise = Promise.all([
  import("../src/nlp/skills.mjs"),
  import("../src/nlp/matcher.mjs"),
  import("../src/nlp/intents.mjs"),
  import("../src/nlp/resume.mjs"),
  import("../src/nlp/feedback.mjs"),
  import("../src/nlp/summarize.mjs"),
]);

test("skill extraction respects word boundaries and canonical aliases", async () => {
  const [skills] = await nlpPromise;
  assert.deepEqual(skills.extractSkills("Send email. Built HTML pages and a mail template."), ["html"]);
  assert.equal(skills.canonicalSkill("ReactJS"), "react");
  assert.deepEqual(skills.extractSkills("React Native, C++, ML and Node.js.").sort(), [
    "c++",
    "machine learning",
    "node.js",
    "react native",
  ]);
});

test("candidate matching returns explainable skill gaps", async () => {
  const [, matcher] = await nlpPromise;
  const result = matcher.matchCandidate(
    { preferredRole: "Frontend Developer", skills: ["ReactJS", "JavaScript"] },
    { title: "Frontend Developer Intern", skills: ["react", "javascript", "html"] },
  );
  assert.deepEqual(result.matchedSkills.sort(), ["javascript", "react"]);
  assert.deepEqual(result.missingSkills, ["html"]);
  assert.ok(result.score > 60 && result.score <= 100);
});

test("intent detection and search filters handle natural phrasing", async () => {
  const [, , intents] = await nlpPromise;
  assert.equal(intents.detectIntent("find top 5 interns with python").intent, "candidate_search");
  assert.equal(intents.detectIntent("hello there").intent, "general");
  const filters = intents.extractSearchTerms("top 5 approved interns with python last week", new Date("2026-10-06T00:00:00Z"));
  assert.deepEqual(filters.skills, ["python"]);
  assert.equal(filters.status, "approved");
  assert.equal(filters.limit, 5);
  assert.deepEqual(filters.dateRange, { from: "2026-09-23", to: "2026-09-30" });
});

test("resume extraction returns structured contact and skills", async () => {
  const [, , , resume] = await nlpPromise;
  const result = resume.extractResume(`Rahul Kumar
rahul@example.com | 98765 43210

Education
B.Tech in Computer Science, Gandhi Institute of Technology, 2022 - 2026, CGPA: 8.4/10

Skills
JavaScript, HTML, ReactJS, ML`);
  assert.equal(result.name, "Rahul Kumar");
  assert.equal(result.contact.email, "rahul@example.com");
  assert.equal(result.contact.phone, "+919876543210");
  assert.ok(["javascript", "html", "react", "machine learning"].every((skill) => result.skills.includes(skill)));
});

test("feedback, progress, and workflow helpers return advisory results", async () => {
  const [, , , , feedback, summarize] = await nlpPromise;
  assert.equal(feedback.classifyFeedback("not good, always late").label, "needs_improvement");
  const progress = summarize.summarizeProgress({
    tasks: [{ status: "completed" }, { status: "pending", dueDate: "2020-01-01" }],
  });
  assert.equal(progress.completionPercentage, 50);
  assert.equal(progress.overdueTasks.length, 1);
  assert.equal(summarize.recommendAction({ status: "approved" }).knownStatus, true);
});

test("service actions return review-required responses and reject unsafe input", async () => {
  assert.deepEqual(AI_ACTIONS, [
    "resume-extract",
    "match-candidate",
    "search",
    "summarize-application",
    "summarize-progress",
    "classify-feedback",
    "recommend-next-action",
  ]);
  const response = await ai("classify-feedback", { text: "great job" });
  assert.equal(response.requiresHumanReview, true);
  assert.equal(response.action, "classify-feedback");
  assert.ok(response.confidence >= 0 && response.confidence <= 1);

  const summary = await ai("summarize-application", {
    application: {
      status: "Submitted",
      email: "private@example.test",
      applicantSnapshot: { name: "Private Applicant" },
      skills: ["python"],
    },
  });
  assert.equal(JSON.stringify(summary).includes("private@example.test"), false);
  assert.equal(JSON.stringify(summary).includes("Private Applicant"), false);
  const unusual = JSON.parse('{"application":{"__proto__":{"polluted":true},"skills":["python"]}}');
  await ai("summarize-application", unusual);
  assert.equal({}.polluted, undefined);

  await assert.rejects(() => ai("constructor", {}), { code: "UNSUPPORTED_AI_ACTION" });
  await assert.rejects(() => ai("search", { query: "find interns", execute: true }), { code: "INVALID_AI_INPUT" });
  await assert.rejects(() => ai("match-candidate", {
    candidates: Array.from({ length: 26 }, () => ({})),
    internships: Array.from({ length: 20 }, () => ({})),
  }), { code: "INVALID_AI_INPUT" });
});
