import React, { createContext, useState, useContext, useEffect } from 'react';
import adminApi from '../lib/adminApi';
import { useAuth } from './AuthContext';

const AdminContext = createContext();

export function AdminProvider({ children }) {
  const { isAuthenticated } = useAuth();

  // Check sessionStorage; defaults to 'dark' on a fresh tab
  const [theme, setTheme] = useState(() => {
    return sessionStorage.getItem('alpha_theme') || 'dark';
  });

  // Inject the class and save to the current session
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    sessionStorage.setItem('alpha_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'dark' ? 'light' : 'dark'));
  };
  
  const [adminProfile, setAdminProfile] = useState({ name: '', avatar: '' });
  const [profileData, setProfileData] = useState({ firstName: '', lastName: '' });
  const [applications, setApplications] = useState([]);
  const [records, setRecords] = useState([]);
  const [dashboardStats, setDashboardStats] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [certificateTemplates, setCertificateTemplates] = useState([]);
  const [idCardTemplates, setIdCardTemplates] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [backups, setBackups] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [alertChannels, setAlertChannels] = useState({});
  const [intents, setIntents] = useState([]);
  const [databaseConfig, setDatabaseConfig] = useState({});
  const [commandHistory, setCommandHistory] = useState([]);
  const [inferences, setInferences] = useState([]);
  const [adminPermissions, setAdminPermissions] = useState({
    vault: {},
    directory: {},
    aiCenter: {},
    logs: {},
  });

  useEffect(() => {
    if (!isAuthenticated) return undefined;

    let active = true;
    adminApi.getAdminData().then((data) => {
      if (!active) return;
      setAdminProfile(data.adminProfile);
      setProfileData(data.profileData);
      setApplications(data.applications);
      setRecords(data.records);
      setDashboardStats(data.dashboardStats);
      setRecentActivity(data.recentActivity);
      setTasks(data.tasks);
      setDocuments(data.documents);
      setCertificateTemplates(data.certificateTemplates);
      setIdCardTemplates(data.idCardTemplates);
      setAuditLogs(data.auditLogs);
      setBackups(data.backups);
      setAlerts(data.alerts);
      setAlertChannels(data.alertChannels);
      setIntents(data.intents);
      setDatabaseConfig(data.databaseConfig);
      setCommandHistory(data.commandHistory);
      setInferences(data.inferences);
      setAdminPermissions(data.adminPermissions);
    }).catch((error) => {
      console.error('Unable to load admin data:', error);
    });
    return () => { active = false; };
  }, [isAuthenticated]);

  return (
    <AdminContext.Provider value={{ 
      theme, toggleTheme,
      adminProfile, setAdminProfile,
      profileData, setProfileData,
      applications, setApplications,
      records, setRecords,
      dashboardStats,
      recentActivity,
      tasks, setTasks,
      documents, setDocuments,
      certificateTemplates,
      idCardTemplates,
      auditLogs,
      backups, setBackups,
      alerts, setAlerts,
      alertChannels, setAlertChannels,
      intents, setIntents,
      databaseConfig, setDatabaseConfig
      ,commandHistory, setCommandHistory,
      inferences, setInferences,
      adminPermissions, setAdminPermissions
    }}>
      {children}
    </AdminContext.Provider>
  );
}

export const useAdmin = () => useContext(AdminContext);