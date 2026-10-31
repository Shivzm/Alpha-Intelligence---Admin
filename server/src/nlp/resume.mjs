/**
 * Resume parser: contact info, name, links, sections, education, experience,
 * projects, certifications, skills. Works on plain text (PDF/DOCX -> text happens elsewhere).
 */
import { extractSkills, skillCategories } from './skills.mjs';
import { sentences, clamp, unique } from './text.mjs';

const SECTION_HEADINGS = {
  education: /^(education|academics?|academic (background|qualifications?)|qualifications?)$/i,
  experience: /^(work )?(experience|employment|work history|internships?|professional experience)$/i,
  projects: /^(projects?|academic projects?|personal projects?)$/i,
  skills: /^(technical )?skills?( summary)?|core competenc(y|ies)|technologies$/i,
  certifications: /^(certifications?|courses?|licen[sc]es?|achievements?|awards?)$/i,
  summary: /^(summary|profile|objective|about( me)?|career objective)$/i,
};

const DEGREE = /\b(b\.?\s?tech|m\.?\s?tech|b\.?\s?e\.?|m\.?\s?e\.?|b\.?\s?sc\.?|m\.?\s?sc\.?|bca|mca|mba|bba|b\.?\s?com|m\.?\s?com|ph\.?\s?d|bachelor(?:'s)?(?: of [a-z ]+)?|master(?:'s)?(?: of [a-z ]+)?|diploma(?: in [a-z ]+)?|12th|10th|hsc|ssc|intermediate)\b/i;
const INSTITUTION = /\b([A-Z][A-Za-z.&'\- ]+(?:University|Institute|College|School|Academy|IIT|NIT|IIIT)[A-Za-z.&'\- ]*)/;
const MONTH = '(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\\.?';
const DATE_RANGE = new RegExp(`(?:(${MONTH})\\s+)?((?:19|20)\\d{2})\\s*(?:-|–|—|to)\\s*(?:(?:(${MONTH})\\s+)?((?:19|20)\\d{2})|(present|current|ongoing|now))`, 'ig');
const MONTH_INDEX = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };

const monthOf = (m) => (m ? MONTH_INDEX[m.slice(0, 3).toLowerCase()] ?? 0 : 0);

/** Split text into named sections using heading lines. */
export function splitSections(raw) {
  const sections = { header: [] };
  let current = 'header';
  for (const line of raw.split('\n')) {
    const heading = line.trim().replace(/[:\-–—_*#]+$/g, '').replace(/^[#*\-–—\s]+/, '').trim();
    const key = heading.length > 0 && heading.length <= 40 && Object.keys(SECTION_HEADINGS).find((k) => SECTION_HEADINGS[k].test(heading));
    if (key) { current = key; sections[current] ||= []; continue; }
    (sections[current] ||= []).push(line);
  }
  return Object.fromEntries(Object.entries(sections).map(([k, v]) => [k, v.join('\n').trim()]));
}

function extractEmail(raw) {
  return (raw.match(/[A-Z0-9._%+-]+@[A-Z0-9-]+(?:\.[A-Z0-9-]+)*\.[A-Z]{2,}/i) || [])[0]?.toLowerCase() || null;
}

function extractPhone(raw) {
  const m = raw.match(/(?:\+?91[\s-]?)?(?:\(?0?\)?)?([6-9]\d{4}[\s-]?\d{5})(?!\d)/);
  return m ? `+91${m[1].replace(/\D/g, '')}` : null;
}

function extractLinks(raw) {
  const grab = (re) => (raw.match(re) || [])[0]?.replace(/[),.;]+$/, '') || null;
  return {
    linkedin: grab(/(?:https?:\/\/)?(?:[a-z]{2,3}\.)?linkedin\.com\/in\/[A-Za-z0-9_\-%]+/i),
    github: grab(/(?:https?:\/\/)?(?:www\.)?github\.com\/[A-Za-z0-9_\-]+(?!\/[A-Za-z0-9_\-]+\/)/i),
    portfolio: grab(/https?:\/\/(?!(?:www\.)?(?:linkedin|github)\.com)[^\s,;)]+/i),
  };
}

/** Name heuristic: first short line of letters that is not contact info or a heading. */
function extractName(headerText, email) {
  const lines = headerText.split('\n').map((l) => l.trim()).filter(Boolean).slice(0, 6);
  for (const line of lines) {
    const cleaned = line.replace(/^(name\s*[:\-]\s*)/i, '').replace(/[|,•·].*$/, '').trim();
    if (/@|\d|https?:|resume|curriculum|vitae/i.test(cleaned)) continue;
    const words = cleaned.split(/\s+/);
    if (words.length >= 2 && words.length <= 4 && words.every((w) => /^[A-Za-z.'\-]+$/.test(w))) return titleCase(cleaned);
  }
  // inline form: "Rahul Kumar, rahul@example.com, B.Tech ..."
  const inline = headerText.match(/^\s*([A-Z][a-z]+(?:\s[A-Z][a-z]+){1,2})\s*[,|\-–]/);
  if (inline) return inline[1];
  if (email) {
    const local = email.split('@')[0].replace(/[0-9_.\-]+/g, ' ').trim();
    if (/^[a-z]+(?: [a-z]+)?$/.test(local) && local.length > 3) return `${titleCase(local)} (from email)`;
  }
  return null;
}

const titleCase = (s) => s.toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase());

function parseEducation(text, fullText) {
  const source = text || fullText;
  const entries = [];
  for (const line of source.split('\n').map((l) => l.trim()).filter(Boolean)) {
    const degree = line.match(DEGREE)?.[0];
    if (!degree) continue;
    const year = [...line.matchAll(/\b((?:19|20)\d{2})\b/g)].map((m) => Number(m[1])).pop() || null;
    const institution = line.match(INSTITUTION)?.[1]?.trim() || null;
    const cgpa = line.match(/\b(?:cgpa|gpa)\s*[:\-]?\s*(\d(?:\.\d{1,2})?)(?:\s*\/\s*(10|4))?/i);
    const pct = line.match(/\b(\d{2}(?:\.\d{1,2})?)\s*%/);
    entries.push({
      degree: degree.replace(/\s+/g, ' '),
      field: (line.match(/\b(?:in|-|,)\s*(computer science(?: and engineering)?|cse|information technology|it|electronics|electrical|mechanical|civil|data science|artificial intelligence|commerce|management)\b/i) || [])[1] || null,
      institution,
      endYear: year,
      score: cgpa ? { type: 'cgpa', value: Number(cgpa[1]), scale: Number(cgpa[2] || 10) } : pct ? { type: 'percentage', value: Number(pct[1]) } : null,
      raw: line.slice(0, 200),
    });
  }
  return entries.slice(0, 6);
}

/** Total professional months from date ranges, merging overlaps. */
function computeExperienceMonths(text, now = new Date()) {
  const spans = [];
  for (const m of text.matchAll(DATE_RANGE)) {
    const start = Number(m[2]) * 12 + monthOf(m[1]);
    const end = m[5] ? now.getUTCFullYear() * 12 + now.getUTCMonth() : Number(m[4]) * 12 + monthOf(m[3]);
    if (end >= start && end - start < 12 * 40) spans.push([start, end]);
  }
  spans.sort((a, b) => a[0] - b[0]);
  const merged = [];
  for (const s of spans) {
    const last = merged[merged.length - 1];
    if (last && s[0] <= last[1]) last[1] = Math.max(last[1], s[1]); else merged.push([...s]);
  }
  return merged.reduce((sum, [a, b]) => sum + Math.max(1, b - a), 0);
}

function parseBullets(text, max = 8) {
  return text.split('\n').map((l) => l.replace(/^[\s•·*\-–—>\d.)]+/, '').trim()).filter((l) => l.length > 3).slice(0, max);
}

export function extractResume(text = '', { now = new Date() } = {}) {
  const raw = String(text ?? '').replace(/\r/g, '').trim();
  if (!raw) return emptyResume();

  const sections = splitSections(raw);
  const email = extractEmail(raw);
  const phone = extractPhone(raw);
  const education = parseEducation(sections.education, raw);
  const experienceText = sections.experience || '';
  const experienceMonths = experienceText ? computeExperienceMonths(experienceText, now) : 0;
  const skillSource = [sections.skills, sections.projects, sections.experience, sections.summary].filter(Boolean).join('\n') || raw;
  const skills = unique([...extractSkills(sections.skills || ''), ...extractSkills(skillSource), ...extractSkills(raw)]);
  const name = extractName(sections.header || raw, email);

  const found = [name, email, phone, education.length, skills.length >= 3, experienceText, sections.projects].filter(Boolean).length;
  const warnings = [];
  if (!email) warnings.push('No email address detected.');
  if (!phone) warnings.push('No valid phone number detected.');
  if (!skills.length) warnings.push('No recognised skills found; resume may be image-based or use unusual terms.');
  if (raw.length < 80) warnings.push('Resume text is very short; extraction is low reliability.');

  return {
    name,
    contact: { email, phone, ...extractLinks(raw) },
    education,
    experience: {
      totalMonths: experienceMonths,
      totalYears: Number((experienceMonths / 12).toFixed(1)),
      highlights: parseBullets(experienceText, 6),
    },
    projects: parseBullets(sections.projects || '', 6),
    certifications: parseBullets(sections.certifications || '', 6),
    skills,
    skillCategories: skillCategories(skills),
    summary: (sections.summary ? sentences(sections.summary) : sentences(raw)).slice(0, 3).join(' '),
    sectionsDetected: Object.keys(sections).filter((k) => k !== 'header' && sections[k]),
    warnings,
    confidence: clamp(0.25 + found * 0.1 - warnings.length * 0.03, 0.1, 0.95),
  };
}

function emptyResume() {
  return { name: null, contact: { email: null, phone: null, linkedin: null, github: null, portfolio: null }, education: [], experience: { totalMonths: 0, totalYears: 0, highlights: [] }, projects: [], certifications: [], skills: [], skillCategories: {}, summary: '', sectionsDetected: [], warnings: ['Empty resume text.'], confidence: 0.1 };
}
