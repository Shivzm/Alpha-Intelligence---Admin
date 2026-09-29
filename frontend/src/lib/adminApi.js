const apiUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, "");

async function request(path, options = {}) {
  if (!apiUrl) {
    throw new Error("VITE_API_URL is not configured.");
  }

  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const apiError = error.error || error;
    const failure = new Error(apiError.message || `API request failed: ${response.status}`);
    failure.code = apiError.code;
    failure.status = response.status;
    throw failure;
  }

  return response.status === 204 ? null : response.json();
}

async function downloadCsv(path, filename) {
  const response = await fetch(`${apiUrl}${path}`, { credentials: "include" });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const apiError = error.error || error;
    throw new Error(apiError.message || `API request failed: ${response.status}`);
  }
  const objectUrl = URL.createObjectURL(await response.blob());
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(objectUrl);
}

export const adminApi = {
  getAdminData() {
    return request("/api/admin/data");
  },

  getApplicationAnalytics() {
    return request("/api/admin/analytics/applications");
  },

  getApplicationFunnel() {
    return request("/api/admin/analytics/funnel");
  },

  getApplicationDomains() {
    return request("/api/admin/analytics/domains");
  },

  listInternships(filters = {}) {
    const params = new URLSearchParams(filters);
    return request(`/api/admin/internships${params.size ? `?${params}` : ""}`);
  },

  createInternship(posting) {
    return request("/api/admin/internships", { method: "POST", body: JSON.stringify(posting) });
  },

  changeInternshipStatus(id, status) {
    return request(`/api/admin/internships/${encodeURIComponent(id)}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },

  listStipends(filters = {}) {
    const params = new URLSearchParams(filters);
    return request(`/api/admin/stipends${params.size ? `?${params}` : ""}`);
  },

  createStipend(stipend) {
    return request("/api/admin/stipends", { method: "POST", body: JSON.stringify(stipend) });
  },

  sendNotification(notification) {
    return request("/api/admin/notifications", { method: "POST", body: JSON.stringify(notification) });
  },

  listInbox(filters = {}) {
    const params = new URLSearchParams(filters);
    return request(`/api/admin/inbox${params.size ? `?${params}` : ""}`);
  },

  getInboxUnreadCount() {
    return request("/api/admin/inbox/unread-count");
  },

  acknowledgeInboxItem(id) {
    return request(`/api/admin/inbox/${encodeURIComponent(id)}/ack`, { method: "PATCH", body: JSON.stringify({}) });
  },

  listCertificateRequests(filters = {}) {
    const params = new URLSearchParams(filters);
    return request(`/api/admin/certificate-requests${params.size ? `?${params}` : ""}`);
  },

  decideCertificateRequest(id, status, note) {
    return request(`/api/admin/certificate-requests/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify({ status, note }),
    });
  },

  listEnquiries(filters = {}) {
    const params = new URLSearchParams(filters);
    return request(`/api/admin/enquiries${params.size ? `?${params}` : ""}`);
  },

  updateEnquiry(id, changes) {
    return request(`/api/admin/enquiries/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(changes),
    });
  },

  getTelemetry() {
    return request("/api/admin/telemetry");
  },

  exportAuditLogs(filters = {}) {
    const params = new URLSearchParams(filters);
    const query = params.size ? `?${params}` : "";
    return downloadCsv(`/api/admin/logs/audit/export${query}`, "audit-logs.csv");
  },

  getAuthStatus() {
    return request("/api/auth/me");
  },

  login(email, password) {
    return request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  loginWithGoogle(credential) {
    return request("/api/auth/google", {
      method: "POST",
      body: JSON.stringify({ credential }),
    });
  },

  getAdminProfile() {
    return request("/api/admin/profile");
  },

  listAdmins() {
    return request("/api/admin/admins");
  },

  getPermissions() {
    return request("/api/admin/permissions");
  },

  getDatabaseSettings() {
    return request("/api/admin/settings/database");
  },

  testDatabaseConnection() {
    return request("/api/admin/settings/database/test", { method: "POST" });
  },

  listBackups() {
    return request("/api/admin/backups");
  },

  createBackup() {
    return request("/api/admin/backups", { method: "POST", body: JSON.stringify({}) });
  },

  getBackupSchedule() {
    return request("/api/admin/backups/schedule");
  },

  updateBackupSchedule(schedule) {
    return request("/api/admin/backups/schedule", {
      method: "PUT",
      body: JSON.stringify(schedule),
    });
  },

  downloadBackup(id) {
    return request(`/api/admin/backups/${encodeURIComponent(id)}/download`);
  },

  restoreBackup(id) {
    return request(`/api/admin/backups/${encodeURIComponent(id)}/restore`, {
      method: "POST",
      body: JSON.stringify({ confirm: true }),
    });
  },

  updateAdminProfile(profile) {
    return request("/api/admin/profile", {
      method: "PUT",
      body: JSON.stringify(profile),
    });
  },

  logout() {
    return request("/api/auth/logout", { method: "POST" });
  },

  requestPasswordReset(email) {
    return request("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  updateApplicationStatus(id, to, reason) {
    return request(`/api/admin/applications/${encodeURIComponent(id)}/status`, {
      method: "PATCH",
      body: JSON.stringify({ to, reason }),
    });
  },

  bulkUpdateApplicationStatus(applicationIds, to, reason) {
    return request("/api/admin/applications/bulk-status", {
      method: "POST",
      body: JSON.stringify({ applicationIds, to, reason }),
    });
  },

  updateRecordStatus(id, status) {
    return request(`/api/admin/records/${encodeURIComponent(id)}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },

  deleteTask(id) {
    return request(`/api/admin/tasks/${encodeURIComponent(id)}`, { method: "DELETE" });
  },

  createTask(task) {
    return request("/api/admin/tasks", {
      method: "POST",
      body: JSON.stringify(task),
    });
  },

  updateAlertChannel(id, enabled) {
    return request(`/api/admin/alert-channels/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify({ enabled }),
    });
  },

  resolveAlert(id, note) {
    return request(`/api/admin/alerts/${encodeURIComponent(id)}/resolve`, {
      method: "PATCH",
      body: JSON.stringify({ note }),
    });
  },

  revokeDocument(id, reason) {
    return request(`/api/admin/documents/${encodeURIComponent(id)}/revoke`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  },

  downloadDocument(id) {
    return request(`/api/admin/documents/${encodeURIComponent(id)}/download`);
  },

  updateIntent(id, changes) {
    return request(`/api/admin/intents/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(changes),
    });
  },

  createIntent(intent) {
    return request("/api/admin/intents", {
      method: "POST",
      body: JSON.stringify(intent),
    });
  },

  testIntent(phrase) {
    return request("/api/admin/intents/test", {
      method: "POST",
      body: JSON.stringify({ phrase }),
    });
  },

  submitCommand(input, actionPayload) {
    return request("/api/admin/commands", {
      method: "POST",
      body: JSON.stringify({ input, actionPayload }),
    });
  },

  confirmCommand(id) {
    return request(`/api/admin/commands/${encodeURIComponent(id)}/confirm`, { method: "POST" });
  },

  cancelCommand(id) {
    return request(`/api/admin/commands/${encodeURIComponent(id)}/cancel`, { method: "POST" });
  },

  deleteIntent(id) {
    return request(`/api/admin/intents/${encodeURIComponent(id)}`, { method: "DELETE" });
  },
};

export default adminApi;
