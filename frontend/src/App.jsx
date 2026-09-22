import { BrowserRouter, Routes, Route } from "react-router-dom";
import "remixicon/fonts/remixicon.css";

import { AuthProvider } from "./context/AuthContext";
import { AdminProvider } from "./context/AdminContext";
import ProtectedRoute from "./components/layout/ProtectedRoute";

// Layouts & Full Pages
import AdminLayout from "./components/layout/AdminLayout";
import LoginPage from "./pages/auth/LoginPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import AdminDashboard from "./pages/AdminDashboard";

// Dashboard Group
import ActiveTasks from "./pages/dashboard/ActiveTasks";
import DocumentVault from "./pages/dashboard/DocumentVault";
import MainOverview from "./pages/dashboard/MainOverview";
import SystemAnalytics from "./pages/dashboard/SystemAnalytics";

// AI Command Center Group
import CommandInput from "./pages/ai-command/CommandInput";
import ModelTelemetry from "./pages/ai-command/ModelTelemetry";

// User Directory Group
import InternApplications from "./pages/user-directory/InternApplications";
import ManageRecords from "./pages/user-directory/ManageRecords";

// System Logs Group
import AuditTrails from "./pages/system-logs/AuditTrails";
import EnginePerformance from "./pages/system-logs/EnginePerformance";

// Settings Group
import DatabaseConfig from "./pages/settings/DatabaseConfig";
import NLPKeywordMapping from "./pages/settings/NLPKeywordMapping";
import ProfileSettings from "./pages/settings/ProfileSettings";
import SystemBackups from "./pages/settings/SystemBackups";

// Security Group
import AdminManagement from "./pages/security/AdminManagement";
import SystemAlerts from "./pages/security/SystemAlerts";

// Document Layouts Group
import CertificateTemplates from "./pages/document-layouts/CertificateTemplates";
import IDCardTemplates from "./pages/document-layouts/IDCardTemplates";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AdminProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LoginPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Protected Routes Wrapper */}
            <Route element={<ProtectedRoute />}>
              <Route path="/admin-dashboard" element={<AdminDashboard />} />

              {/* Sidebar Wrapped Sub-Pages */}
              <Route element={<AdminLayout />}>
                <Route path="/admin/dashboard/main-overview" element={<MainOverview />} />
                <Route path="/admin/dashboard/document-vault" element={<DocumentVault />} />
                <Route path="/admin/dashboard/analytics" element={<SystemAnalytics />} />
                <Route path="/admin/dashboard/active-tasks" element={<ActiveTasks />} />
                
                <Route path="/admin/ai-command/command-input" element={<CommandInput />} />
                <Route path="/admin/ai-command/telemetry" element={<ModelTelemetry />} />
                
                <Route path="/admin/user-directory/manage-records" element={<ManageRecords />} />
                <Route path="/admin/user-directory/applications" element={<InternApplications />} />
                
                <Route path="/admin/system-logs/engine-performance" element={<EnginePerformance />} />
                <Route path="/admin/system-logs/audit-trails" element={<AuditTrails />} />
                
                <Route path="/admin/settings/profile-settings" element={<ProfileSettings />} />
                <Route path="/admin/settings/database-config" element={<DatabaseConfig />} />
                <Route path="/admin/settings/nlp-mapping" element={<NLPKeywordMapping />} />
                <Route path="/admin/settings/system-backups" element={<SystemBackups />} />
                
                <Route path="/admin/security/admin-management" element={<AdminManagement />} />
                <Route path="/admin/security/system-alerts" element={<SystemAlerts />} />
                
                <Route path="/admin/doc-layouts/certificate-templates" element={<CertificateTemplates />} />
                <Route path="/admin/doc-layouts/id-card-templates" element={<IDCardTemplates />} />
              </Route>
            </Route>
          </Routes>
        </AdminProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;