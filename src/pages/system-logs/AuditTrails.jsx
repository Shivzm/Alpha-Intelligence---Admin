import React, { useState } from "react";

export default function AuditTrails() {
  const [logs] = useState([
    { id: "LOG-8842", admin: "Admin (You)", action: "Generated ID Card", target: "USR-001 (Alex Chen)", time: "Just now", status: "Success" },
    { id: "LOG-8841", admin: "Admin (You)", action: "Approved Application", target: "APP-1042", time: "2 mins ago", status: "Success" },
    { id: "LOG-8840", admin: "System AI", action: "Auto-Revoked Credential", target: "DOC-9921", time: "1 hour ago", status: "Warning" },
    { id: "LOG-8839", admin: "Sarah L.", action: "Updated Role", target: "Admin Settings", time: "3 hours ago", status: "Success" },
    { id: "LOG-8838", admin: "System", action: "Failed Login Attempt", target: "IP: 192.168.1.45", time: "5 hours ago", status: "Danger" },
  ]);

  return (
    <div className="h-full w-full p-8 overflow-y-auto">
      <div className="flex items-center gap-4 mb-2">
        <i className="ri-history-line text-4xl text-gray-400"></i>
        <h1 className="text-3xl font-semibold">Audit Trails</h1>
      </div>
      <p className="text-gray-500 text-sm mb-8">Monitor all administrative actions, system events, and security flags.</p>

      {/* Filters */}
      <div className="flex justify-between items-center mb-6 h-10">
        <div className="flex gap-4">
          <div className="relative w-64">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"></i>
            <input type="text" placeholder="Search logs..." className="w-full bg-[#13151c] border border-gray-800 rounded-lg py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-[#00e676] transition-colors" />
          </div>
          <select className="bg-[#13151c] border border-gray-800 rounded-lg py-2 px-4 text-sm text-gray-400 focus:outline-none focus:border-[#00e676]">
            <option>All Events</option>
            <option>User Actions</option>
            <option>AI Executions</option>
            <option>Security Alerts</option>
          </select>
        </div>
        <button className="bg-[#1a1c26] border border-gray-700/50 text-gray-300 hover:text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2">
          <i className="ri-download-2-line"></i> Download CSV
        </button>
      </div>

      {/* Log Table */}
      <div className="border border-gray-800/80 rounded-xl overflow-hidden bg-[#0c0d12]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wider bg-white/[0.01]">
              <th className="px-6 py-4 font-medium">Log ID</th>
              <th className="px-6 py-4 font-medium">Actor</th>
              <th className="px-6 py-4 font-medium">Action</th>
              <th className="px-6 py-4 font-medium">Target / Detail</th>
              <th className="px-6 py-4 font-medium">Timestamp</th>
              <th className="px-6 py-4 font-medium text-right">Status</th>
            </tr>
          </thead>
          <tbody className="text-sm text-gray-300">
            {logs.map((log, idx) => (
              <tr key={idx} className="border-b border-gray-800/50 hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-4 font-mono text-xs text-gray-500">{log.id}</td>
                <td className="px-6 py-4 font-medium text-white flex items-center gap-2">
                  <i className={log.admin.includes('System') ? 'ri-cpu-line text-purple-400' : 'ri-user-smile-line text-blue-400'}></i>
                  {log.admin}
                </td>
                <td className="px-6 py-4">{log.action}</td>
                <td className="px-6 py-4 text-gray-400">{log.target}</td>
                <td className="px-6 py-4 text-gray-500">{log.time}</td>
                <td className="px-6 py-4 flex justify-end">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-semibold 
                    ${log.status === 'Success' ? 'bg-[#00e676]/10 text-[#00e676]' : 
                      log.status === 'Warning' ? 'bg-yellow-500/10 text-yellow-500' : 
                      'bg-red-500/10 text-red-500'}`}>
                    {log.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}