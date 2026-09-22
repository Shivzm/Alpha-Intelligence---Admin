import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const timeoutRef = useRef(null);
  
  // Set idle timeout (e.g., 15 minutes = 900,000 ms)
  const IDLE_TIMEOUT = 15 * 60 * 1000;

  // Initialize auth state from sessionStorage
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!sessionStorage.getItem('alpha_auth_token');
  });

  const logout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('alpha_auth_token');
    sessionStorage.removeItem('alpha_theme');
    navigate('/');
  };

  const login = (token, redirectPath = '/admin-dashboard') => {
    sessionStorage.setItem('alpha_auth_token', token);
    setIsAuthenticated(true);
    navigate(redirectPath);
  };

  // Reset the countdown timer on user activity
  const resetTimer = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (isAuthenticated) {
      timeoutRef.current = setTimeout(() => {
        alert("Session expired due to inactivity. Please log in again.");
        logout();
      }, IDLE_TIMEOUT);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      // Track standard user interactions to reset the idle timer
      const events = ['mousemove', 'keydown', 'scroll', 'click'];
      events.forEach(event => window.addEventListener(event, resetTimer));
      
      resetTimer(); // Start the timer immediately upon mount

      // Cleanup listeners on unmount
      return () => {
        events.forEach(event => window.removeEventListener(event, resetTimer));
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      };
    }
  }, [isAuthenticated]);

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);