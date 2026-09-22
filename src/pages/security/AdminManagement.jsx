import React, { useState } from "react";
import { useAdmin } from "../../context/AdminContext";

export default function AdminManagement() {
  const { adminPermissions } = useAdmin();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "Viewer",
  });

  // Authorization Matrix State
  const [permissions, setPermissions] = useState({});

  React.useEffect(() => setPermissions(adminPermissions), [adminPermissions]);

  const handlePermissionToggle = (module, action) => {
    setPermissions(prev => ({
      ...prev,
      [module]: {
        ...prev[module],
        [action]: !prev[module][action]
      }
    }));
  };

  const handleSave = () => {
    alert(`New Admin ${formData.name} created with custom permissions!`);
  };

  return (
    <div className="h-full w-full p-8 overflow-y-auto">
      <div className="flex items-center gap-4 mb-2">
        <i className="ri-shield-user-line text-4xl text-secondary"></i>
        <h1 className="text-3xl font-semibold">Admin Management</h1>
      </div>
      <p className="text-secondary text-sm mb-8">
        Onboard new administrators and configure granular Role-Based Access Controls (RBAC).
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Admin Profile Details */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-surface border border-divider rounded-xl p-6">
            <h2 className="text-lg font-medium text-primary mb-6 border-b border-divider pb-2">Profile Details</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-secondary text-xs uppercase tracking-wider mb-2">Full Name</label>
                <input 
                  type="text" 
                  placeholder="e.g., Jane Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-surface-hover border border-divider rounded-lg py-2.5 px-4 text-sm text-gray-200 focus:outline-none focus:border-[#00e676]/50 transition-colors"
                />
              </div>

              <div>
                <label className="block text-secondary text-xs uppercase tracking-wider mb-2">Email Address</label>
                <input 
                  type="email" 
                  placeholder="admin@alpha.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-surface-hover border border-divider rounded-lg py-2.5 px-4 text-sm text-gray-200 focus:outline-none focus:border-[#00e676]/50 transition-colors"
                />
              </div>

              <div>
                <label className="block text-secondary text-xs uppercase tracking-wider mb-2">Base Role Template</label>
                <select 
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="w-full bg-surface-hover border border-divider rounded-lg py-2.5 px-4 text-sm text-gray-200 focus:outline-none focus:border-[#00e676]/50 transition-colors appearance-none"
                >
                  <option value="Super Admin">Super Admin (Full Access)</option>
                  <option value="Editor">Editor (Read/Write)</option>
                  <option value="Viewer">Viewer (Read Only)</option>
                  <option value="Custom">Custom Role</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Authorization Matrix */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface border border-divider rounded-xl p-6">
            <div className="flex justify-between items-center mb-6 border-b border-divider pb-2">
              <h2 className="text-lg font-medium text-primary">Authorization Matrix</h2>
              <span className="text-xs text-[#00e676] bg-[#00e676]/10 px-3 py-1 rounded-full border border-[#00e676]/20">
                Live Configuration
              </span>
            </div>

            <div className="space-y-6">
              {/* Document Vault Permissions */}
              <div className="grid grid-cols-4 items-center p-4 bg-surface-hover rounded-lg border border-divider/50 hover:border-gray-700 transition-colors">
                <div className="col-span-1">
                  <h3 className="text-sm font-medium text-gray-200 flex items-center gap-2">
                    <i className="ri-folder-2-line text-secondary"></i> Document Vault
                  </h3>
                </div>
                <div className="col-span-3 flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-secondary">
                    <input type="checkbox" checked={permissions.vault.view} onChange={() => handlePermissionToggle('vault', 'view')} className="accent-[#00e676] w-4 h-4 rounded border-gray-700" />
                    View
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-secondary">
                    <input type="checkbox" checked={permissions.vault.export} onChange={() => handlePermissionToggle('vault', 'export')} className="accent-[#00e676] w-4 h-4 rounded border-gray-700" />
                    Export
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-secondary">
                    <input type="checkbox" checked={permissions.vault.revoke} onChange={() => handlePermissionToggle('vault', 'revoke')} className="accent-red-500 w-4 h-4 rounded border-gray-700" />
                    Revoke
                  </label>
                </div>
              </div>

              {/* User Directory Permissions */}
              <div className="grid grid-cols-4 items-center p-4 bg-surface-hover rounded-lg border border-divider/50 hover:border-gray-700 transition-colors">
                <div className="col-span-1">
                  <h3 className="text-sm font-medium text-gray-200 flex items-center gap-2">
                    <i className="ri-user-3-line text-secondary"></i> User Directory
                  </h3>
                </div>
                <div className="col-span-3 flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-secondary">
                    <input type="checkbox" checked={permissions.directory.view} onChange={() => handlePermissionToggle('directory', 'view')} className="accent-[#00e676] w-4 h-4 rounded border-gray-700" />
                    View
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-secondary">
                    <input type="checkbox" checked={permissions.directory.edit} onChange={() => handlePermissionToggle('directory', 'edit')} className="accent-[#00e676] w-4 h-4 rounded border-gray-700" />
                    Edit Records
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-secondary">
                    <input type="checkbox" checked={permissions.directory.approve} onChange={() => handlePermissionToggle('directory', 'approve')} className="accent-[#00e676] w-4 h-4 rounded border-gray-700" />
                    Approve Interns
                  </label>
                </div>
              </div>

              {/* AI Command Center Permissions */}
              <div className="grid grid-cols-4 items-center p-4 bg-surface-hover rounded-lg border border-divider/50 hover:border-gray-700 transition-colors">
                <div className="col-span-1">
                  <h3 className="text-sm font-medium text-gray-200 flex items-center gap-2">
                    <i className="ri-terminal-window-line text-secondary"></i> AI Command
                  </h3>
                </div>
                <div className="col-span-3 flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-secondary">
                    <input type="checkbox" checked={permissions.aiCenter.execute} onChange={() => handlePermissionToggle('aiCenter', 'execute')} className="accent-purple-500 w-4 h-4 rounded border-gray-700" />
                    Execute Commands
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-secondary">
                    <input type="checkbox" checked={permissions.aiCenter.telemetry} onChange={() => handlePermissionToggle('aiCenter', 'telemetry')} className="accent-[#00e676] w-4 h-4 rounded border-gray-700" />
                    View Telemetry
                  </label>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex justify-end gap-4 border-t border-divider pt-6">
              <button className="bg-transparent border border-gray-700 text-gray-300 hover:text-primary px-6 py-2 rounded-lg text-sm transition-colors">
                Cancel
              </button>
              <button className="bg-transparent border border-[#00e676]/50 text-[#00e676] hover:bg-[#00e676]/10 px-6 py-2 rounded-lg text-sm transition-colors">
                Save as New Role
              </button>
              <button 
                onClick={handleSave}
                className="bg-[#00e676] hover:bg-[#00c868] text-black font-semibold px-6 py-2 rounded-lg text-sm transition-colors shadow-[0_0_15px_rgba(0,230,118,0.2)]"
              >
                Provision Admin Account
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}