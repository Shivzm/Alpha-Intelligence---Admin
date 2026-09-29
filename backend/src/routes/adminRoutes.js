const express = require("express");
const { getAdminData } = require("../controllers/adminController");
const { requireAuth } = require("../controllers/authController");
const {
	ApiError,
	createDocument,
	getDocument,
	listCollection,
	updateDocument,
	validatePayload,
	writeAuditLog,
} = require("../services/firestoreRepository");
const { changeApplicationStatus, changeApplicationsStatus } = require("../services/applicationService");
const { registerAdminResource } = require("./registerAdminResource");
const {
	getApplicationAnalytics,
	getApplicationDomains,
	getApplicationFunnel,
	getDashboardActivity,
	getDashboardStats,
	getTelemetry,
} = require("../controllers/dashboardController");
const {
	acknowledgeInboxItem,
	exportAuditLogs,
	getAlert,
	getAlertChannels,
	getAdminProfile,
	getBackups,
	getBackupSchedule,
	getDatabaseSettings,
	getAuditLog,
	getPermissions,
	getInboxUnreadCount,
	listAdmins,
	listCertificateRequests,
	listAlerts,
	listAuditLogs,
	listEnquiries,
	listInbox,
	resolveAlert,
	createBackup,
	decideCertificateRequest,
	sendNotifications,
	updateAlertChannel,
	updateAdminProfile,
	updateBackupSchedule,
	updateDatabaseSettings,
	updateEnquiry,
} = require("../controllers/adminOperationsController");
const {
	cancelCommand,
	confirmCommand,
	deleteIntent,
	getCommand,
	listCommands,
	submitCommand,
	testIntent,
} = require("../controllers/commandController");
const {
	archiveDocument: archiveAdminDocument,
	downloadDocument,
	generateDocuments,
	getDocumentDetails,
	listDocuments: listAdminDocuments,
	previewTemplate,
	reissueDocument,
	revokeDocument,
} = require("../controllers/documentController");
const { changeInternshipStatus, changeRecordStatus, getChanges } = require("../controllers/lifecycleController");
const { toCsv } = require("../services/csv");

const router = express.Router();

router.use(requireAuth);
router.get("/data", getAdminData);
router.get("/dashboard/stats", getDashboardStats);
router.get("/dashboard/activity", getDashboardActivity);
router.get("/analytics/applications", getApplicationAnalytics);
router.get("/analytics/funnel", getApplicationFunnel);
router.get("/analytics/domains", getApplicationDomains);
router.get("/telemetry", getTelemetry);
router.get("/telemetry/inferences", async (request, response) => {
	return response.json(await listCollection("inferences", { query: request.query }));
});
router.get("/profile", getAdminProfile);
router.put("/profile", updateAdminProfile);
router.get("/permissions", getPermissions);
router.get("/admins", listAdmins);
router.post("/admins", (request, response, next) => next(new ApiError(501, "MULTI_ADMIN_NOT_ENABLED", "The current authentication model uses one deployment-configured admin account.")));
router.put("/admins/:id", (request, response, next) => next(new ApiError(501, "MULTI_ADMIN_NOT_ENABLED", "The current authentication model uses one deployment-configured admin account.")));
router.patch("/admins/:id/role", (request, response, next) => next(new ApiError(501, "MULTI_ADMIN_NOT_ENABLED", "The current authentication model uses one deployment-configured admin account.")));
router.delete("/admins/:id", (request, response, next) => next(new ApiError(501, "MULTI_ADMIN_NOT_ENABLED", "The current authentication model uses one deployment-configured admin account.")));
router.get("/settings/database", getDatabaseSettings);
router.put("/settings/database", updateDatabaseSettings);
router.post("/settings/database/test", getDatabaseSettings);
router.get("/backups/schedule", getBackupSchedule);
router.put("/backups/schedule", updateBackupSchedule);
router.get("/backups", getBackups);
router.post("/backups", createBackup);
router.get("/backups/:id/download", (request, response, next) => next(new ApiError(503, "BACKUP_PROVIDER_NOT_CONFIGURED", "Backup storage is not configured.")));
router.post("/backups/:id/restore", (request, response, next) => next(new ApiError(503, "BACKUP_PROVIDER_NOT_CONFIGURED", "A managed Firestore export destination and job runner are required before restores can run.")));
router.delete("/backups/:id", (request, response, next) => next(new ApiError(503, "BACKUP_PROVIDER_NOT_CONFIGURED", "Backup storage is not configured.")));
router.patch("/internships/:id/status", changeInternshipStatus);
router.patch("/records/:id/status", changeRecordStatus);
router.get("/sync/changes", getChanges);
router.get("/documents", listAdminDocuments);
router.get("/documents/:id/download", downloadDocument);
router.get("/documents/:id", getDocumentDetails);
router.delete("/documents/:id", archiveAdminDocument);
router.post("/documents/:id/revoke", revokeDocument);
router.post("/documents/:id/reissue", reissueDocument);
router.post("/documents/certificates/generate", generateDocuments);
router.post("/documents/id-cards/generate", generateDocuments);
router.post("/templates/certificates/:id/preview", async (request, response, next) => {
	request.templateCollection = "certificateTemplates";
	return previewTemplate(request, response, next);
});
router.post("/templates/id-cards/:id/preview", async (request, response, next) => {
	request.templateCollection = "idCardTemplates";
	return previewTemplate(request, response, next);
});
router.post("/commands", submitCommand);
router.get("/commands", listCommands);
router.get("/commands/:id", getCommand);
router.post("/commands/:id/confirm", confirmCommand);
router.post("/commands/:id/cancel", cancelCommand);
router.post("/intents/test", testIntent);
router.delete("/intents/:id", deleteIntent);
router.get("/logs/engine", getTelemetry);
router.get("/logs/audit/export", exportAuditLogs);
router.get("/logs/audit", listAuditLogs);
router.get("/logs/audit/:id", getAuditLog);
router.get("/inbox/unread-count", getInboxUnreadCount);
router.get("/inbox", listInbox);
router.patch("/inbox/:id/ack", acknowledgeInboxItem);
router.get("/alerts", listAlerts);
router.get("/alerts/:id", getAlert);
router.patch("/alerts/:id/resolve", resolveAlert);
router.get("/alert-channels", getAlertChannels);
router.put("/alert-channels/:id", updateAlertChannel);
router.post("/alert-channels/:id/test", (request, response, next) => {
	return next(new ApiError(503, "DELIVERY_PROVIDER_NOT_CONFIGURED", "Alert delivery providers are not configured."));
});
router.get("/notifications", async (request, response) => {
	return response.json(await listCollection("notifications", {
		filters: request.query.userId ? [["userId", "==", request.query.userId]] : [],
		query: request.query,
	}));
});
router.post("/notifications", sendNotifications);
router.get("/enquiries", listEnquiries);
router.patch("/enquiries/:id", updateEnquiry);
router.get("/certificate-requests", listCertificateRequests);
router.patch("/certificate-requests/:id", decideCertificateRequest);

router.get("/applications/export", async (request, response) => {
	const filters = ["status", "internshipId", "domain"]
		.filter((field) => typeof request.query[field] === "string" && request.query[field] !== "")
		.map((field) => [field, "==", request.query[field]]);
	const result = await listCollection("applications", {
		filters,
		query: { page: 1, limit: 100 },
	});
	const rows = result.data.map((application) => [
			application.id,
			application.status,
			application.applicantSnapshot?.name,
			application.applicantSnapshot?.email,
			application.internshipId,
			application.appliedAt,
	]);
	response.type("text/csv").attachment("applications.csv");
	return response.send(toCsv(["id", "status", "applicant", "email", "internshipId", "appliedAt"], rows));
});

router.get("/records/export", async (request, response) => {
	const filters = ["status", "userId", "internshipId"]
		.filter((field) => typeof request.query[field] === "string" && request.query[field] !== "")
		.map((field) => [field, "==", request.query[field]]);
	const result = await listCollection("records", {
		filters,
		query: { page: 1, limit: 100 },
	});
	const rows = result.data.map((record) => [
		record.id,
		record.internCode,
		record.userId,
		record.internshipId,
		record.status,
		record.startDate,
		record.endDate,
		record.mentor,
	]);
	response.type("text/csv").attachment("records.csv");
	return response.send(toCsv(["id", "internCode", "userId", "internshipId", "status", "startDate", "endDate", "mentor"], rows));
});

router.get("/applications", async (request, response) => {
	const filters = ["status", "internshipId", "domain"]
		.filter((field) => typeof request.query[field] === "string" && request.query[field] !== "")
		.map((field) => [field, "==", request.query[field]]);
	return response.json(await listCollection("applications", { filters, query: request.query }));
});

router.post("/applications/bulk-status", async (request, response) => {
	const payload = validatePayload(request.body, ["applicationIds", "to", "reason"], ["applicationIds", "to"]);
	const data = await changeApplicationsStatus({
		applicationIds: payload.applicationIds,
		nextStatus: payload.to,
		reason: payload.reason,
		actorId: request.user.email,
		requestId: request.requestId,
	});
	return response.json({ data });
});

router.get("/applications/:id/history", async (request, response) => {
	const result = await listCollection("applicationHistory", {
		filters: [["applicationId", "==", request.params.id]],
		query: request.query,
	});
	return response.json(result);
});

router.post("/applications/:id/notes", async (request, response) => {
	const payload = validatePayload(request.body, ["note"], ["note"]);
	const application = await getDocument("applications", request.params.id);
	const note = await createDocument("applicationNotes", {
		applicationId: application.id,
		note: payload.note.trim(),
		actorId: request.user.email,
	});
	await writeAuditLog({
		actorId: request.user.email,
		action: "application.note.added",
		entity: "application",
		entityId: application.id,
		requestId: request.requestId,
	});
	return response.status(201).json({ data: note });
});

router.patch("/applications/:id/status", async (request, response) => {
	const payload = validatePayload(request.body, ["to", "reason"], ["to"]);
	const data = await changeApplicationStatus({
		applicationId: request.params.id,
		nextStatus: payload.to,
		reason: payload.reason,
		actorId: request.user.email,
		requestId: request.requestId,
	});
	return response.json({ data });
});

router.get("/applications/:id", async (request, response) => {
	const application = await getDocument("applications", request.params.id);
	const history = await listCollection("applicationHistory", {
		filters: [["applicationId", "==", request.params.id]],
		query: { limit: 100 },
	});
	return response.json({ data: { ...application, history: history.data } });
});

router.get("/users", async (request, response) => {
	const filters = ["status", "college"]
		.filter((field) => typeof request.query[field] === "string" && request.query[field] !== "")
		.map((field) => [field, "==", request.query[field]]);
	return response.json(await listCollection("users", { filters, query: request.query }));
});

router.patch("/users/:uid/status", async (request, response) => {
	const payload = validatePayload(request.body, ["status"], ["status"]);
	if (!["active", "suspended"].includes(payload.status)) {
		throw new ApiError(400, "INVALID_USER_STATUS", "User status must be active or suspended.");
	}
	const before = await getDocument("users", request.params.uid);
	const updated = await updateDocument("users", request.params.uid, { status: payload.status });
	await writeAuditLog({
		actorId: request.user.email,
		action: "user.status.changed",
		entity: "user",
		entityId: request.params.uid,
		requestId: request.requestId,
		before: { status: before.status || null },
		after: { status: updated.status },
	});
	return response.json({ data: updated });
});

router.get("/users/:uid/activity", async (request, response) => {
	const userApplications = await listCollection("applications", {
		filters: [["userId", "==", request.params.uid]],
		query: { limit: 100 },
	});
	const historyGroups = await Promise.all(userApplications.data.map((application) =>
		listCollection("applicationHistory", {
			filters: [["applicationId", "==", application.id]],
			query: { limit: 100 },
		})
	));
	const activity = historyGroups.flatMap((group) => group.data)
		.sort((first, second) => String(second.at).localeCompare(String(first.at)));
	return response.json({ data: activity.slice(0, 100), meta: { total: activity.length } });
});

router.get("/users/:uid", async (request, response) => {
	const user = await getDocument("users", request.params.uid);
	const applications = await listCollection("applications", {
		filters: [["userId", "==", request.params.uid]],
		query: { limit: 100 },
	});
	return response.json({ data: { ...user, applications: applications.data } });
});

registerAdminResource(router, {
	path: "/tasks",
	collection: "tasks",
	fields: ["title", "description", "status", "assignee", "dueDate", "priority"],
	requiredFields: ["title"],
	filterFields: ["status", "assignee"],
	deleteMode: "delete",
	operations: { getItem: false, replace: false },
});

registerAdminResource(router, {
	path: "/internships",
	collection: "internships",
	fields: ["title", "domain", "description", "requirements", "mode", "location", "durationWeeks", "stipend", "openings", "deadline", "status"],
	requiredFields: ["title", "domain", "description"],
	filterFields: ["status", "domain", "mode"],
	operations: { patch: false },
});

registerAdminResource(router, {
	path: "/records",
	collection: "records",
	fields: ["internCode", "userId", "applicationId", "internshipId", "startDate", "endDate", "status", "mentor"],
	requiredFields: ["userId", "internshipId", "status"],
	filterFields: ["userId", "status", "internshipId"],
	operations: { patch: false },
});

registerAdminResource(router, {
	path: "/stipends",
	collection: "stipends",
	fields: ["recordId", "userId", "period", "amount", "currency", "status", "paidOn", "reference"],
	requiredFields: ["recordId", "userId", "period", "amount", "currency", "status"],
	filterFields: ["recordId", "userId", "status", "period"],
	operations: { getItem: false, patch: false, remove: false },
});

registerAdminResource(router, {
	path: "/intents",
	collection: "intents",
	fields: ["name", "systemAction", "keywords", "confidenceMin", "enabled"],
	requiredFields: ["name", "systemAction", "keywords"],
	filterFields: ["enabled"],
	deleteMode: "delete",
	operations: { getItem: false, patch: false },
});

registerAdminResource(router, {
	path: "/templates/certificates",
	collection: "certificateTemplates",
	fields: ["name", "description", "layout", "fields", "active"],
	requiredFields: ["name", "layout"],
	deleteMode: "delete",
	operations: { patch: false },
});

registerAdminResource(router, {
	path: "/templates/id-cards",
	collection: "idCardTemplates",
	fields: ["name", "description", "layout", "fields", "active"],
	requiredFields: ["name", "layout"],
	deleteMode: "delete",
	operations: { patch: false },
});

router.get("/internships/:id/applications", async (request, response) => {
	const result = await listCollection("applications", {
		filters: [["internshipId", "==", request.params.id]],
		query: request.query,
	});
	return response.json(result);
});

router.get("/records/:id/stipend", async (request, response) => {
	const result = await listCollection("stipends", {
		filters: [["recordId", "==", request.params.id]],
		query: request.query,
	});
	return response.json(result);
});

module.exports = router;