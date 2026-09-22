import React, { useState } from "react";
import { useAdmin } from "../../context/AdminContext";
import ThemeToggle from "../../components/ThemeToggle";

export default function ProfileSettings() {
  const { theme, toggleTheme, profileData, setProfileData } = useAdmin();

  return (
    <div className="h-full w-full p-8 overflow-y-auto bg-base transition-colors duration-300">
      
      <div className="flex items-center gap-4 mb-2">
        <i className="ri-settings-3-line text-4xl text-secondary"></i>
        <h1 className="text-3xl font-semibold text-primary">Profile Settings</h1>
      </div>
      <p className="text-secondary text-sm mb-8">
        Manage your administrator profile details and appearance.
      </p>

      <div className="max-w-4xl space-y-8 pb-12">
        
        {/* APPEARANCE SECTION */}
        <div className="border border-divider rounded-xl p-8 bg-surface shadow-sm transition-colors duration-300">
          <h2 className="text-lg font-medium text-primary mb-6 border-b border-divider pb-2 flex items-center gap-2">
            <i className="ri-palette-line text-brand"></i> Appearance
          </h2>
          
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-primary mb-1">Interface Theme</h3>
              <p className="text-xs text-secondary">Switch between light and dark mode for your dashboard.</p>
            </div>
            
            <ThemeToggle showLabel={true} />
          </div>
        </div>

        {/* PERSONAL INFORMATION SECTION */}
        <div className="border border-divider rounded-xl p-8 bg-surface shadow-sm transition-colors duration-300">
          <h2 className="text-lg font-medium text-primary mb-6 border-b border-divider pb-2 flex items-center gap-2">
            <i className="ri-profile-line text-brand"></i> Personal Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-secondary text-xs uppercase tracking-wider mb-2 font-medium">First Name</label>
              <input 
                type="text" 
                value={profileData.firstName}
                onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                className="w-full bg-surface-hover border border-divider rounded-lg py-2.5 px-4 text-sm text-primary focus:outline-none focus:border-brand transition-colors"
              />
            </div>
            <div>
              <label className="block text-secondary text-xs uppercase tracking-wider mb-2 font-medium">Last Name</label>
              <input 
                type="text" 
                value={profileData.lastName}
                onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                className="w-full bg-surface-hover border border-divider rounded-lg py-2.5 px-4 text-sm text-primary focus:outline-none focus:border-brand transition-colors"
              />
            </div>
          </div>
          
          <div className="flex justify-end">
            <button className="bg-brand hover:bg-brand-hover text-primary font-semibold px-6 py-2 rounded-lg text-sm transition-colors">
              Save Profile Data
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}