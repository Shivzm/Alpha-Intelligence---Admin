import React from 'react';

// Reusable component for the dashboard modules
function ModuleCard({ icon, title, description }) {
  return (
    <div className="group flex items-center p-8 bg-[#111216]/80 backdrop-blur-sm border border-gray-800/50 rounded-3xl transition-all duration-300 hover:border-[#00e676] cursor-pointer w-full h-[140px] shadow-lg">
      
      {/* 
        This container controls the "coming close" effect. 
        It starts with gap-8 and shrinks to gap-5 on hover.
      */}
      <div className="flex items-center gap-8 transition-all duration-300 group-hover:gap-5 w-full">
        
        {/* Icon */}
        <i className={`${icon} text-4xl text-gray-400 group-hover:text-[#00e676] transition-colors duration-300 font-light`}></i>
        
        {/* Text Container */}
        <div className="flex flex-col text-left transition-all duration-300">
          <h3 className="text-xl font-semibold text-white group-hover:text-[#00e676] transition-colors duration-300">
            {title}
          </h3>
          <p className="text-sm text-gray-500 group-hover:text-[#00e676]/80 transition-colors duration-300 leading-snug mt-1">
            {description}
          </p>
        </div>
        
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    /* Main Background with Dark Theme and Custom Grid Pattern */
    <div 
      className="min-h-screen w-full bg-[#0a0b10] flex flex-col items-center pt-24 pb-12 px-4 font-sans relative overflow-hidden"
      style={{
        backgroundImage: `
          linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px'
      }}
    >
      
      {/* Header Section */}
      <div className="flex flex-col items-center mb-16 relative z-10 text-center">
        
        {/* Profile Image with subtle green glow behind it */}
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-[#00e676] blur-2xl opacity-20 rounded-full"></div>
          <img 
            src="https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" 
            alt="Admin Profile" 
            className="w-20 h-20 rounded-full border-2 border-gray-700/50 relative z-10 object-cover shadow-2xl"
          />
        </div>

        <h1 className="text-4xl md:text-5xl text-white font-bold tracking-wide mb-3">
          Welcome back, Admin
        </h1>
        <p className="text-gray-400 text-sm md:text-base">
          Select a management module to begin administrative operations.
        </p>
      </div>

      {/* Grid of Modules */}
      {/* Using an asymmetrical grid layout to accommodate the 5th "Dashboard" card elegantly */}
      <div className="w-full max-w-5xl z-10 grid grid-cols-1 md:grid-cols-2 gap-6 px-4">
        
        <ModuleCard 
          icon="ri-dashboard-line" 
          title="Dashboard" 
          description="View overarching system metrics and health." 
        />
        
        <ModuleCard 
          icon="ri-terminal-window-line" 
          title="AI Command Center" 
          description="Execute NLP text commands." 
        />
        
        {/* Formerly Document Vault -> Now Main Overview */}
        <ModuleCard 
          icon="ri-folder-2-line" 
          title="Main Overview" 
          description="Access generated certificates and ID cards." 
        />
        
        <ModuleCard 
          icon="ri-user-3-line" 
          title="User Directory" 
          description="Manage student and intern records." 
        />
        
        <ModuleCard 
          icon="ri-settings-4-line" 
          title="System Logs" 
          description="Monitor intent detection accuracy." 
        />

      </div>
    </div>
  );
}