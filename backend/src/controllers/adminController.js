const { countDocuments, getFirestoreDb, listDocuments } = require("../services/firestore");

const DEFAULT_ALERT_CHANNELS = { email: true, sms: false, dashboard: true };
const EMPTY_PERMISSIONS = { vault: {}, directory: {}, aiCenter: {}, logs: {} };

function toActivity(items, titleForItem) {
  return items
    .map((item) => {
      const timestamp = item.at || item.createdAt || item.updatedAt || item.appliedAt;
      const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
      return {
        title: titleForItem(item),
        time: Number.isNaN(date.getTime()) ? "" : date.toLocaleString(),
        timestamp: Number.isNaN(date.getTime()) ? 0 : date.getTime(),
      };
    })
    .filter((item) => item.timestamp)
    .sort((first, second) => second.timestamp - first.timestamp);
}

async function getAdminData(request, response) {
  try {
    const database = getFirestoreDb();
    const [
      applications,
      records,
      tasks,
      documents,
      certificateTemplates,
      idCardTemplates,
      auditLogs,
      backups,
      alerts,
      intents,
      commandHistory,
      inferences,
      pendingApplications,
      activeRecords,
      openAlerts,
      settingsSnapshot,
    ] = await Promise.all([
      listDocuments("applications"),
      listDocuments("records"),
      listDocuments("tasks"),
      listDocuments("certificates"),
      listDocuments("certificateTemplates"),
      listDocuments("idCardTemplates"),
      listDocuments("auditLogs"),
      listDocuments("backups"),
      listDocuments("alerts"),
      listDocuments("intents"),
      listDocuments("commands"),
      listDocuments("inferences"),
      countDocuments("applications", [["status", "in", ["Submitted", "Under Review"]]]),
      countDocuments("records", [["status", "==", "active"]]),
      countDocuments("alerts", [["resolved", "==", false]]),
      database.collection("settings").doc("alertChannels").get(),
    ]);

    const displayApplications = applications.map((application) => ({
      ...application,
      name: application.applicantSnapshot?.name || application.name || "Unknown applicant",
      role: application.internshipTitle || application.applicantSnapshot?.domain || application.role || "Internship application",
      date: application.appliedAt || application.createdAt || application.date || "",
    }));
    const displayRecords = records.map((record) => ({
      ...record,
      name: record.name || record.userSnapshot?.name || "",
      program: record.program || record.internshipTitle || "",
    }));
    const displayDocuments = documents.map((document) => ({
      ...document,
      name: document.holderName || document.holder || document.name || "",
      type: document.type === "idcard" ? "ID Card" : document.type === "certificate" ? "Certificate" : document.type || "Document",
      date: document.issuedAt || document.createdAt || document.date || "",
    }));
    const displayAuditLogs = auditLogs.map((entry) => ({
      ...entry,
      admin: entry.actorId || (entry.actorType === "system" ? "System" : "Admin"),
      target: [entry.entity, entry.entityId].filter(Boolean).join(" / "),
      time: entry.at || entry.createdAt || "",
      status: entry.status || "Success",
    }));

    const auditActivity = toActivity(
      displayAuditLogs,
      (item) => `${item.action || "Updated"} ${item.entity || "record"}`,
    );
    const applicationHistory = await listDocuments("applicationHistory");
    const applicationActivity = toActivity(
      applicationHistory,
      (item) => `Application ${item.to || "updated"}`,
    );
    const recentActivity = [...auditActivity, ...applicationActivity]
      .sort((first, second) => second.timestamp - first.timestamp)
      .slice(0, 12)
      .map((item, index) => ({ title: item.title, time: item.time, active: index === 0 }));

    const alertChannels = settingsSnapshot.exists
      ? { ...DEFAULT_ALERT_CHANNELS, ...settingsSnapshot.data() }
      : DEFAULT_ALERT_CHANNELS;

    return response.json({
      adminProfile: { name: request.user.email, avatar: "" },
      profileData: { firstName: "Admin", lastName: "" },
      applications: displayApplications,
      records: displayRecords,
      dashboardStats: [
        { title: "Pending Applications", val: String(pendingApplications), icon: "ri-user-follow-line", color: "text-blue-400", trend: "Current" },
        { title: "Active Interns", val: String(activeRecords), icon: "ri-briefcase-4-line", color: "text-[#00e676]", trend: "Current" },
        { title: "Open Alerts", val: String(openAlerts), icon: "ri-alarm-warning-line", color: "text-orange-400", trend: "Current" },
        { title: "Documents", val: String(documents.length), icon: "ri-file-list-3-line", color: "text-purple-400", trend: "Latest 50" },
      ],
      recentActivity,
      tasks,
      documents: displayDocuments,
      certificateTemplates,
      idCardTemplates,
      auditLogs: displayAuditLogs,
      backups,
      alerts,
      alertChannels,
      intents,
      databaseConfig: {
        provider: "Cloud Firestore",
        projectId: process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || null,
        status: "connected",
      },
      commandHistory,
      inferences,
      adminPermissions: EMPTY_PERMISSIONS,
    });
  } catch (error) {
    console.error("Unable to load admin data:", error);
    const status = error.statusCode || 500;
    return response.status(status).json({
      error: {
        code: error.code || "ADMIN_DATA_UNAVAILABLE",
        message: status === 503 ? error.message : "Admin data is temporarily unavailable.",
        details: null,
        requestId: request.requestId || null,
      },
    });
  }
}

module.exports = { getAdminData };