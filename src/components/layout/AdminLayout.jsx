import React, { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import logo from '../../assets/icons/alpha_logo.png';
import { useAdmin } from "../../context/AdminContext";

export default function AdminLayout() {
  const [expandedMenu, setExpandedMenu] = useState("Dashboard");
  const navigate = useNavigate();
  const location = useLocation(); // Gets the current URL to highlight the active menu
  const { adminProfile } = useAdmin();

  const NavItem = ({ icon, label, subItems }) => {
    const isExpanded = expandedMenu === label;

    // Check if any sub-item matches the current URL to keep the parent menu highlighted
    const isActive = subItems?.some((item) => location.pathname === item.path);

    return (
      <div className="mb-1">
        <button
          onClick={() => setExpandedMenu(isExpanded ? "" : label)}
          className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-all duration-300 rounded-r-lg border-l-2 ${isActive ? "border-[#00e676] bg-white/[0.02] text-white" : "border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/[0.02]"}`}
        >
          <div className="flex items-center gap-3">
            <i
              className={`${icon} text-lg ${isActive ? "text-[#00e676]" : ""}`}
            ></i>
            <span className="font-medium tracking-wide">{label}</span>
          </div>
          {subItems && (
            <i
              className={`ri-arrow-${isExpanded ? "down" : "right"}-s-line text-gray-500`}
            ></i>
          )}
        </button>

        {/* Submenu Items */}
        {isExpanded && subItems && (
          <div className="mt-1 flex flex-col">
            {subItems.map((item, idx) => {
              const isSubActive = location.pathname === item.path;
              return (
                <button
                  key={idx}
                  onClick={() => navigate(item.path)}
                  className={`w-full text-left pl-[3.25rem] py-2.5 text-xs tracking-wide transition-colors duration-200 border-l-2 ${isSubActive ? "border-[#00e676] text-white bg-white/[0.01]" : "border-transparent text-gray-500 hover:text-gray-300"}`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-[#07080a] text-white font-sans overflow-hidden selection:bg-[#00e676]/30">
      {/* Sidebar */}
      <aside className="w-64 border-r border-gray-800/60 bg-[#0a0b10] flex flex-col h-full z-20">
        {/* Brand Header */}
        <div className="h-20 flex items-center px-6 border-b border-gray-800/60">
          <img src= {logo} alt="Alpha logo" className="w-17 h-17 object-contain" />
          <span className="font-bold tracking-widest text-sm uppercase">
            Alpha
          </span>
        </div>

        {/* Search */}
        <div className="px-4 py-5">
          <div className="relative">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"></i>
            <input
              type="text"
              placeholder="Search for..."
              className="w-full bg-[#13151c] border border-gray-800/80 rounded-md py-2 pl-9 pr-4 text-xs text-gray-300 focus:outline-none focus:border-[#00e676]/50 transition-colors"
            />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-0 custom-scrollbar">
          <NavItem
            icon="ri-dashboard-line"
            label="Dashboard"
            subItems={[
              { label: "Main Overview", path: "/admin/dashboard/main-overview" },
              { label: "Document Vault", path: "/admin/dashboard/document-vault" },
              { label: "System Analytics", path: "/admin/dashboard/analytics" },
              { label: "Active Tasks", path: "/admin/dashboard/active-tasks" },
            ]}
          />
          <NavItem
            icon="ri-terminal-window-line"
            label="AI Command Center"
            subItems={[
              { label: "Command Input", path: "/admin/AI-Command/command-input" },
              { label: "Model Telemetry", path: "/admin/AI-Command/telemetry" },
            ]}
          />
          <NavItem
            icon="ri-user-3-line"
            label="User Directory"
            subItems={[
              { label: "Manage Records", path: "/admin/user-directory/manage-records" },
              { label: "Intern Applications", path: "/admin/user-directory/applications" },
            ]}
          />
          <NavItem
            icon="ri-file-list-3-line"
            label="System Logs"
            subItems={[
              {
                label: "Engine Performance",
                path: "/admin/system-logs/engine-performance",
              },
              { label: "Audit Trails", path: "/admin/system-logs/audit-trails" },
            ]}
          />

          <div className="my-4 border-t border-gray-800/60 mx-4"></div>

          <NavItem
            icon="ri-settings-3-line"
            label="Settings"
            subItems={[
              { label: "Profile Settings", path: "/admin/settings/profile-settings" },
              {
                label: "Database Configuration",
                path: "/admin/settings/database-config",
              },
              { label: "NLP Keyword Mapping", path: "/admin/settings/nlp-mapping" },
              { label: "System Backups", path: "/admin/settings/system-backups" },
            ]}
          />
          <NavItem
            icon="ri-lock-2-line"
            label="Security & Access"
            subItems={[
              { label: "Admin Management", path: "/admin/security/admin-management" },
              { label: "System Alerts", path: "/admin/security/system-alerts" },
            ]}
          />
          <NavItem
            icon="ri-lock-2-line"
            label="Document Layouts"
            subItems={[
              { label: "Certificate Templates", path: "/admin/doc-layouts/certificate-templates" },
              { label: "ID Card Templates", path: "/admin/doc-layouts/id-card-templates" },
            ]}
          />
        </nav>

        {/* User Footer - Now Clickable & Dynamic */}
        <div 
          onClick={() => navigate('/admin/settings/profile-settings')}
          className="p-4 border-t border-gray-800/60 flex items-center gap-3 hover:bg-white/[0.02] cursor-pointer transition-colors"
        >
          <img src={adminProfile.avatar} alt="Admin" className="w-9 h-9 rounded-full border border-gray-700 object-cover" />
          <div className="flex flex-col">
            <span className="text-sm font-semibold">{adminProfile.name}</span>
            <span className="text-[10px] text-gray-500">Account settings</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area - Outlet handles the dynamic page swapping */}
      <main className="flex-1 relative bg-[#07080a] overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
