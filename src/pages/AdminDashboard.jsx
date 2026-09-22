import { useNavigate } from "react-router-dom";
import { useAdmin } from "../context/AdminContext";

// Premium Module Card (Fixed Height Independence)
function ModuleCard({ icon, title, description, path }) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(path)}
      className="group relative flex flex-col justify-center p-8 bg-[#0a0b10]/80 backdrop-blur-md border border-gray-800/50 rounded-[2rem] transition-all duration-500 hover:-translate-y-2 hover:bg-[#151722]/90 hover:shadow-[0_20px_40px_rgba(0,230,118,0.06)] hover:border-gray-700/80 cursor-pointer w-full aspect-square overflow-hidden"
    >
      {/* Premium Top Border Highlight */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-[#00e676] transition-all duration-500 group-hover:w-[60%] opacity-0 group-hover:opacity-100 shadow-[0_0_15px_#00e676]"></div>

      {/* Inner Content */}
      <div className="flex flex-col items-start gap-8 transition-all duration-500 group-hover:gap-5 w-full">
        {/* Icon */}
        <i
          className={`${icon} text-5xl text-gray-500 group-hover:text-[#00e676] transition-colors duration-500 font-light`}
        ></i>

        {/* Text Container */}
        <div className="flex flex-col text-left transition-all duration-500">
          <h3 className="text-xl md:text-2xl font-semibold text-white group-hover:text-[#00e676] transition-colors duration-500 mb-2">
            {title}
          </h3>
          <p className="text-sm text-gray-500 group-hover:text-[#00e676]/80 transition-colors duration-500 leading-relaxed">
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
    /* Main Background with Custom Linear Gradient and Grid Pattern */
    <div
      // Removed the solid bg-[#07080a] class so the gradient shows through
      className="min-h-screen w-full flex flex-col items-center pt-24 pb-12 px-4 font-sans relative overflow-hidden"
      style={{
        backgroundImage: `
          linear-gradient(to right, rgba(255, 255, 255, 0.015) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(255, 255, 255, 0.015) 1px, transparent 1px),
          linear-gradient(to bottom, #131926 0%, #05070A 100%)
        `,
        // The first two sizes (40px) apply to the grid, the last (100%) ensures the gradient fills the screen
        backgroundSize: "40px 40px, 40px 40px, 100% 100%",
      }}
    >
      {/* Permanent White Ambient Light Behind the Grid */}
      <div className="absolute top-[55%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] max-w-[800px] aspect-square bg-white/[0.04] blur-[146px] rounded-full pointer-events-none z-0"></div>

      {/* Header Section */}
      <div className="flex flex-col items-center mb-16 relative z-10 text-center">
        {/* Profile Image with subtle green glow behind it */}
        <div className="relative mb-6">
          {/* Keep the glow effect */}
          <div className="absolute inset-0 bg-[#00e676] blur-2xl opacity-10 rounded-full"></div>

          {/* Only update the image source here */}
          <img
            src={adminProfile.avatar}
            alt="Admin Profile"
            className="w-20 h-20 rounded-full border border-gray-700/50 relative z-10 object-cover shadow-2xl"
          />
        </div>

        <h1 className="text-4xl md:text-5xl text-white font-bold tracking-wide mb-3">
          Welcome back, Admin
        </h1>
        <p className="text-gray-500 text-sm md:text-base">
          Select a management module to begin administrative operations.
        </p>
      </div>

      {/* 
        Grid of Modules 
        Uses lg:grid-cols-3 to create a 3x3 layout. 
        With 5 cards, the second row will center elegantly if needed, 
        or flow naturally left-to-right depending on the screen size.
      */}
      {/* Inside AdminDashboard component */}
      <div className="w-full max-w-4xl z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
        <ModuleCard
          icon="ri-dashboard-line"
          title="Dashboard"
          description="View overarching system metrics and health."
          path="/admin/dashboard/main-overview" // Added path
        />

        <ModuleCard
          icon="ri-terminal-window-line"
          title="AI Command Center"
          description="Execute NLP text commands."
          path="/admin/ai-command/command-input" // Added path
        />

        <ModuleCard
          icon="ri-folder-2-line"
          title="System Logs"
          description="Monitor intent detection accuracy."
          path="/admin/system-logs/engine-performance" // Added path
        />

        <ModuleCard
          icon="ri-user-3-line"
          title="User Directory"
          description="Manage student and intern records."
          path="/admin/user-directory/manage-records" // Added path
        />

        <ModuleCard
          icon="ri-settings-4-line"
          title="Settings"
          description="Check more settings."
          path="/admin/settings/profile-settings" // Added path
        />
      </div>
    </div>
  );
}
