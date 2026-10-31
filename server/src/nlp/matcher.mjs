/**
 * Candidate <-> internship matching.
 *
 * score = 65% required-skill coverage + 20% text relevance + 10% role fit + 5% preferred-skill bonus
 * Weights are re-normalised when a signal is unavailable, so a missing field
 * never silently drags the score down.
 */
import { extractSkills, canonicalSkills } from './skills.mjs';
import { overlapScore, cosineSimilarity } from './similarity.mjs';
import { clamp } from './text.mjs';

const WEIGHTS = { skills: 0.65, text: 0.2, role: 0.1, preferred: 0.05 };

export function matchCandidate(candidate = {}, internship = {}) {
  const candidateText = [candidate.summary, candidate.resumeText, candidate.preferredRole].filter(Boolean).join(' ');
  const candidateSkills = canonicalSkills([
    ...(Array.isArray(candidate.skills) ? candidate.skills : []),
    ...extractSkills(candidateText),
  ]);

  const internshipText = [internship.title, internship.description, internship.domain].filter(Boolean).join(' ');
  const requiredRaw = internship.requiredSkills || internship.skills;
  const required = canonicalSkills(Array.isArray(requiredRaw) && requiredRaw.length ? requiredRaw : extractSkills(internshipText));
  const preferred = canonicalSkills(internship.preferredSkills || []);

  const skill = overlapScore(candidateSkills, required);
  const pref = overlapScore(candidateSkills, preferred);
  const text = cosineSimilarity(`${candidateSkills.join(' ')} ${candidateText}`, `${required.join(' ')} ${internshipText}`);
  const targetRole = internship.preferredRole || internship.title;
  const role = candidate.preferredRole && targetRole ? cosineSimilarity(candidate.preferredRole, targetRole) : null;

  const signals = [
    ['skills', required.length ? skill.score : null],
    ['text', candidateText || internshipText ? text : null],
    ['role', role],
    ['preferred', preferred.length ? pref.score : null],
  ].filter(([, v]) => v !== null);

  const weightSum = signals.reduce((s, [k]) => s + WEIGHTS[k], 0);
  const raw = weightSum ? signals.reduce((s, [k, v]) => s + v * WEIGHTS[k], 0) / weightSum : 0;
  const score = Math.round(raw * 100);

  return {
    score,
    grade: score >= 80 ? 'strong' : score >= 60 ? 'good' : score >= 40 ? 'partial' : 'weak',
    matchedSkills: skill.matched,
    missingSkills: skill.missing,
    extraSkills: skill.extra,
    breakdown: {
      skills: Math.round(skill.score * 100),
      textSimilarity: Math.round(text * 100),
      roleSimilarity: role === null ? null : Math.round(role * 100),
      preferredSkills: preferred.length ? Math.round(pref.score * 100) : null,
    },
    // Confidence reflects how much evidence we had, not how high the score is.
    confidence: clamp(0.4 + 0.12 * signals.length + (required.length >= 3 ? 0.08 : 0) + (candidateSkills.length >= 3 ? 0.08 : 0), 0, 0.95),
    reason: buildReason(score, skill.matched, skill.missing, required.length),
  };
}

function buildReason(score, matched, missing, requiredCount) {
  if (!requiredCount) return 'No required skills were provided or detected; score is based on text and role similarity only.';
  const gap = missing.slice(0, 3).join(', ');
  if (score >= 80) return `Strong match: covers ${matched.length} of ${requiredCount} required skill(s)${gap ? `; minor gap: ${gap}` : ''}.`;
  if (score >= 60) return `Good potential: covers ${matched.length} of ${requiredCount} required skill(s); missing ${gap || 'none'}.`;
  if (score >= 40) return `Partial match: covers ${matched.length} of ${requiredCount} required skill(s); needs ${gap}.`;
  return `Weak match: only ${matched.length} of ${requiredCount} required skill(s); needs ${gap || 'the internship requirements'}.`;
}

/** Rank many candidates against one internship (or vice versa) with a hard cap. */
export function rankMatches(candidates = [], internships = [], { limit = 50 } = {}) {
  const out = [];
  for (const c of candidates) {
    for (const i of internships) {
      out.push({ candidateId: c.id ?? c.uid ?? null, internshipId: i.id ?? null, ...matchCandidate(c, i) });
    }
  }
  return out.sort((a, b) => b.score - a.score || b.confidence - a.confidence).slice(0, limit);
}
