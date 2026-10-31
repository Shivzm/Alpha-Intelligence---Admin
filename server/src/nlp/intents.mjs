/**
 * HR intent detection + structured query planning.
 *
 * Each intent is a set of weighted cues. Cues are matched on the normalised,
 * stemmed text WITHOUT stop-word removal, so phrases such as "who knows" or
 * "check in" work. The winner must beat the runner-up and clear a minimum
 * score; otherwise the intent is "general" (we'd rather say "unclear" than guess).
 */
import { normalizeText, stem, clamp } from './text.mjs';
import { extractSkills } from './skills.mjs';

const INTENTS = [
  { name: 'candidate_search', collection: 'users', cues: [
    ['find candidate', 3], ['search candidate', 3], ['show candidate', 3], ['list candidate', 3],
    ['find intern', 3], ['show intern', 2], ['list intern', 2], ['find applicant', 3], ['show applicant', 2],
    ['who know', 3], ['candidate with', 2], ['people with', 2], ['student with', 2], ['candidate', 1], ['intern', 1],
  ] },
  { name: 'application_status', collection: 'applications', cues: [
    ['application status', 4], ['status of application', 4], ['applicant status', 3], ['my application', 3],
    ['where is application', 3], ['application', 2], ['applied', 2], ['shortlist', 2], ['pending review', 2],
  ] },
  { name: 'attendance', collection: 'attendance', cues: [
    ['attendance', 4], ['absent', 3], ['present', 2], ['late arrival', 3], ['working hour', 3], ['check in', 3], ['check out', 3], ['leave', 1],
  ] },
  { name: 'task_progress', collection: 'tasks', cues: [
    ['task progress', 4], ['task status', 4], ['pending task', 4], ['overdue task', 4], ['project progress', 3], ['task', 2], ['assignment', 2], ['deadline', 2],
  ] },
  { name: 'performance', collection: 'tasks', cues: [
    ['performance', 4], ['feedback', 3], ['evaluation', 3], ['review intern', 3], ['rating', 2], ['top performer', 4], ['mentor review', 3],
  ] },
  { name: 'document_verification', collection: 'documents', cues: [
    ['verify certificate', 5], ['verify document', 5], ['certificate status', 4], ['id card', 3], ['certificate', 2], ['document', 1], ['revoked', 2],
  ] },
  { name: 'internship_search', collection: 'internshipPostings', cues: [
    ['internship opening', 4], ['open internship', 4], ['internship', 2], ['opening', 2], ['vacancy', 3], ['vacancies', 3], ['job posting', 2], ['hiring', 2],
  ] },
];

const STATUSES = {
  submitted: ['submitted'],
  under_review: ['under review', 'in review', 'reviewing'],
  correction_requested: ['correction', 'needs correction', 'correction requested'],
  approved: ['approved', 'accepted', 'selected'],
  rejected: ['rejected', 'declined'],
  withdrawn: ['withdrawn'],
  active: ['active', 'ongoing'],
  completed: ['completed', 'finished', 'done'],
  pending: ['pending', 'not started'],
  overdue: ['overdue', 'late'],
};

const MONTHS = ['january','february','march','april','may','june','july','august','september','october','november','december'];

/** Stemmed, stop-words-kept tokens used for cue matching. */
const cueTokens = (text) => normalizeText(text).split(' ').filter(Boolean).map(stem);

/**
 * A cue matches when its words appear in order with at most `maxGap` other
 * words between consecutive cue words ("find top 5 interns" matches "find intern").
 */
function matchesCue(tokens, cue, maxGap = 3) {
  const words = cueTokens(cue);
  for (let start = 0; start < tokens.length; start += 1) {
    if (tokens[start] !== words[0]) continue;
    let pos = start;
    let ok = true;
    for (let k = 1; k < words.length && ok; k += 1) {
      let found = -1;
      for (let j = pos + 1; j <= Math.min(tokens.length - 1, pos + 1 + maxGap); j += 1) {
        if (tokens[j] === words[k]) { found = j; break; }
      }
      if (found < 0) ok = false; else pos = found;
    }
    if (ok) return true;
  }
  return false;
}

export function detectIntent(text = '') {
  const tokens = cueTokens(text);
  const scored = INTENTS.map((intent) => {
    let score = 0;
    const matched = [];
    for (const [cue, weight] of intent.cues) {
      if (matchesCue(tokens, cue)) {
        score += weight;
        matched.push(cue);
      }
    }
    const max = intent.cues.reduce((s, [, w]) => s + w, 0);
    return { intent: intent.name, collection: intent.collection, score, matched, normalised: score / Math.min(max, 8) };
  }).sort((a, b) => b.score - a.score);

  const [best, runnerUp] = scored;
  if (!best || best.score < 2) return { intent: 'general', collection: null, score: 0, matched: [], alternatives: [] };

  const margin = (best.score - (runnerUp?.score || 0)) / best.score;
  return {
    intent: best.intent,
    collection: best.collection,
    score: clamp(0.5 * Math.min(1, best.normalised) + 0.5 * margin),
    matched: best.matched,
    alternatives: scored.slice(1, 3).filter((s) => s.score > 0).map((s) => ({ intent: s.intent, score: s.score })),
  };
}

/** Pull structured filters out of a natural-language HR question. */
export function extractSearchTerms(text = '', now = new Date()) {
  const n = ` ${normalizeText(text)} `;
  const status = Object.entries(STATUSES).find(([, words]) => words.some((w) => n.includes(` ${w} `)))?.[0] || null;
  const limitMatch = n.match(/\b(?:top|first|best)\s+(\d{1,3})\b/);
  const monthMatch = MONTHS.findIndex((m) => n.includes(` ${m} `));
  return {
    skills: extractSkills(text),
    status,
    limit: limitMatch ? Math.min(100, Number(limitMatch[1])) : null,
    dateRange: parseDateRange(n, monthMatch, now),
    department: (n.match(/\b(engineering|design|marketing|hr|finance|sales|operations|product)\b/) || [])[1] || null,
  };
}

function parseDateRange(n, monthIndex, now) {
  const day = 86400000;
  const iso = (d) => d.toISOString().slice(0, 10);
  const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  if (n.includes(' today ')) return { from: iso(startOfDay), to: iso(new Date(+startOfDay + day)) };
  if (n.includes(' yesterday ')) return { from: iso(new Date(+startOfDay - day)), to: iso(startOfDay) };
  if (n.includes(' this week ') || n.includes(' last 7 days ')) return { from: iso(new Date(+startOfDay - 6 * day)), to: iso(new Date(+startOfDay + day)) };
  if (n.includes(' last week ')) return { from: iso(new Date(+startOfDay - 13 * day)), to: iso(new Date(+startOfDay - 6 * day)) };
  if (n.includes(' this month ')) return { from: iso(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))), to: iso(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1))) };
  if (n.includes(' last month ')) return { from: iso(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1))), to: iso(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))) };
  if (monthIndex >= 0) {
    const year = Number((n.match(/\b(20\d{2})\b/) || [])[1]) || now.getUTCFullYear();
    return { from: iso(new Date(Date.UTC(year, monthIndex, 1))), to: iso(new Date(Date.UTC(year, monthIndex + 1, 1))) };
  }
  return null;
}

/** Turn a question into an explicit, inspectable query plan (nothing is executed here). */
export function planQuery(text = '', now = new Date()) {
  const intent = detectIntent(text);
  const filters = extractSearchTerms(text, now);
  return { intent, filters, collection: intent.collection };
}
