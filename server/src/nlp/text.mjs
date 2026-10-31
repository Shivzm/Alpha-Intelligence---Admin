/**
 * Text utilities shared by every NLP module.
 * Pure functions only: no I/O, no global state.
 */

const STOP_WORDS = new Set(
  `a an and are as at be by can could did do does for from had has have how i if in into is it its
   me my of on or our please should so than that the their them then there these this those to was
   we were what when where which who whom will with would you your`.split(/\s+/).filter(Boolean)
);

/** Words that flip the meaning of the next few tokens ("not good", "never late"). */
export const NEGATORS = new Set(['not', 'no', 'never', 'without', 'hardly', 'barely', "isn't", "wasn't", "doesn't", "didn't", "don't", "cannot", "can't", "won't"]);

/**
 * Lowercase, strip accents/punctuation and collapse whitespace.
 * Characters that carry meaning inside skill names (+ # . / -) are kept,
 * but a trailing sentence period is removed from each token ("react." -> "react").
 */
export function normalizeText(value = '') {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/[^a-z0-9+#./'@\-\s]/g, ' ')
    .split(/\s+/)
    .map((t) => t.replace(/^[.\-/']+|[.\-/']+$/g, (m) => (m.includes('+') ? m : '')))
    .filter(Boolean)
    .join(' ');
}

/** Very small suffix stemmer (plural / -ing / -ed). Good enough for intent matching. */
export function stem(word) {
  if (word.length <= 3 || /[0-9.+#]/.test(word)) return word;
  if (word.endsWith('ies') && word.length > 4) return `${word.slice(0, -3)}y`;
  if (word.endsWith('sses')) return word.slice(0, -2);
  if (word.endsWith('ing') && word.length > 5) return word.slice(0, -3);
  if (word.endsWith('ed') && word.length > 4) return word.slice(0, -2);
  if (word.endsWith('s') && !word.endsWith('ss') && !word.endsWith('us')) return word.slice(0, -1);
  return word;
}

/** Tokens without stop words. Keep negators so callers can detect them. */
export function tokenize(value = '', { keepStopWords = false, stemmed = false } = {}) {
  const tokens = normalizeText(value).split(' ').filter(Boolean);
  const kept = keepStopWords ? tokens : tokens.filter((t) => !STOP_WORDS.has(t) || NEGATORS.has(t));
  return stemmed ? kept.map(stem) : kept;
}

export const unique = (items = []) => [...new Set(items)];

export function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Split into sentences without breaking on "Node.js", "e.g." or decimals. */
export function sentences(value = '') {
  return String(value ?? '')
    .replace(/\r/g, '')
    .split(/(?<=[.!?])\s+(?=[A-Z0-9])|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 1);
}

/** Clamp a number into [min, max] and round to `digits` decimals. */
export function clamp(n, min = 0, max = 1, digits = 3) {
  const v = Math.min(max, Math.max(min, Number.isFinite(n) ? n : min));
  return Number(v.toFixed(digits));
}
