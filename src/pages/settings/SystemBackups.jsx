import React, { useState } from "react";

export default function SystemBackups() {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const [backups, setBackups] = useState([
    { id: "BAK-1092", date: "2026-09-21 03:00 AM", size: "1.2 GB", type: "Automated", status: "Verified" },
    { id: "BAK-1091", date: "2026-09-20 03:00 AM", size: "1.2 GB", type: "Automated", status: "Verified" },
    { id: "BAK-1090", date: "2026-09-19 14:30 PM", size: "1.1 GB", type: "Manual", status: "Verified" },
    { id: "BAK-1089", date: "2026-09-18 03:00 AM", size: "1.1 GB", type: "Automated", status: "Verified" },
  ]);

  const handleManualBackup = () => {
    setIsBackingUp(true);
    setProgress(0);
    
    // Simulate backup progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsBackingUp(false);
          // Add new backup to the top of the list
          setBackups([{
            id: `BAK-${Math.floor(Math.random() * 900) + 1000}`,
            date: new Date().toLocaleString(),
            size: "1.2 GB",
            type: "Manual",
            status: "Verified"
          }, ...backups]);
          return 0;
        }
        return prev + 10;
      });
    }, 300);
  };

  return (
    <div className="h-full w-full p-8 overflow-y-auto">
      <div className="flex items-center gap-4 mb-2">
        <i className="ri-hard-drive-3-line text-4xl text-gray-400"></i>
        <h1 className="text-3xl font-semibold">System Backups</h1>
      </div>
      <p className="text-gray-500 text-sm mb-8">
        Manage automated data snapshots and create manual restore points.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        
        {/* Backup Status Card */}
        <div className="bg-[#0c0d12] border border-gray-800/80 rounded-xl p-6 lg:col-span-1">
          <h2 className="text-lg font-medium text-white mb-6 border-b border-gray-800 pb-2">Status overview</h2>
          
          <div className="mb-6">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Next Automated Backup</p>
            <p className="text-sm font-medium text-white flex items-center gap-2">
              <i className="ri-time-line text-[#00e676]"></i> Tomorrow, 03:00 AM
            </p>
          </div>

          <div className="mb-8">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Storage Used</p>
            <div className="flex items-end gap-2 mb-2">
              <span className="text-3xl font-bold text-white">45.6</span>
              <span className="text-gray-500 mb-1">GB / 100 GB</span>
            </div>
            <div className="w-full bg-gray-800/50 rounded-full h-1.5">
              <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '45.6%' }}></div>
            </div>
          </div>

          <button 
            onClick={handleManualBackup}
            disabled={isBackingUp}
            className="w-full bg-[#00e676] hover:bg-[#00c868] text-black font-semibold py-3 rounded-lg text-sm transition-colors shadow-[0_0_15px_rgba(0,230,118,0.2)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isBackingUp ? (
              <>
                <i className="ri-loader-4-line animate-spin"></i> Creating Backup ({progress}%)
              </>
            ) : (
              <>
                <i className="ri-save-3-line"></i> Create Manual Backup
              </>
            )}
          </button>
        </div>

        {/* History Table */}
        <div className="bg-[#0c0d12] border border-gray-800/80 rounded-xl overflow-hidden lg:col-span-2 flex flex-col">
          <div className="p-6 border-b border-gray-800 flex justify-between items-center">
            <h2 className="text-lg font-medium text-white">Restore Points</h2>
            <button className="text-sm text-[#00e676] hover:text-white transition-colors flex items-center gap-1">
              <i className="ri-settings-3-line"></i> Configure Schedule
            </button>
          </div>
          
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wider bg-white/[0.01]">
                <th className="px-6 py-4 font-medium">Backup ID</th>
                <th className="px-6 py-4 font-medium">Timestamp</th>
                <th className="px-6 py-4 font-medium">Type</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-300">
              {backups.map((row, idx) => (
                <tr key={idx} className="border-b border-gray-800/50 hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-gray-400">{row.id}</td>
                  <td className="px-6 py-4">{row.date}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-[10px] uppercase tracking-wider font-semibold ${row.type === 'Automated' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'}`}>
                      {row.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 flex justify-end gap-2">
                    <button className="bg-[#1a1c26] hover:bg-[#252836] border border-gray-700/50 text-gray-300 px-3 py-1.5 rounded-md text-xs transition-colors flex items-center gap-1" title="Download Archive">
                      <i className="ri-download-line"></i>
                    </button>
                    <button className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 hover:border-red-500/50 px-3 py-1.5 rounded-md text-xs transition-colors flex items-center gap-1" title="Restore Data">
                      <i className="ri-history-line"></i> Restore
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}