const { countDocuments, listDocuments } = require("../services/firestore");

const FUNNEL_STATUSES = ["Submitted", "Under Review", "Shortlisted", "Selected", "Onboarded", "Completed"];

function timestampDate(value) {
  if (value?.toDate) return value.toDate();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function bucketFor(date, groupBy) {
  const bucket = new Date(date);
  if (groupBy === "month") {
    bucket.setUTCDate(1);
    return bucket.toISOString().slice(0, 7);
  }
  if (groupBy === "week") {
    const day = (bucket.getUTCDay() + 6) % 7;
    bucket.setUTCDate(bucket.getUTCDate() - day);
  }
  return bucket.toISOString().slice(0, 10);
}

async function getDashboardStats(request, response) {
  const [pendingApplications, activeInterns, openAlerts, documents] = await Promise.all([
    countDocuments("applications", [["status", "in", ["Submitted", "Under Review"]]]),
    countDocuments("records", [["status", "==", "active"]]),
    countDocuments("alerts", [["resolved", "==", false]]),
    countDocuments("certificates"),
  ]);

  return response.json({
    data: { pendingApplications, activeInterns, openAlerts, documents },
  });
}

async function getDashboardActivity(request, response) {
  const [auditLogs, applicationHistory, inboxItems] = await Promise.all([
    listDocuments("auditLogs", 50),
    listDocuments("applicationHistory", 50),
    listDocuments("adminInbox", 50),
  ]);
  const data = [
    ...auditLogs.map((item) => ({ ...item, kind: "audit" })),
    ...applicationHistory.map((item) => ({ ...item, kind: "application" })),
    ...inboxItems.map((item) => ({ ...item, kind: "inbox" })),
  ].sort((first, second) => {
    const firstDate = timestampDate(first.at || first.createdAt)?.getTime() || 0;
    const secondDate = timestampDate(second.at || second.createdAt)?.getTime() || 0;
    return secondDate - firstDate;
  }).slice(0, 50);

  return response.json({ data });
}

async function getApplicationAnalytics(request, response) {
  const groupBy = ["day", "week", "month"].includes(request.query.groupBy)
    ? request.query.groupBy
    : "day";
  const applications = await listDocuments("applications", 100);
  const buckets = new Map();

  for (const application of applications) {
    const date = timestampDate(application.appliedAt || application.createdAt);
    if (!date) continue;
    const bucket = bucketFor(date, groupBy);
    buckets.set(bucket, (buckets.get(bucket) || 0) + 1);
  }

  return response.json({
    data: [...buckets.entries()]
      .sort(([first], [second]) => first.localeCompare(second))
      .map(([period, count]) => ({ period, count })),
    meta: { groupBy, sampledRecords: applications.length, sampleLimit: 100 },
  });
}

async function getApplicationFunnel(request, response) {
  const applications = await listDocuments("applications", 100);
  const counts = Object.fromEntries(FUNNEL_STATUSES.map((status) => [status, 0]));
  for (const application of applications) {
    if (Object.hasOwn(counts, application.status)) counts[application.status] += 1;
  }
  return response.json({ data: FUNNEL_STATUSES.map((status) => ({ status, count: counts[status] })) });
}

async function getApplicationDomains(request, response) {
  const applications = await listDocuments("applications", 100);
  const domains = new Map();
  const colleges = new Map();
  for (const application of applications) {
    const domain = application.applicantSnapshot?.domain || application.domain || "Unspecified";
    const college = application.applicantSnapshot?.college || "Unspecified";
    domains.set(domain, (domains.get(domain) || 0) + 1);
    colleges.set(college, (colleges.get(college) || 0) + 1);
  }
  const toRows = (counts) => [...counts.entries()].map(([name, count]) => ({ name, count }));
  return response.json({ data: { domains: toRows(domains), colleges: toRows(colleges) } });
}

async function getTelemetry(request, response) {
  const inferences = await listDocuments("inferences", 100);
  const confidences = inferences
    .map((item) => Number(item.confidence))
    .filter(Number.isFinite)
    .map((confidence) => confidence <= 1 ? confidence : confidence / 100);
  const latencies = inferences.map((item) => Number(item.latencyMs)).filter(Number.isFinite);
  const average = (values) => values.length
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : 0;
  const hits = inferences.filter((item) => Boolean(item.intentId)).length;

  return response.json({
    data: {
      inferenceCount: inferences.length,
      meanConfidence: average(confidences),
      meanLatencyMs: average(latencies),
      intentHitRate: inferences.length ? hits / inferences.length : 0,
    },
    meta: { sampleLimit: 100 },
  });
}

module.exports = {
  getApplicationAnalytics,
  getApplicationDomains,
  getApplicationFunnel,
  getDashboardActivity,
  getDashboardStats,
  getTelemetry,
};
