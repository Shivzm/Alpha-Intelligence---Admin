import React, { createContext, useState, useContext } from 'react';

const AdminContext = createContext();

export function AdminProvider({ children }) {
  // 1. Existing Profile State
  const [adminProfile, setAdminProfile] = useState({
    name: 'Admin',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
  });

  // 2. New State: Pending Applications
  const [applications, setApplications] = useState([
    { id: "APP-1042", name: "David Kim", role: "Frontend Dev", date: "2026-09-22", status: "Pending" },
    { id: "APP-1043", name: "Jessica Alba", role: "UI/UX Design", date: "2026-09-21", status: "In Review" },
    { id: "APP-1044", name: "Robert Fox", role: "Backend Dev", date: "2026-09-20", status: "Pending" },
  ]);

  // 3. New State: Approved Records
  const [records, setRecords] = useState([
    { id: "USR-001", name: "Alex Chen", program: "Frontend Intern", status: "Active" },
    { id: "USR-002", name: "Sarah Jenkins", program: "Data Science Intern", status: "Pending" },
  ]);

  return (
    // Make sure to expose the new states in the value prop below!
    <AdminContext.Provider value={{ 
      adminProfile, setAdminProfile,
      applications, setApplications,
      records, setRecords
    }}>
      {children}
    </AdminContext.Provider>
  );
}

export const useAdmin = () => useContext(AdminContext);