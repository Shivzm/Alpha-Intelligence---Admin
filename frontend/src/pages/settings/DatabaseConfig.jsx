import React, { useState } from "react";
import adminApi from "../../lib/adminApi";

export default function DatabaseConfig() {
  const [config, setConfig] = useState({});
  const [isTesting, setIsTesting] = useState(false);
  const [status, setStatus] = useState("Checking");
  const [error, setError] = useState("");

  React.useEffect(() => {
    let active = true;
    adminApi.getDatabaseSettings()
      .then((result) => {
        if (!active) return;
        setConfig(result.data);
        setStatus(result.data.status === "connected" ? "Connected" : "Unavailable");
      })
      .catch((requestError) => {
        if (!active) return;
        setStatus("Unavailable");
        setError(requestError.message || "Unable to read database configuration.");
      });
    return () => { active = false; };
  }, []);

  const handleTestConnection = async () => {
    setIsTesting(true);
    setStatus("Testing");
    setError("");
    try {
      const result = await adminApi.testDatabaseConnection();
      setConfig(result.data);
      setStatus("Connected");
    } catch (requestError) {
      setStatus("Unavailable");
      setError(requestError.message || "Database connection test failed.");
    } finally {
      setIsTesting(false);
    }
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
      {error && <p role="alert" className="mb-4 rounded border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}

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
                    value={config.provider || "Cloud Firestore"}
                    readOnly
                    className="w-full bg-surface-hover border border-divider rounded-lg py-2.5 pl-10 pr-4 text-sm text-gray-200 focus:outline-none focus:border-[#00e676]/50 transition-colors font-mono"
                  />
                </div>
              </div>

              {/* Port & DB Name */}
              <div>
                <label className="block text-secondary text-xs uppercase tracking-wider mb-2">Port</label>
                  <input
                    type="text"
                    value={config.projectId || "Managed by deployment configuration"}
                    readOnly
                  className="w-full bg-surface-hover border border-divider rounded-lg py-2.5 px-4 text-sm text-gray-200 focus:outline-none focus:border-[#00e676]/50 transition-colors font-mono"
                />
              </div>
              <div>
                <label className="block text-secondary text-xs uppercase tracking-wider mb-2">Database Name</label>
                  <input
                    type="text"
                    value={config.status || status}
                    readOnly
                  className="w-full bg-surface-hover border border-divider rounded-lg py-2.5 px-4 text-sm text-gray-200 focus:outline-none focus:border-[#00e676]/50 transition-colors font-mono"
                />
              </div>

              <div className="md:col-span-2 rounded border border-divider bg-surface-hover p-4 text-sm text-secondary">
                Firebase service-account credentials are server-side secrets. Manage them in the backend Vercel project environment; they are never displayed or editable here.
              </div>
              
              <div className="md:col-span-2 mt-2">
                <span className="text-xs text-secondary">Credentials configured: {config.credentialsConfigured ? "Yes" : "No"}</span>
              </div>

            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex justify-end border-t border-divider pt-6">
              <span className="text-xs text-secondary">Connection settings are managed through backend environment variables.</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}