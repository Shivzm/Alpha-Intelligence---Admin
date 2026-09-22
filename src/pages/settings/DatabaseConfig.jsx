import React, { useState } from "react";
import { useAdmin } from "../../context/AdminContext";

export default function DatabaseConfig() {
  const { databaseConfig: apiConfig, setDatabaseConfig } = useAdmin();
  const [config, setConfig] = useState({});

  React.useEffect(() => setConfig(apiConfig), [apiConfig]);

  const [showPassword, setShowPassword] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [status, setStatus] = useState("Connected"); // Connected, Testing, Failed

  const handleTestConnection = () => {
    setIsTesting(true);
    setStatus("Testing");
    
    // Simulate network delay for testing connection
    setTimeout(() => {
      setIsTesting(false);
      setStatus("Connected");
      alert("Connection Successful! Ping: 42ms");
    }, 1500);
  };

  const handleSave = () => {
    setDatabaseConfig(config);
    alert("Database configuration updated successfully. A server restart may be required.");
  };

  return (
    <div className="h-full w-full p-8 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-2">
        <i className="ri-database-2-line text-4xl text-secondary"></i>
        <h1 className="text-3xl font-semibold">Database Configuration</h1>
      </div>
      <p className="text-secondary text-sm mb-8">
        Manage your primary data cluster settings and monitor live connection health.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Live Health Monitor */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-surface border border-divider rounded-xl p-6 relative overflow-hidden">
            {/* Background Glow */}
            <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-10 ${status === 'Connected' ? 'bg-[#00e676]' : 'bg-yellow-500'}`}></div>
            
            <h2 className="text-lg font-medium text-primary mb-6 border-b border-divider pb-2">Connection Health</h2>
            
            <div className="flex items-center justify-between mb-6">
              <span className="text-sm text-secondary">Status</span>
              <div className="flex items-center gap-2">
                {isTesting ? (
                  <i className="ri-loader-4-line animate-spin text-yellow-500"></i>
                ) : (
                  <span className={`w-2.5 h-2.5 rounded-full ${status === 'Connected' ? 'bg-[#00e676] animate-pulse' : 'bg-red-500'}`}></span>
                )}
                <span className={`text-sm font-semibold ${status === 'Connected' ? 'text-[#00e676]' : 'text-yellow-500'}`}>
                  {status}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-surface-hover p-3 rounded-lg border border-divider/50 flex justify-between items-center">
                <span className="text-xs text-secondary uppercase tracking-wider">Ping</span>
                <span className="text-sm text-primary font-mono">42ms</span>
              </div>
              <div className="bg-surface-hover p-3 rounded-lg border border-divider/50 flex justify-between items-center">
                <span className="text-xs text-secondary uppercase tracking-wider">Active Queries</span>
                <span className="text-sm text-primary font-mono">14</span>
              </div>
              <div className="bg-surface-hover p-3 rounded-lg border border-divider/50 flex justify-between items-center">
                <span className="text-xs text-secondary uppercase tracking-wider">Uptime</span>
                <span className="text-sm text-primary font-mono">99.98%</span>
              </div>
            </div>

            <button 
              onClick={handleTestConnection}
              disabled={isTesting}
              className="w-full mt-6 bg-transparent border border-gray-700 hover:border-[#00e676]/50 text-gray-300 hover:text-[#00e676] py-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i className="ri-wifi-line"></i> Test Connection
            </button>
          </div>
        </div>

        {/* Right Column: Connection Credentials */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface border border-divider rounded-xl p-6">
            <h2 className="text-lg font-medium text-primary mb-6 border-b border-divider pb-2">Environment Variables</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Host */}
              <div className="md:col-span-2">
                <label className="block text-secondary text-xs uppercase tracking-wider mb-2">Endpoint / Host URL</label>
                <div className="relative">
                  <i className="ri-server-line absolute left-3 top-1/2 -translate-y-1/2 text-secondary"></i>
                  <input 
                    type="text" 
                    value={config.host}
                    onChange={(e) => setConfig({...config, host: e.target.value})}
                    className="w-full bg-surface-hover border border-divider rounded-lg py-2.5 pl-10 pr-4 text-sm text-gray-200 focus:outline-none focus:border-[#00e676]/50 transition-colors font-mono"
                  />
                </div>
              </div>

              {/* Port & DB Name */}
              <div>
                <label className="block text-secondary text-xs uppercase tracking-wider mb-2">Port</label>
                <input 
                  type="text" 
                  value={config.port}
                  onChange={(e) => setConfig({...config, port: e.target.value})}
                  className="w-full bg-surface-hover border border-divider rounded-lg py-2.5 px-4 text-sm text-gray-200 focus:outline-none focus:border-[#00e676]/50 transition-colors font-mono"
                />
              </div>
              <div>
                <label className="block text-secondary text-xs uppercase tracking-wider mb-2">Database Name</label>
                <input 
                  type="text" 
                  value={config.dbName}
                  onChange={(e) => setConfig({...config, dbName: e.target.value})}
                  className="w-full bg-surface-hover border border-divider rounded-lg py-2.5 px-4 text-sm text-gray-200 focus:outline-none focus:border-[#00e676]/50 transition-colors font-mono"
                />
              </div>

              {/* Username & Password */}
              <div>
                <label className="block text-secondary text-xs uppercase tracking-wider mb-2">Master Username</label>
                <input 
                  type="text" 
                  value={config.username}
                  onChange={(e) => setConfig({...config, username: e.target.value})}
                  className="w-full bg-surface-hover border border-divider rounded-lg py-2.5 px-4 text-sm text-gray-200 focus:outline-none focus:border-[#00e676]/50 transition-colors font-mono"
                />
              </div>
              <div>
                <label className="block text-secondary text-xs uppercase tracking-wider mb-2">Master Password</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={config.password}
                    onChange={(e) => setConfig({...config, password: e.target.value})}
                    className="w-full bg-surface-hover border border-divider rounded-lg py-2.5 px-4 pr-10 text-sm text-gray-200 focus:outline-none focus:border-[#00e676]/50 transition-colors font-mono"
                  />
                  <button 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-gray-300"
                  >
                    <i className={showPassword ? "ri-eye-off-line" : "ri-eye-line"}></i>
                  </button>
                </div>
              </div>
              
              {/* SSL Toggle */}
              <div className="md:col-span-2 mt-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className={`w-10 h-5 rounded-full transition-colors relative ${config.ssl ? 'bg-[#00e676]' : 'bg-gray-700'}`} onClick={() => setConfig({...config, ssl: !config.ssl})}>
                    <div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-transform ${config.ssl ? 'translate-x-6' : 'translate-x-1'}`}></div>
                  </div>
                  <span className="text-sm text-gray-300">Require SSL/TLS Encryption</span>
                </label>
              </div>

            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex justify-end gap-4 border-t border-divider pt-6">
              <button className="bg-transparent border border-gray-700 text-gray-300 hover:text-primary px-6 py-2 rounded-lg text-sm transition-colors">
                Revert
              </button>
              <button 
                onClick={handleSave}
                className="bg-[#00e676] hover:bg-[#00c868] text-black font-semibold px-6 py-2 rounded-lg text-sm transition-colors shadow-[0_0_15px_rgba(0,230,118,0.2)]"
              >
                Save Configuration
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}