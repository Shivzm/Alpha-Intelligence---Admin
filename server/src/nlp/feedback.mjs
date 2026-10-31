/**
 * Feedback sentiment classifier (lexicon + negation + intensifiers).
 * Deterministic and explainable: every signal that moved the score is returned.
 */
import { tokenize, NEGATORS, clamp } from './text.mjs';

const POSITIVE = {
  excellent: 2, outstanding: 2, exceptional: 2, great: 1.5, strong: 1.5, good: 1, improved: 1, improving: 1, reliable: 1.5, professional: 1,
  clear: 0.8, proactive: 1.5, punctual: 1.2, responsive: 1, creative: 1, helpful: 1, consistent: 1.2, quick: 0.8, fast: 0.8, impressive: 1.5,
  dedicated: 1.2, thorough: 1.2, collaborative: 1, initiative: 1.2, quality: 0.6, delivered: 0.8, learned: 0.8, enthusiastic: 1.2,
};
const NEGATIVE = {
  poor: 1.5, late: 1.2, weak: 1.2, missing: 1, missed: 1, problem: 0.8, problems: 0.8, careless: 1.5, unreliable: 1.8, slow: 1, delay: 1, delayed: 1,
  incomplete: 1.2, lacking: 1.2, lacks: 1.2, bad: 1.2, unprofessional: 1.8, absent: 1.2, confusing: 1, inconsistent: 1.2, struggled: 1, struggling: 1,
  mistakes: 1, errors: 0.8, disorganized: 1.4, unresponsive: 1.4, behind: 0.8, failed: 1.4, fail: 1.4,
};
const PHRASES = [
  ['needs improvement', -1.5], ['need improvement', -1.5], ['needs to improve', -1.4], ['room for improvement', -0.8], ['below expectations', -1.8],
  ['above and beyond', 2], ['exceeds expectations', 2], ['meets expectations', 0.5], ['on time', 1], ['well done', 1.5], ['keep it up', 1.2], ['not on time', -1.2],
];
const INTENSIFIERS = { very: 1.4, extremely: 1.6, really: 1.3, highly: 1.4, quite: 1.1, somewhat: 0.7, slightly: 0.6, bit: 0.7 };

/** Clauses are scored independently so negation never leaks across "," / "but" / ".". */
const splitClauses = (text) => String(text ?? '').split(/[,;.!?\n]+|\b(?:but|however|although|though|yet)\b/i).map((c) => c.trim()).filter(Boolean);

export function classifyFeedback(text = '') {
  const signals = [];
  let pos = 0;
  let neg = 0;
  const add = (term, weight) => {
    signals.push({ term, weight: Number(weight.toFixed(2)) });
    if (weight > 0) pos += weight; else neg += -weight;
  };

  for (const clause of splitClauses(text)) {
    let toks = tokenize(clause, { keepStopWords: true });
    for (const [phrase, weight] of PHRASES) {
      const words = phrase.split(' ');
      for (let i = 0; i + words.length <= toks.length; i += 1) {
        if (!words.every((w, k) => toks[i + k] === w)) continue;
        const negated = weight > 0 && toks.slice(Math.max(0, i - 4), i).some((w) => NEGATORS.has(w));
        add(negated ? `not ${phrase}` : phrase, negated ? -weight * 0.8 : weight);
        toks = [...toks.slice(0, i), ...toks.slice(i + words.length)];
        break;
      }
    }
    const joined = toks.join(' ');
    let negateLeft = 0; // tokens remaining for which a negator is still active
    let boost = 1;
    for (const tok of joined.trim().split(' ').filter(Boolean)) {
      if (NEGATORS.has(tok)) { negateLeft = 2; continue; }
      if (INTENSIFIERS[tok]) { boost = INTENSIFIERS[tok]; continue; }
      const base = POSITIVE[tok] ?? (NEGATIVE[tok] ? -NEGATIVE[tok] : 0);
      if (base) {
        const negated = negateLeft > 0;
        add(negated ? `not ${tok}` : tok, (negated ? -base * 0.8 : base) * boost);
        negateLeft = 0;
        boost = 1;
      } else if (negateLeft > 0) {
        negateLeft -= 1;
      }
    }
  }

  const net = pos - neg;
  const total = pos + neg;
  const label = total === 0 || Math.abs(net) < 0.75 ? (pos > 0 && neg > 0 ? 'mixed' : 'neutral') : net > 0 ? 'positive' : 'needs_improvement';
  const evidence = Math.min(1, total / 4);
  const polarity = total ? Math.abs(net) / total : 0;

  return {
    label,
    score: Number(clamp(net / Math.max(total, 1), -1, 1).toFixed(2)),
    positiveSignals: signals.filter((x) => x.weight > 0).length,
    negativeSignals: signals.filter((x) => x.weight < 0).length,
    signals,
    confidence: clamp(label === 'neutral' && total === 0 ? 0.4 : 0.45 + 0.35 * evidence + 0.15 * polarity, 0.3, 0.95),
    explanation: total === 0 ? 'No sentiment-bearing terms recognised; treated as neutral.' : `Weighted ${signals.length} signal(s) with negation and intensity handling.`,
  };
}
