import React, { createContext, useState, useContext } from 'react';

const AdminContext = createContext();

export function AdminProvider({ children }) {

  const [adminProfile, setAdminProfile] = useState({
    name: 'Admin',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
  });

  return (
    <AdminContext.Provider value={{ adminProfile, setAdminProfile }}>
      {children}
    </AdminContext.Provider>
  );
}

// Custom hook to use this context anywhere
export const useAdmin = () => useContext(AdminContext);