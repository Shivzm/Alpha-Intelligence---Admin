import { useNavigate } from "react-router-dom";
import { useAdmin } from "../context/AdminContext";
import ThemeToggle from "../components/ThemeToggle";

// Premium Module Card (Updated with Semantic Theme Variables)
function ModuleCard({ icon, title, description, path }) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(path)}
      className="group relative flex flex-col justify-center p-8 bg-surface/80 backdrop-blur-md border border-card-border rounded-[2rem] transition-all duration-500 hover:-translate-y-2 hover:bg-surface-hover hover:shadow-[0_20px_40px_rgba(0,230,118,0.06)] hover:border-brand/50 cursor-pointer w-full aspect-square overflow-hidden"
    >
      {/* Premium Top Border Highlight */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-brand transition-all duration-500 group-hover:w-[60%] opacity-0 group-hover:opacity-100 shadow-[0_0_15px_var(--color-brand)]"></div>

      {/* Inner Content */}
      <div className="flex flex-col items-start gap-8 transition-all duration-500 group-hover:gap-5 w-full">
        {/* Icon */}
        <i
          className={`${icon} text-5xl text-secondary group-hover:text-brand transition-colors duration-500 font-light`}
        ></i>

        {/* Text Container */}
        <div className="flex flex-col text-left transition-all duration-500">
          <h3 className="text-xl md:text-2xl font-semibold text-primary group-hover:text-brand transition-colors duration-500 mb-2">
            {title}
          </h3>
          <p className="text-sm text-secondary group-hover:text-brand/80 transition-colors duration-500 leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { adminProfile } = useAdmin();

  return (
    <div className="min-h-screen w-full flex flex-col items-center pt-24 pb-12 px-4 font-sans relative overflow-hidden bg-base transition-colors duration-300">
      
      {/* Background Grid Pattern (Uses current theme text color with low opacity for the grid lines) */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
        style={{
          backgroundImage: `
            linear-gradient(to right, currentColor 1px, transparent 1px),
            linear-gradient(to bottom, currentColor 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      ></div>

      {/* Permanent Ambient Light Behind the Grid */}
      <div className="absolute top-[55%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] max-w-[800px] aspect-square bg-brand/[0.04] blur-[146px] rounded-full pointer-events-none z-0"></div>

      {/* 
        NEW HEADER SECTION 
        Aligned with the grid max-width, featuring the Icon-Only ThemeToggle
      */}
      <div className="w-full max-w-4xl z-10 px-4 mb-12 flex items-center justify-between">
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="absolute inset-0 bg-brand blur-xl opacity-20 rounded-full"></div>
            <img
              src={adminProfile.avatar}
              alt="Admin Profile"
              className="w-14 h-14 rounded-full border border-divider relative z-10 object-cover shadow-lg"
            />
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-primary mb-1">Welcome back, Admin</h1>
            <p className="text-secondary text-sm">Select any of the below cards to inspect the system.</p>
          </div>
        </div>
        
        {/* Sleek icon-only toggle on the right */}
        <ThemeToggle iconOnly={true} />
      </div>

      {/* Grid of Modules */}
      <div className="w-full max-w-4xl z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
        <ModuleCard
          icon="ri-dashboard-line"
          title="Dashboard"
          description="View overarching system metrics and health."
          path="/admin/dashboard/main-overview" 
        />

        <ModuleCard
          icon="ri-terminal-window-line"
          title="AI Command Center"
          description="Execute NLP text commands."
          path="/admin/AI-Command/command-input" 
        />

        <ModuleCard
          icon="ri-folder-2-line"
          title="System Logs"
          description="Monitor intent detection accuracy."
          path="/admin/system-logs/engine-performance" 
        />

        <ModuleCard
          icon="ri-user-3-line"
          title="User Directory"
          description="Manage student and intern records."
          path="/admin/user-directory/manage-records" 
        />

        <ModuleCard
          icon="ri-settings-4-line"
          title="Settings"
          description="Configure system parameters and profile."
          path="/admin/settings/profile-settings" 
        />
      </div>
    </div>
  );
}