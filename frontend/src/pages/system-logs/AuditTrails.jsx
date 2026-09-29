import React, { useState } from "react";
import { useAdmin } from "../../context/AdminContext";
import adminApi from "../../lib/adminApi";

export default function AuditTrails() {
  const { auditLogs: logs } = useAdmin();
  const [search, setSearch] = useState("");
  const [source, setSource] = useState("");
  const [error, setError] = useState("");

  const filteredLogs = logs.filter((log) => {
    const text = [log.admin, log.actorId, log.action, log.target, log.entity, log.entityId].join(" ").toLowerCase();
    return text.includes(search.toLowerCase()) && (!source || log.source === source);
  });

  const handleExport = async () => {
    setError("");
    try {
      await adminApi.exportAuditLogs(source ? { source } : {});
    } catch (requestError) {
      setError(requestError.message || "Unable to download audit logs.");
    }
  };

  return (
    <div className="h-full w-full p-8 overflow-y-auto">
      <div className="flex items-center gap-4 mb-2">
        <i className="ri-history-line text-4xl text-secondary"></i>
        <h1 className="text-3xl font-semibold">Audit Trails</h1>
      </div>
      <p className="text-secondary text-sm mb-8">Monitor all administrative actions, system events, and security flags.</p>

      {/* Filters */}
      <div className="flex justify-between items-center mb-6 h-10">
        <div className="flex gap-4">
          <div className="relative w-64">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-secondary"></i>
            <input type="text" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search logs..." className="w-full bg-surface-hover border border-divider rounded-lg py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-[#00e676] transition-colors" />
          </div>
          <select value={source} onChange={(event) => setSource(event.target.value)} className="bg-surface-hover border border-divider rounded-lg py-2 px-4 text-sm text-secondary focus:outline-none focus:border-[#00e676]">
            <option value="">All Sources</option>
            <option value="ui">Admin UI</option>
            <option value="nl">AI command</option>
            <option value="user">User portal</option>
            <option value="system">System</option>
          </select>
        </div>
        <button type="button" onClick={handleExport} className="bg-[#1a1c26] border border-gray-700/50 text-gray-300 hover:text-primary px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2">
          <i className="ri-download-2-line"></i> Download CSV
        </button>
      </div>
      {error && <p role="alert" className="mb-4 rounded border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}

      {/* Log Table */}
      <div className="border border-divider rounded-xl overflow-hidden bg-surface">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-divider text-xs text-secondary uppercase tracking-wider bg-white/[0.01]">
              <th className="px-6 py-4 font-medium">Log ID</th>
              <th className="px-6 py-4 font-medium">Actor</th>
              <th className="px-6 py-4 font-medium">Action</th>
              <th className="px-6 py-4 font-medium">Target / Detail</th>
              <th className="px-6 py-4 font-medium">Timestamp</th>
              <th className="px-6 py-4 font-medium text-right">Status</th>
            </tr>
          </thead>
          <tbody className="text-sm text-gray-300">
            {filteredLogs.map((log) => (
              <tr key={log.id} className="border-b border-divider/50 hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-4 font-mono text-xs text-secondary">{log.id}</td>
                <td className="px-6 py-4 font-medium text-primary flex items-center gap-2">
                  <i className={(log.admin || "").includes('System') ? 'ri-cpu-line text-purple-400' : 'ri-user-smile-line text-blue-400'}></i>
                  {log.admin || log.actorId || "System"}
                </td>
                <td className="px-6 py-4">{log.action}</td>
                <td className="px-6 py-4 text-secondary">{log.target}</td>
                <td className="px-6 py-4 text-secondary">{log.time || log.at || log.createdAt || ""}</td>
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
            {filteredLogs.length === 0 && <tr><td colSpan="6" className="px-6 py-12 text-center text-secondary">No audit entries match these filters.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}