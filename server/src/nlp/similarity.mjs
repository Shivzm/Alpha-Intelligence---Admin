/**
 * Similarity primitives: cosine over term frequency, and skill-set overlap.
 */
import { tokenize, unique } from './text.mjs';
import { canonicalSkills } from './skills.mjs';

function termFrequency(tokens) {
  const map = new Map();
  for (const t of tokens) map.set(t, (map.get(t) || 0) + 1);
  return map;
}

/** Cosine similarity of two texts in [0, 1], using stemmed tokens. */
export function cosineSimilarity(a = '', b = '') {
  const A = termFrequency(tokenize(a, { stemmed: true }));
  const B = termFrequency(tokenize(b, { stemmed: true }));
  if (!A.size || !B.size) return 0;
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (const [, x] of A) magA += x * x;
  for (const [, y] of B) magB += y * y;
  for (const [t, x] of A) dot += x * (B.get(t) || 0);
  return magA && magB ? dot / (Math.sqrt(magA) * Math.sqrt(magB)) : 0;
}

/**
 * How much of the `required` skill list does the candidate cover?
 * Both sides are canonicalised first, so "ReactJS" matches "react".
 * Optional `weights` lets callers mark skills as more important (default 1).
 */
export function overlapScore(have = [], required = [], weights = {}) {
  const A = new Set(canonicalSkills(have));
  const B = unique(canonicalSkills(required));
  if (!B.length) return { score: 0, matched: [], missing: [], extra: [...A], coverage: 0 };
  const w = (s) => Number(weights[s]) > 0 ? Number(weights[s]) : 1;
  const matched = B.filter((s) => A.has(s));
  const missing = B.filter((s) => !A.has(s));
  const total = B.reduce((sum, s) => sum + w(s), 0);
  const got = matched.reduce((sum, s) => sum + w(s), 0);
  return { score: got / total, matched, missing, extra: [...A].filter((s) => !B.includes(s)), coverage: matched.length / B.length };
}
