import React, { createContext, useState, useContext, useEffect } from 'react';

const AdminContext = createContext();

export function AdminProvider({ children }) {
  // 1. Existing State
  const [adminProfile, setAdminProfile] = useState({
    name: 'Admin User',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
  });

  const [applications, setApplications] = useState([]);
  const [records, setRecords] = useState([]);

  // 2. NEW: Theme State (Defaults to dark)
  const [theme, setTheme] = useState('dark');

  // 3. NEW: Theme Effect - injects 'dark' class into the HTML root
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'dark' ? 'light' : 'dark'));
  };

  return (
    <AdminContext.Provider value={{ 
      adminProfile, setAdminProfile,
      applications, setApplications,
      records, setRecords,
      theme, toggleTheme // Export the theme controls
    }}>
      {children}
    </AdminContext.Provider>
  );
}

export const useAdmin = () => useContext(AdminContext);