function getAdminData(request, response) {
  return response.json({
    adminProfile: { name: request.user.email, avatar: "" },
    profileData: { firstName: "Admin", lastName: "" },
    applications: [],
    records: [],
    dashboardStats: [],
    recentActivity: [],
    tasks: [],
    documents: [],
    certificateTemplates: [],
    idCardTemplates: [],
    auditLogs: [],
    backups: [],
    alerts: [],
    alertChannels: { email: true, sms: false, dashboard: true },
    intents: [],
    databaseConfig: {},
    commandHistory: [],
    inferences: [],
    adminPermissions: { vault: {}, directory: {}, aiCenter: {}, logs: {} },
  });
}

module.exports = { getAdminData };