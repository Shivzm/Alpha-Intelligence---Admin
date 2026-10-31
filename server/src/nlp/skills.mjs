/**
 * Skill taxonomy + alias normalisation.
 *
 * Every skill has ONE canonical name. Aliases map to it. Matching is always
 * token-boundary based, so "ml" never matches inside "html" and "ai" never
 * matches inside "email".
 */
import { normalizeText, unique, escapeRegExp } from './text.mjs';

/** canonical -> { category, aliases[] } */
const SKILLS = {
  // frontend
  html: { category: 'frontend', aliases: ['html5'] },
  css: { category: 'frontend', aliases: ['css3'] },
  javascript: { category: 'frontend', aliases: ['js', 'es6', 'ecmascript'] },
  typescript: { category: 'frontend', aliases: ['ts'] },
  react: { category: 'frontend', aliases: ['react.js', 'reactjs', 'react js'] },
  'next.js': { category: 'frontend', aliases: ['nextjs', 'next js'] },
  angular: { category: 'frontend', aliases: ['angularjs'] },
  vue: { category: 'frontend', aliases: ['vue.js', 'vuejs'] },
  redux: { category: 'frontend', aliases: [] },
  tailwind: { category: 'frontend', aliases: ['tailwindcss', 'tailwind css'] },
  bootstrap: { category: 'frontend', aliases: [] },
  mui: { category: 'frontend', aliases: ['material ui', 'material-ui'] },
  // backend
  'node.js': { category: 'backend', aliases: ['node', 'nodejs', 'node js'] },
  'express.js': { category: 'backend', aliases: ['express', 'expressjs', 'express js'] },
  python: { category: 'backend', aliases: [] },
  java: { category: 'backend', aliases: [] },
  php: { category: 'backend', aliases: [] },
  spring: { category: 'backend', aliases: ['spring boot', 'springboot'] },
  django: { category: 'backend', aliases: [] },
  flask: { category: 'backend', aliases: [] },
  fastapi: { category: 'backend', aliases: ['fast api'] },
  'rest api': { category: 'backend', aliases: ['rest', 'restful', 'restful api', 'rest apis', 'restful apis'] },
  graphql: { category: 'backend', aliases: [] },
  'c++': { category: 'backend', aliases: ['cpp'] },
  'c#': { category: 'backend', aliases: ['csharp', 'c sharp'] },
  golang: { category: 'backend', aliases: ['go lang'] },
  // database
  sql: { category: 'database', aliases: [] },
  mysql: { category: 'database', aliases: [] },
  postgresql: { category: 'database', aliases: ['postgres', 'postgre sql'] },
  mongodb: { category: 'database', aliases: ['mongo', 'mongo db'] },
  firebase: { category: 'database', aliases: [] },
  firestore: { category: 'database', aliases: ['cloud firestore'] },
  redis: { category: 'database', aliases: [] },
  // devops
  git: { category: 'devops', aliases: [] },
  github: { category: 'devops', aliases: [] },
  docker: { category: 'devops', aliases: [] },
  kubernetes: { category: 'devops', aliases: ['k8s'] },
  aws: { category: 'devops', aliases: ['amazon web services'] },
  azure: { category: 'devops', aliases: [] },
  gcp: { category: 'devops', aliases: ['google cloud'] },
  'ci/cd': { category: 'devops', aliases: ['cicd', 'ci cd'] },
  linux: { category: 'devops', aliases: [] },
  // data / ai
  'machine learning': { category: 'data_ai', aliases: ['ml', 'machine-learning'] },
  'artificial intelligence': { category: 'data_ai', aliases: ['ai'] },
  nlp: { category: 'data_ai', aliases: ['natural language processing', 'natural-language-processing'] },
  'deep learning': { category: 'data_ai', aliases: ['dl'] },
  tensorflow: { category: 'data_ai', aliases: [] },
  pytorch: { category: 'data_ai', aliases: [] },
  'scikit-learn': { category: 'data_ai', aliases: ['sklearn', 'scikit learn'] },
  pandas: { category: 'data_ai', aliases: [] },
  numpy: { category: 'data_ai', aliases: [] },
  'data analysis': { category: 'data_ai', aliases: ['data analytics'] },
  // mobile
  'react native': { category: 'mobile', aliases: ['react-native'] },
  flutter: { category: 'mobile', aliases: [] },
  android: { category: 'mobile', aliases: [] },
  ios: { category: 'mobile', aliases: [] },
  // security
  cybersecurity: { category: 'security', aliases: ['cyber security', 'infosec'] },
  owasp: { category: 'security', aliases: [] },
  'penetration testing': { category: 'security', aliases: ['pentesting', 'pen testing'] },
  // soft skills
  communication: { category: 'soft', aliases: [] },
  leadership: { category: 'soft', aliases: [] },
  teamwork: { category: 'soft', aliases: ['team work', 'collaboration'] },
  'problem solving': { category: 'soft', aliases: ['problem-solving'] },
  'time management': { category: 'soft', aliases: [] },
};

/** Canonical skills grouped by category (kept for backward compatibility). */
export const SKILL_TAXONOMY = Object.entries(SKILLS).reduce((acc, [name, { category }]) => {
  (acc[category] ||= []).push(name);
  return acc;
}, {});

// Longest phrases first so "react native" wins over "react".
const PHRASES = Object.entries(SKILLS)
  .flatMap(([canonical, { aliases }]) =>
    [canonical, ...aliases].map((phrase) => ({ canonical, phrase: normalizeText(phrase) }))
  )
  .sort((a, b) => b.phrase.length - a.phrase.length)
  .map((entry) => ({
    ...entry,
    regex: new RegExp(`(?<![a-z0-9+#.])${escapeRegExp(entry.phrase)}(?![a-z0-9+#]|\\.[a-z0-9])`, 'g'),
  }));

const ALIAS_LOOKUP = new Map(PHRASES.map(({ phrase, canonical }) => [phrase, canonical]));

/** Map any spelling ("ReactJS", "node js") to its canonical name; unknown skills pass through normalised. */
export function canonicalSkill(raw = '') {
  const n = normalizeText(raw);
  return ALIAS_LOOKUP.get(n) || n;
}

export const canonicalSkills = (list = []) => unique(list.map(canonicalSkill).filter(Boolean));

/**
 * Find every known skill mentioned in free text.
 * Matched spans are blanked out so a phrase is not counted twice
 * (e.g. "react native" does not also yield "react").
 */
export function extractSkills(text = '') {
  let source = ` ${normalizeText(text)} `;
  const found = [];
  for (const { canonical, regex } of PHRASES) {
    regex.lastIndex = 0;
    if (regex.test(source)) {
      found.push(canonical);
      regex.lastIndex = 0;
      source = source.replace(regex, ' ');
    }
  }
  return unique(found);
}

export const skillCategory = (skill) => SKILLS[canonicalSkill(skill)]?.category || 'other';

export function skillCategories(skills = []) {
  const result = {};
  for (const s of canonicalSkills(skills)) (result[skillCategory(s)] ||= []).push(s);
  return result;
}
