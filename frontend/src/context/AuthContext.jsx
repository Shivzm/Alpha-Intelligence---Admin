import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import adminApi from '../lib/adminApi';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [expiresAt, setExpiresAt] = useState(null);

  useEffect(() => {
    let active = true;

    adminApi.getAuthStatus()
      .then((session) => {
        if (!active) return;
        setIsAuthenticated(true);
        setExpiresAt(session.expiresAt);
      })
      .catch(() => {
        if (active) setIsAuthenticated(false);
      })
      .finally(() => {
        if (active) setIsAuthLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const logout = () => {
    adminApi.logout().catch(() => {});
    setIsAuthenticated(false);
    setExpiresAt(null);
    navigate('/');
  };

  const login = (sessionExpiresAt, redirectPath = '/admin-dashboard') => {
    setIsAuthenticated(true);
    setExpiresAt(sessionExpiresAt);
    navigate(redirectPath);
  };

  useEffect(() => {
    if (!isAuthenticated || !expiresAt) return undefined;

    const timeout = window.setTimeout(() => {
      setIsAuthenticated(false);
      setExpiresAt(null);
      navigate('/');
    }, Math.max(0, expiresAt - Date.now()));

    return () => window.clearTimeout(timeout);
  }, [expiresAt, isAuthenticated, navigate]);

  return (
    <AuthContext.Provider value={{ isAuthenticated, isAuthLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);