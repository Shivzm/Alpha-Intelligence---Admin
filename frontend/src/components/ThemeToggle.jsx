import React from 'react';
import { useAdmin } from '../context/AdminContext';

export default function ThemeToggle({ showLabel = false, iconOnly = false, className = "" }) {
  const { theme, toggleTheme } = useAdmin();

  // Clean, icon-only variant for the header and sidebar
  if (iconOnly) {
    return (
      <button 
        onClick={toggleTheme}
        className={`flex items-center justify-center w-10 h-10 rounded-full hover:bg-surface-hover text-secondary hover:text-brand transition-colors ${className}`}
        title="Toggle Theme"
      >
        <i className={theme === 'dark' ? "ri-moon-fill text-xl" : "ri-sun-fill text-xl"}></i>
      </button>
    );
  }

  // Full variant with the switch (for Settings page)
  return (
    <button 
      onClick={toggleTheme}
      className={`flex items-center gap-3 px-4 py-2 bg-surface hover:bg-surface-hover border border-divider rounded-lg text-sm text-primary transition-colors ${className}`}
      title="Toggle Theme"
    >
      <i className={theme === 'dark' ? "ri-moon-fill text-brand" : "ri-sun-fill text-yellow-500 text-lg"}></i>
      
      {showLabel && (
        <span className="font-medium flex-1 text-left">
          {theme === 'dark' ? "Dark Mode" : "Light Mode"}
        </span>
      )}

      <div className={`w-10 h-5 rounded-full transition-colors relative shrink-0 ${theme === 'dark' ? 'bg-brand' : 'bg-gray-300 dark:bg-gray-700'}`}>
         <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] transition-transform ${theme === 'dark' ? 'translate-x-5' : 'translate-x-1'}`}></div>
      </div>
    </button>
  );
}