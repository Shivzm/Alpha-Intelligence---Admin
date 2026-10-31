/**
 * Extractive summarisation and workflow recommendations.
 */
import { tokenize, sentences, clamp } from './text.mjs';
import { extractSkills } from './skills.mjs';

const DONE = new Set(['completed', 'done', 'approved', 'reviewed', 'submitted_and_approved']);
const ACTIVE = new Set(['in_progress', 'started', 'active', 'under_review']);

/** Flatten an application-like object or text into readable lines. */
function flatten(value, prefix = '', out = []) {
  if (value == null) return out;
  if (typeof value === 'string') { out.push(prefix ? `${prefix}: ${value}` : value); return out; }
  if (typeof value === 'number' || typeof value === 'boolean') { out.push(`${prefix}: ${value}`); return out; }
  if (Array.isArray(value)) { out.push(`${prefix}: ${value.map((v) => (typeof v === 'object' ? JSON.stringify(v) : v)).join(', ')}`); return out; }
  for (const [k, v] of Object.entries(value)) {
    if (/password|token|secret|aadhaar|pan|privateKey/i.test(k)) continue;
    flatten(v, prefix ? `${prefix}.${k}` : k, out);
  }
  return out;
}

/** Pick the most informative sentences (frequency scoring), preserving original order. */
export function extractiveSummary(text, maxSentences = 3) {
  const sents = sentences(text);
  if (sents.length <= maxSentences) return sents.join(' ');
  const freq = new Map();
  for (const sent of sents) for (const t of tokenize(sent, { stemmed: true })) freq.set(t, (freq.get(t) || 0) + 1);
  const scored = sents.map((s, index) => {
    const toks = tokenize(s, { stemmed: true });
    const score = toks.reduce((sum, t) => sum + (freq.get(t) || 0), 0) / Math.sqrt(toks.length || 1) + (index === 0 ? 1.5 : 0);
    return { s, index, score };
  });
  return scored.sort((a, b) => b.score - a.score).slice(0, maxSentences).sort((a, b) => a.index - b.index).map((x) => x.s).join(' ');
}

export function summarizeApplication(input) {
  const isText = typeof input === 'string';
  const text = isText ? input : flatten(input).join('. ');
  const skills = extractSkills(isText ? input : `${input?.skills?.join?.(' ') || ''} ${text}`);
  return {
    summary: extractiveSummary(text, 3).slice(0, 700),
    keySkills: skills,
    status: isText ? null : input?.status || null,
    preferredRole: isText ? null : input?.preferredRole || null,
    length: text.length,
  };
}

export function summarizeProgress({ tasks = [], reports = [], attendance = [] } = {}) {
  const list = Array.isArray(tasks) ? tasks : [];
  const total = list.length;
  const now = Date.now();
  const done = list.filter((t) => DONE.has(String(t.status).toLowerCase())).length;
  const inProgress = list.filter((t) => ACTIVE.has(String(t.status).toLowerCase())).length;
  const overdue = list.filter((t) => !DONE.has(String(t.status).toLowerCase()) && t.dueDate && Date.parse(t.dueDate) < now);
  const completion = total ? Math.round((done / total) * 100) : 0;

  const att = Array.isArray(attendance) ? attendance : [];
  const present = att.filter((a) => ['present', 'late'].includes(String(a.status).toLowerCase())).length;
  const attendanceRate = att.length ? Math.round((present / att.length) * 100) : null;

  const risk = overdue.length >= 2 || (total >= 3 && completion < 30) || (attendanceRate !== null && attendanceRate < 60) ? 'high'
    : overdue.length === 1 || (total && completion < 60) || (attendanceRate !== null && attendanceRate < 75) ? 'medium' : 'low';

  const parts = [`${done} of ${total} task(s) completed (${completion}%)`];
  if (inProgress) parts.push(`${inProgress} in progress`);
  if (overdue.length) parts.push(`${overdue.length} overdue`);
  if (attendanceRate !== null) parts.push(`attendance ${attendanceRate}%`);

  return {
    summary: `${parts.join(', ')}.`,
    completedTasks: done,
    inProgressTasks: inProgress,
    totalTasks: total,
    completionPercentage: completion,
    overdueTasks: overdue.map((t) => ({ id: t.id ?? null, title: t.title ?? null, dueDate: t.dueDate })),
    attendanceRate,
    riskLevel: risk,
    highlights: (Array.isArray(reports) ? reports : []).slice(0, 5),
  };
}

const NEXT_ACTIONS = {
  draft: ['Applicant has not submitted yet.', 'Wait for submission; no HR action available.'],
  submitted: ['Application is waiting for first review.', 'Move to under_review and check profile completeness, skills and documents.'],
  under_review: ['Application is being reviewed.', 'Decide: approve, request correction (state exactly what is missing), or reject with a reason.'],
  correction_requested: ['Waiting on the applicant.', 'Wait for resubmission, then re-review. Follow up if there is no response within a few days.'],
  approved: ['Application is approved.', 'Assign department, manager and mentor, then start onboarding.'],
  rejected: ['Application was rejected.', 'No further action; make sure a rejection reason is recorded.'],
  withdrawn: ['Applicant withdrew.', 'No action required.'],
  active: ['Internship is running.', 'Monitor attendance, task completion and mentor feedback.'],
  completed: ['Internship is complete.', 'Check completion eligibility and start certificate review.'],
};

export function recommendAction(input = {}) {
  const status = String(input.status || '').toLowerCase();
  const [situation, action] = NEXT_ACTIONS[status] || ['Status is unknown or not recognised.', 'Review the record and choose a permitted workflow action.'];
  const flags = [];
  if (input.matchScore != null && input.matchScore < 40) flags.push('Low skill match score; consider requesting more detail.');
  if (input.documentsVerified === false) flags.push('Documents are not verified yet.');
  if (input.profileCompleted === false) flags.push('Applicant profile is incomplete.');
  if (input.completionPercentage != null && status === 'active' && input.completionPercentage < 50) flags.push('Task completion is below 50%; talk to the mentor.');
  return {
    recommendation: action,
    reason: `${situation}${status ? ` (current status: ${status})` : ''}`,
    flags,
    knownStatus: Boolean(NEXT_ACTIONS[status]),
    confidence: clamp(NEXT_ACTIONS[status] ? 0.85 - flags.length * 0.03 : 0.4, 0.3, 0.9),
  };
}
