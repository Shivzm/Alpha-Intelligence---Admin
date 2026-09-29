import React, { useState } from "react";
import { useAdmin } from "../../context/AdminContext";

const DEFAULT_PERMISSIONS = {
  vault: { view: true, export: true, revoke: true },
  directory: { view: true, edit: true, approve: true },
  aiCenter: { execute: true, telemetry: true },
  logs: {},
};

export default function AdminManagement() {
  const { adminPermissions } = useAdmin();
  const [admins, setAdmins] = useState([]);
  const [permissionCatalog, setPermissionCatalog] = useState({ roles: [] });
  const [error, setError] = useState("");
  const [permissions, setPermissions] = useState(DEFAULT_PERMISSIONS);

  React.useEffect(() => {
    setPermissions({
      vault: { ...DEFAULT_PERMISSIONS.vault, ...adminPermissions.vault },
      directory: { ...DEFAULT_PERMISSIONS.directory, ...adminPermissions.directory },
      aiCenter: { ...DEFAULT_PERMISSIONS.aiCenter, ...adminPermissions.aiCenter },
      logs: { ...DEFAULT_PERMISSIONS.logs, ...adminPermissions.logs },
    });
  }, [adminPermissions]);

  React.useEffect(() => {
    let active = true;
    Promise.all([adminApi.listAdmins(), adminApi.getPermissions()])
      .then(([adminResult, permissionsResult]) => {
        if (!active) return;
        setAdmins(adminResult.data);
        setPermissionCatalog(permissionsResult.data);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message || "Unable to load admin accounts and permissions.");
      });
    return () => { active = false; };
  }, []);

  return (
    <div className="h-full w-full p-8 overflow-y-auto">
      <div className="flex items-center gap-4 mb-2">
        <i className="ri-shield-user-line text-4xl text-secondary"></i>
        <h1 className="text-3xl font-semibold">Admin Management</h1>
      </div>
      <p className="text-secondary text-sm mb-8">
        Review the deployment administrator and currently supported access model.
      </p>
      {error && <p role="alert" className="mb-4 rounded border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}
      <p className="mb-6 rounded border border-divider bg-surface px-4 py-3 text-sm text-secondary">
        This backend currently supports one administrator configured through deployment credentials. Multi-admin provisioning and editable roles are intentionally disabled until separate admin identities and role enforcement are implemented.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Configured Administrator */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-surface border border-divider rounded-xl p-6">
            <h2 className="text-lg font-medium text-primary mb-6 border-b border-divider pb-2">Configured Administrator</h2>
            <div className="space-y-3">
              {admins.map((admin) => (
                <div key={admin.id} className="rounded border border-divider bg-surface-hover p-4">
                  <p className="text-sm font-medium text-primary">{admin.name || admin.email}</p>
                  <p className="mt-1 text-xs text-secondary">{admin.email}</p>
                  <p className="mt-2 text-xs uppercase text-[#00e676]">{admin.role || "admin"} · {admin.status || "active"}</p>
                </div>
              ))}
              {admins.length === 0 && <p className="text-sm text-secondary">No admin account data returned.</p>}
            </div>
          </div>
        </div>

        {/* Right Column: Authorization Matrix */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface border border-divider rounded-xl p-6">
            <div className="flex justify-between items-center mb-6 border-b border-divider pb-2">
              <h2 className="text-lg font-medium text-primary">Authorization Matrix</h2>
              <span className="text-xs text-[#00e676] bg-[#00e676]/10 px-3 py-1 rounded-full border border-[#00e676]/20">
                Read-only
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
                    <input type="checkbox" checked={permissions.vault.view} disabled className="accent-[#00e676] w-4 h-4 rounded border-gray-700" />
                    View
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-secondary">
                    <input type="checkbox" checked={permissions.vault.export} disabled className="accent-[#00e676] w-4 h-4 rounded border-gray-700" />
                    Export
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-secondary">
                    <input type="checkbox" checked={permissions.vault.revoke} disabled className="accent-red-500 w-4 h-4 rounded border-gray-700" />
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
                    <input type="checkbox" checked={permissions.directory.view} disabled className="accent-[#00e676] w-4 h-4 rounded border-gray-700" />
                    View
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-secondary">
                    <input type="checkbox" checked={permissions.directory.edit} disabled className="accent-[#00e676] w-4 h-4 rounded border-gray-700" />
                    Edit Records
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-secondary">
                    <input type="checkbox" checked={permissions.directory.approve} disabled className="accent-[#00e676] w-4 h-4 rounded border-gray-700" />
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
                    <input type="checkbox" checked={permissions.aiCenter.execute} disabled className="accent-purple-500 w-4 h-4 rounded border-gray-700" />
                    Execute Commands
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-secondary">
                    <input type="checkbox" checked={permissions.aiCenter.telemetry} disabled className="accent-[#00e676] w-4 h-4 rounded border-gray-700" />
                    View Telemetry
                  </label>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}