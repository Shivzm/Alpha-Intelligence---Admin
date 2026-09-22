import React, { useState, useRef } from "react";
import { useAdmin } from "../../context/AdminContext";

export default function ProfileSettings() {
  const { adminProfile, setAdminProfile } = useAdmin();

  // --- AVATAR STATE ---
  const [previewUrl, setPreviewUrl] = useState(adminProfile.avatar);
  const fileInputRef = useRef(null);

  // --- PROFILE INFO STATE ---
  const [profileData, setProfileData] = useState({
    firstName: "Admin",
    lastName: "User",
    email: "admin@alpha.com",
    phone: "+1 (555) 019-2041",
    timezone: "UTC-05:00 Eastern Time (US & Canada)",
  });

  // --- SECURITY STATE ---
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);

  // --- HANDLERS ---
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
    }
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    
    // Update global context for the avatar and name (for the sidebar)
    setAdminProfile((prev) => ({ 
      ...prev, 
      avatar: previewUrl,
      name: `${profileData.firstName} ${profileData.lastName}`
    }));

    console.log("Saving Profile Payload:", { ...profileData, avatar: previewUrl });
    alert("Profile settings updated successfully!");
  };

  const handleUpdatePassword = (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("Error: New passwords do not match.");
      return;
    }
    if (passwordData.newPassword.length < 8) {
      alert("Error: Password must be at least 8 characters.");
      return;
    }

    console.log("Saving Password Payload:", passwordData);
    alert("Password updated securely.");
    
    setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
  };

  return (
    <div className="h-full w-full p-8 overflow-y-auto bg-gray-50 dark:bg-[#07080a] transition-colors duration-300">
      {/* Header */}
      <div className="flex items-center gap-4 mb-2">
        <i className="ri-settings-3-line text-4xl text-gray-500 dark:text-gray-400"></i>
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">Profile Settings</h1>
      </div>
      <p className="text-gray-600 dark:text-gray-500 text-sm mb-8">
        Manage your administrator profile details, security preferences, and account settings.
      </p>

      <div className="max-w-4xl space-y-8 pb-12">
        
        {/* SECTION 1: PUBLIC PROFILE & AVATAR */}
        <div className="border border-gray-200 dark:border-gray-800/80 rounded-xl p-8 bg-white dark:bg-[#0c0d12] shadow-sm dark:shadow-none transition-colors duration-300">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6 border-b border-gray-200 dark:border-gray-800 pb-2 flex items-center gap-2">
            <i className="ri-user-smile-line text-[#00e676]"></i> Public Identity
          </h2>
          
          <div className="flex items-center gap-6 mb-8">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current.click()}>
              <img src={previewUrl} alt="Current Avatar" className="w-24 h-24 rounded-full border-2 border-[#00e676] object-cover bg-gray-100 dark:bg-gray-800" />
              <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <i className="ri-camera-fill text-white text-xl"></i>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">Avatar Image</h3>
              <button onClick={() => fileInputRef.current.click()} className="text-sm text-[#00e676] hover:text-[#00c868] transition-colors bg-transparent border-none cursor-pointer p-0 font-medium">
                Upload from device
              </button>
              <p className="text-xs text-gray-500 mt-1">PNG, JPG or GIF (Max. 800x400px)</p>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/png, image/jpeg, image/gif" className="hidden" />
            </div>
          </div>
        </div>

        {/* SECTION 2: PERSONAL INFORMATION */}
        <form onSubmit={handleSaveProfile} className="border border-gray-200 dark:border-gray-800/80 rounded-xl p-8 bg-white dark:bg-[#0c0d12] shadow-sm dark:shadow-none transition-colors duration-300">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6 border-b border-gray-200 dark:border-gray-800 pb-2 flex items-center gap-2">
            <i className="ri-profile-line text-[#00e676]"></i> Personal Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-gray-600 dark:text-gray-400 text-xs uppercase tracking-wider mb-2 font-medium">First Name</label>
              <input 
                type="text" 
                value={profileData.firstName}
                onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                className="w-full bg-gray-50 dark:bg-[#13151c] border border-gray-300 dark:border-gray-800 rounded-lg py-2.5 px-4 text-sm text-gray-900 dark:text-gray-200 focus:outline-none focus:border-[#00e676] transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-gray-600 dark:text-gray-400 text-xs uppercase tracking-wider mb-2 font-medium">Last Name</label>
              <input 
                type="text" 
                value={profileData.lastName}
                onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                className="w-full bg-gray-50 dark:bg-[#13151c] border border-gray-300 dark:border-gray-800 rounded-lg py-2.5 px-4 text-sm text-gray-900 dark:text-gray-200 focus:outline-none focus:border-[#00e676] transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-gray-600 dark:text-gray-400 text-xs uppercase tracking-wider mb-2 font-medium">Email Address</label>
              <input 
                type="email" 
                value={profileData.email}
                onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                className="w-full bg-gray-50 dark:bg-[#13151c] border border-gray-300 dark:border-gray-800 rounded-lg py-2.5 px-4 text-sm text-gray-900 dark:text-gray-200 focus:outline-none focus:border-[#00e676] transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-gray-600 dark:text-gray-400 text-xs uppercase tracking-wider mb-2 font-medium">Phone Number</label>
              <input 
                type="tel" 
                value={profileData.phone}
                onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                className="w-full bg-gray-50 dark:bg-[#13151c] border border-gray-300 dark:border-gray-800 rounded-lg py-2.5 px-4 text-sm text-gray-900 dark:text-gray-200 focus:outline-none focus:border-[#00e676] transition-colors"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-gray-600 dark:text-gray-400 text-xs uppercase tracking-wider mb-2 font-medium">Timezone</label>
              <select 
                value={profileData.timezone}
                onChange={(e) => setProfileData({...profileData, timezone: e.target.value})}
                className="w-full bg-gray-50 dark:bg-[#13151c] border border-gray-300 dark:border-gray-800 rounded-lg py-2.5 px-4 text-sm text-gray-900 dark:text-gray-200 focus:outline-none focus:border-[#00e676] transition-colors appearance-none cursor-pointer"
              >
                <option value="UTC-08:00 Pacific Time (US & Canada)">UTC-08:00 Pacific Time</option>
                <option value="UTC-05:00 Eastern Time (US & Canada)">UTC-05:00 Eastern Time</option>
                <option value="UTC+00:00 Greenwich Mean Time">UTC+00:00 Greenwich Mean Time</option>
                <option value="UTC+05:30 Indian Standard Time">UTC+05:30 Indian Standard Time</option>
              </select>
            </div>
          </div>
          
          <div className="flex justify-end">
            <button type="submit" className="bg-[#00e676] hover:bg-[#00c868] text-black font-semibold px-6 py-2 rounded-lg text-sm transition-colors shadow-[0_0_15px_rgba(0,230,118,0.2)]">
              Save Profile Data
            </button>
          </div>
        </form>

        {/* SECTION 3: SECURITY & PASSWORD */}
        <div className="border border-gray-200 dark:border-gray-800/80 rounded-xl p-8 bg-white dark:bg-[#0c0d12] shadow-sm dark:shadow-none transition-colors duration-300">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6 border-b border-gray-200 dark:border-gray-800 pb-2 flex items-center gap-2">
            <i className="ri-shield-keyhole-line text-[#00e676]"></i> Security & Authentication
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            
            {/* Password Update Form */}
            <form onSubmit={handleUpdatePassword} className="space-y-5">
              <h3 className="text-sm font-medium text-gray-800 dark:text-gray-300 mb-4">Change Password</h3>
              <div>
                <label className="block text-gray-600 dark:text-gray-400 text-xs uppercase tracking-wider mb-2 font-medium">Current Password</label>
                <input 
                  type="password" 
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-[#13151c] border border-gray-300 dark:border-gray-800 rounded-lg py-2.5 px-4 text-sm text-gray-900 dark:text-gray-200 focus:outline-none focus:border-[#00e676] transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-600 dark:text-gray-400 text-xs uppercase tracking-wider mb-2 font-medium">New Password</label>
                <input 
                  type="password" 
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-[#13151c] border border-gray-300 dark:border-gray-800 rounded-lg py-2.5 px-4 text-sm text-gray-900 dark:text-gray-200 focus:outline-none focus:border-[#00e676] transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-600 dark:text-gray-400 text-xs uppercase tracking-wider mb-2 font-medium">Confirm New Password</label>
                <input 
                  type="password" 
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-[#13151c] border border-gray-300 dark:border-gray-800 rounded-lg py-2.5 px-4 text-sm text-gray-900 dark:text-gray-200 focus:outline-none focus:border-[#00e676] transition-colors"
                  required
                />
              </div>
              <div className="pt-2">
                <button type="submit" className="bg-transparent border border-gray-300 dark:border-gray-700 hover:border-[#00e676] text-gray-700 dark:text-gray-300 hover:text-[#00e676] px-6 py-2 rounded-lg text-sm transition-colors">
                  Update Password
                </button>
              </div>
            </form>

            {/* Two-Factor Auth Toggle */}
            <div>
               <h3 className="text-sm font-medium text-gray-800 dark:text-gray-300 mb-4">Two-Factor Authentication (2FA)</h3>
               <div className="bg-gray-50 dark:bg-[#13151c] border border-gray-200 dark:border-gray-800/50 p-5 rounded-lg transition-colors">
                 <div className="flex justify-between items-start mb-4">
                   <div className="pr-4">
                     <p className="text-sm text-gray-900 dark:text-white font-medium mb-1">Authenticator App</p>
                     <p className="text-xs text-gray-600 dark:text-gray-500 leading-relaxed">
                       Add an extra layer of security to your account by requiring a time-based code from an authenticator app (like Google Authenticator or Authy) when logging in.
                     </p>
                   </div>
                   {/* Custom Toggle Switch */}
                   <div 
                     className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${twoFactorEnabled ? 'bg-[#00e676]' : 'bg-gray-300 dark:bg-gray-700'}`} 
                     onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                   >
                     <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${twoFactorEnabled ? 'translate-x-7' : 'translate-x-1'}`}></div>
                   </div>
                 </div>
                 
                 {twoFactorEnabled && (
                   <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800/50 flex gap-3">
                     <button className="text-xs text-[#00e676] bg-[#00e676]/10 px-3 py-1.5 rounded hover:bg-[#00e676]/20 transition-colors">
                       View Recovery Codes
                     </button>
                     <button className="text-xs text-gray-600 dark:text-gray-400 bg-gray-200 dark:bg-gray-800/50 px-3 py-1.5 rounded hover:text-gray-900 dark:hover:text-white transition-colors">
                       Reset App
                     </button>
                   </div>
                 )}
               </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}