const { ApiError } = require("./firestoreRepository");

const MODEL = "alpha-mini-nlp-v2";
const MAX_PAIRS = 500;
const MAX_TEXT_LENGTH = 20000;
const AI_ACTIONS = Object.freeze([
  "resume-extract",
  "match-candidate",
  "search",
  "summarize-application",
  "summarize-progress",
  "classify-feedback",
  "recommend-next-action",
]);

const modulesPromise = Promise.all([
  import("../nlp/intents.mjs"),
  import("../nlp/resume.mjs"),
  import("../nlp/matcher.mjs"),
  import("../nlp/feedback.mjs"),
  import("../nlp/summarize.mjs"),
  import("../nlp/text.mjs"),
]).then(([intents, resume, matcher, feedback, summarize, text]) => ({
  ...intents,
  ...resume,
  ...matcher,
  ...feedback,
  ...summarize,
  ...text,
}));

const SEARCH_HINTS = {
  candidate_search: "This is a candidate-search plan; it does not fetch records.",
  application_status: "This is an application-status plan; it does not fetch records.",
  attendance: "This is an attendance plan; it does not fetch records.",
  task_progress: "This is a task-progress plan; it does not fetch records.",
  performance: "This is a performance plan; it does not fetch records.",
  document_verification: "This is a document-verification plan; it does not fetch records.",
  internship_search: "This is an internship-search plan; it does not fetch records.",
  general: "No clear HR intent detected. Try asking about candidates, applications, attendance, tasks, documents, or internships.",
};

function invalidInput(message) {
  throw new ApiError(400, "INVALID_AI_INPUT", message);
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function requireRecord(value, label) {
  if (!isRecord(value)) invalidInput(`${label} must be a JSON object.`);
}

function rejectUnknownFields(value, allowedFields) {
  const unknown = Object.keys(value).find((field) => !allowedFields.includes(field));
  if (unknown) invalidInput(`Field '${unknown}' is not supported.`);
}

function requireText(value, label, maxLength = MAX_TEXT_LENGTH) {
  if (typeof value !== "string" || !value.trim() || value.length > maxLength) {
    invalidInput(`${label} must be a non-empty string of at most ${maxLength} characters.`);
  }
  return value;
}

function optionalText(value, label, maxLength) {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || value.length > maxLength) {
    invalidInput(`${label} must be a string of at most ${maxLength} characters.`);
  }
  return value;
}

function validateSkills(value, label) {
  if (!Array.isArray(value) || value.length > 100) {
    invalidInput(`${label} must be an array containing at most 100 skills.`);
  }
  return value.map((skill) => requireText(skill, `${label} item`, 60));
}

function validateCandidate(value) {
  requireRecord(value, "Candidate");
  const allowed = ["id", "uid", "preferredRole", "skills", "summary", "resumeText"];
  rejectUnknownFields(value, allowed);
  const candidate = {};
  for (const field of ["id", "uid"]) {
    if (value[field] !== undefined) candidate[field] = requireText(value[field], field, 200);
  }
  for (const field of ["preferredRole", "summary", "resumeText"]) {
    const text = optionalText(value[field], field, field === "resumeText" ? MAX_TEXT_LENGTH : 5000);
    if (text !== undefined) candidate[field] = text;
  }
  if (value.skills !== undefined) candidate.skills = validateSkills(value.skills, "skills");
  return candidate;
}

function validateInternship(value) {
  requireRecord(value, "Internship");
  const allowed = ["id", "title", "description", "domain", "preferredRole", "skills", "requiredSkills", "preferredSkills"];
  rejectUnknownFields(value, allowed);
  const internship = {};
  for (const field of ["id", "title", "domain", "preferredRole"]) {
    const text = optionalText(value[field], field, 200);
    if (text !== undefined) internship[field] = text;
  }
  const description = optionalText(value.description, "description", 10000);
  if (description !== undefined) internship.description = description;
  for (const field of ["skills", "requiredSkills", "preferredSkills"]) {
    if (value[field] !== undefined) internship[field] = validateSkills(value[field], field);
  }
  return internship;
}

function validateMatchInput(input) {
  const allowed = ["candidate", "candidates", "internship", "internships", "limit"];
  rejectUnknownFields(input, allowed);
  if (input.candidate !== undefined && input.candidates !== undefined) invalidInput("Provide candidate or candidates, not both.");
  if (input.internship !== undefined && input.internships !== undefined) invalidInput("Provide internship or internships, not both.");
  const candidates = input.candidates === undefined
    ? (input.candidate === undefined ? [] : [validateCandidate(input.candidate)])
    : Array.isArray(input.candidates) && input.candidates.length <= 200
      ? input.candidates.map(validateCandidate)
      : invalidInput("candidates must contain at most 200 entries.");
  const internships = input.internships === undefined
    ? (input.internship === undefined ? [] : [validateInternship(input.internship)])
    : Array.isArray(input.internships) && input.internships.length <= 50
      ? input.internships.map(validateInternship)
      : invalidInput("internships must contain at most 50 entries.");
  if (!candidates.length || !internships.length) invalidInput("Provide at least one candidate and one internship.");
  if (candidates.length * internships.length > MAX_PAIRS) {
    invalidInput(`A request may contain at most ${MAX_PAIRS} candidate/internship pairs.`);
  }
  const limit = input.limit ?? 50;
  if (!Number.isInteger(limit) || limit < 1 || limit > 200) invalidInput("limit must be an integer from 1 to 200.");
  return { candidates, internships, limit };
}

function validateSearchInput(input) {
  rejectUnknownFields(input, ["query", "text"]);
  if (input.query !== undefined && input.text !== undefined) invalidInput("Provide query or text, not both.");
  return { query: requireText(input.query ?? input.text, "query", 500) };
}

const SENSITIVE_FIELD = /password|token|secret|private.?key|aadhaar|pan|email|phone|mobile|address|applicant.?snapshot|user.?id|uid|credential/i;

function sanitizeSummaryValue(value, depth = 0, budget = { nodes: 0 }) {
  budget.nodes += 1;
  if (budget.nodes > 500 || depth > 5) invalidInput("application contains too much nested data.");
  if (typeof value === "string") {
    if (value.length > MAX_TEXT_LENGTH) invalidInput("application text exceeds the allowed size.");
    return value;
  }
  if (typeof value === "number" || typeof value === "boolean" || value === null) return value;
  if (Array.isArray(value)) {
    if (value.length > 100) invalidInput("application arrays may contain at most 100 entries.");
    return value.map((item) => sanitizeSummaryValue(item, depth + 1, budget));
  }
  requireRecord(value, "application");
  const sanitized = Object.create(null);
  for (const [key, nestedValue] of Object.entries(value)) {
    if (SENSITIVE_FIELD.test(key)) continue;
    sanitized[key] = sanitizeSummaryValue(nestedValue, depth + 1, budget);
  }
  return sanitized;
}

function validateSummaryApplication(input) {
  rejectUnknownFields(input, ["application", "text"]);
  if (input.application === undefined && input.text === undefined) {
    invalidInput("Provide application or text.");
  }
  const text = optionalText(input.text, "text", MAX_TEXT_LENGTH);
  if (input.application === undefined) return { text: requireText(text, "text") };
  if (typeof input.application === "string") {
    return { application: requireText(input.application, "application") };
  }
  requireRecord(input.application, "application");
  if (JSON.stringify(input.application).length > MAX_TEXT_LENGTH) invalidInput("application exceeds the allowed size.");
  return { application: sanitizeSummaryValue(input.application) };
}

function validateProgressRows(value, label, allowedFields, maxRows) {
  if (!Array.isArray(value) || value.length > maxRows) {
    invalidInput(`${label} must be an array containing at most ${maxRows} entries.`);
  }
  return value.map((row) => {
    requireRecord(row, `${label} entry`);
    rejectUnknownFields(row, allowedFields);
    const clean = {};
    for (const [field, item] of Object.entries(row)) {
      clean[field] = typeof item === "string"
        ? optionalText(item, field, 1000)
        : item;
      if (item !== null && typeof item !== "string") invalidInput(`${field} must be a string or null.`);
    }
    return clean;
  });
}

function validateProgressInput(input) {
  rejectUnknownFields(input, ["tasks", "reports", "attendance"]);
  return {
    tasks: validateProgressRows(input.tasks ?? [], "tasks", ["id", "title", "status", "dueDate"], 500),
    reports: validateProgressRows(input.reports ?? [], "reports", ["title", "summary", "status", "createdAt"], 100),
    attendance: validateProgressRows(input.attendance ?? [], "attendance", ["status", "date"], 1000),
  };
}

function validateFeedbackInput(input) {
  rejectUnknownFields(input, ["text", "feedback"]);
  if (input.text !== undefined && input.feedback !== undefined) invalidInput("Provide text or feedback, not both.");
  return { text: requireText(input.text ?? input.feedback, "text", 5000) };
}

function validateRecommendationInput(input) {
  rejectUnknownFields(input, ["status", "matchScore", "documentsVerified", "profileCompleted", "completionPercentage"]);
  const clean = {};
  if (input.status !== undefined) clean.status = requireText(input.status, "status", 50);
  for (const field of ["matchScore", "completionPercentage"]) {
    if (input[field] !== undefined && (typeof input[field] !== "number" || input[field] < 0 || input[field] > 100)) {
      invalidInput(`${field} must be a number from 0 to 100.`);
    }
    if (input[field] !== undefined) clean[field] = input[field];
  }
  for (const field of ["documentsVerified", "profileCompleted"]) {
    if (input[field] !== undefined && typeof input[field] !== "boolean") invalidInput(`${field} must be a boolean.`);
    if (input[field] !== undefined) clean[field] = input[field];
  }
  return clean;
}

function validateInput(action, input) {
  requireRecord(input, "Request body");
  switch (action) {
    case "resume-extract":
      rejectUnknownFields(input, ["text", "resumeText"]);
      if (input.text !== undefined && input.resumeText !== undefined) invalidInput("Provide text or resumeText, not both.");
      return { text: requireText(input.text ?? input.resumeText, "text") };
    case "match-candidate":
      return validateMatchInput(input);
    case "search":
      return validateSearchInput(input);
    case "summarize-application":
      return validateSummaryApplication(input);
    case "summarize-progress":
      return validateProgressInput(input);
    case "classify-feedback":
      return validateFeedbackInput(input);
    case "recommend-next-action":
      return validateRecommendationInput(input);
    default:
      throw new ApiError(400, "UNSUPPORTED_AI_ACTION", "The requested NLP action is not supported.");
  }
}

async function ai(action, rawInput) {
  if (!AI_ACTIONS.includes(action)) {
    throw new ApiError(400, "UNSUPPORTED_AI_ACTION", "The requested NLP action is not supported.");
  }
  const input = validateInput(action, rawInput);
  const nlp = await modulesPromise;
  let result;
  let confidence;

  switch (action) {
    case "resume-extract":
      result = nlp.extractResume(input.text);
      confidence = result.confidence;
      break;
    case "match-candidate": {
      const matches = nlp.rankMatches(input.candidates, input.internships, { limit: input.limit });
      result = { matches };
      confidence = matches[0]?.confidence ?? 0.3;
      break;
    }
    case "search": {
      const plan = nlp.planQuery(input.query);
      result = {
        query: input.query,
        intent: plan.intent.intent,
        intentConfidence: plan.intent.score,
        matchedPatterns: plan.intent.matched,
        alternatives: plan.intent.alternatives,
        collection: plan.collection,
        filters: plan.filters,
        answer: SEARCH_HINTS[plan.intent.intent] ?? SEARCH_HINTS.general,
      };
      confidence = plan.intent.intent === "general" ? 0.3 : nlp.clamp(0.5 + plan.intent.score * 0.45, 0, 0.95);
      break;
    }
    case "summarize-application": {
      const subject = input.application ?? input.text;
      result = nlp.summarizeApplication(subject);
      confidence = subject ? 0.8 : 0.3;
      break;
    }
    case "summarize-progress":
      result = nlp.summarizeProgress(input);
      confidence = result.totalTasks ? 0.85 : 0.4;
      break;
    case "classify-feedback":
      result = nlp.classifyFeedback(input.text);
      confidence = result.confidence;
      break;
    case "recommend-next-action":
      result = nlp.recommendAction(input);
      confidence = result.confidence;
      break;
    default:
      throw new ApiError(400, "UNSUPPORTED_AI_ACTION", "The requested NLP action is not supported.");
  }

  return {
    model: MODEL,
    generatedAt: new Date().toISOString(),
    confidence: nlp.clamp(confidence, 0, 1),
    requiresHumanReview: true,
    action,
    result,
  };
}

module.exports = { AI_ACTIONS, MAX_PAIRS, ai, validateInput };
