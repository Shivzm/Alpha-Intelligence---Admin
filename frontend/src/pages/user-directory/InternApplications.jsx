import React, { useState } from "react";
import { useAdmin } from "../../context/AdminContext"; // Import the context hook!
import adminApi from "../../lib/adminApi";

export default function InternApplications() {
  // Pull both applications and records from our global context
  const { applications, setApplications } = useAdmin();
  const [selected, setSelected] = useState([]);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSelectAll = (e) => {
    if (e.target.checked) setSelected(applications.map(app => app.id));
    else setSelected([]);
  };

  const handleSelectOne = (e, id) => {
    if (e.target.checked) setSelected([...selected, id]);
    else setSelected(selected.filter(item => item !== id));
  };

  const handleAction = async (id, to) => {
    const reason = window.prompt(`Reason for marking this application ${to.toLowerCase()}:`);
    if (!reason?.trim()) return;
    setError("");
    setIsSaving(true);
    try {
      await adminApi.updateApplicationStatus(id, to, reason.trim());
      setApplications((current) => current.filter((application) => application.id !== id));
      setSelected((current) => current.filter((selectedId) => selectedId !== id));
    } catch (requestError) {
      setError(requestError.message || "Unable to update this application.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleBulkAction = async (to) => {
    const reason = window.prompt(`Reason for marking ${selected.length} applications ${to.toLowerCase()}:`);
    if (!reason?.trim()) return;
    setError("");
    setIsSaving(true);
    try {
      await adminApi.bulkUpdateApplicationStatus(selected, to, reason.trim());
      setApplications((current) => current.filter((application) => !selected.includes(application.id)));
      setSelected([]);
    } catch (requestError) {
      setError(requestError.message || "Unable to update the selected applications.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-full w-full p-8 overflow-y-auto">
      <div className="flex items-center gap-4 mb-2">
        <i className="ri-inbox-archive-line text-4xl text-secondary"></i>
        <h1 className="text-3xl font-semibold">Intern Applications</h1>
      </div>
      <p className="text-secondary text-sm mb-8">Review incoming applications and approve onboarding.</p>
      {error && <p role="alert" className="mb-4 rounded border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}

      {/* Toolbar */}
      <div className="flex justify-between items-center mb-6 h-10">
        <div className="relative w-80">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-secondary"></i>
          <input type="text" placeholder="Search..." className="w-full bg-transparent border border-divider rounded-lg py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-[#00e676] transition-colors" />
        </div>
        
        {selected.length > 0 && (
          <div className="flex items-center gap-3 animate-fade-in">
             <span className="text-sm text-[#00e676] mr-2">{selected.length} selected</span>
             <button 
               disabled={isSaving}
               onClick={() => handleBulkAction('Selected')}
               className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20 hover:border-emerald-500/50 px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2"
             >
               <i className="ri-check-double-line"></i> Bulk Select
             </button>
             <button 
               disabled={isSaving}
               onClick={() => handleBulkAction('Rejected')}
               className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 hover:border-red-500/50 px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2"
             >
               <i className="ri-delete-bin-line"></i> Bulk Reject
             </button>
          </div>
        )}
      </div>

      {/* Data Table */}
      <div className="border border-divider rounded-xl overflow-hidden bg-surface">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-divider text-xs text-secondary uppercase tracking-wider bg-white/[0.01]">
              <th className="px-6 py-4 w-12">
                <input type="checkbox" checked={selected.length === applications.length && applications.length > 0} onChange={handleSelectAll} className="accent-[#00e676] cursor-pointer w-4 h-4 rounded border-gray-700" />
              </th>
              <th className="px-6 py-4">App ID</th>
              <th className="px-6 py-4">Candidate Name</th>
              <th className="px-6 py-4">Applied Role</th>
              <th className="px-6 py-4">Date Applied</th>
              <th className="px-6 py-4 text-right">Review Action</th>
            </tr>
          </thead>
          <tbody className="text-sm text-gray-300">
            {applications.length === 0 ? (
              <tr><td colSpan="6" className="px-6 py-12 text-center text-secondary">No pending applications.</td></tr>
            ) : (
              applications.map((row) => (
                <tr key={row.id} className={`border-b border-divider/50 transition-colors ${selected.includes(row.id) ? 'bg-[#00e676]/5' : 'hover:bg-white/[0.02]'}`}>
                  <td className="px-6 py-4">
                    <input type="checkbox" checked={selected.includes(row.id)} onChange={(e) => handleSelectOne(e, row.id)} className="accent-[#00e676] cursor-pointer w-4 h-4 rounded border-gray-700" />
                  </td>
                  <td className="px-6 py-4 font-mono text-xs">{row.id}</td>
                  <td className="px-6 py-4 font-medium text-primary">{row.name}</td>
                  <td className="px-6 py-4 text-secondary">{row.role}</td>
                  <td className="px-6 py-4 text-secondary">{row.date}</td>
                  <td className="px-6 py-4 flex justify-end gap-2">
                    <button 
                      disabled={isSaving}
                      onClick={() => handleAction(row.id, 'Selected')}
                      className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20 hover:border-emerald-500/50 px-4 py-1.5 rounded-md text-xs transition-colors flex items-center gap-1"
                    >
                      <i></i> Select
                    </button>
                    <button 
                      disabled={isSaving}
                      onClick={() => handleAction(row.id, 'Rejected')}
                      className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 hover:border-red-500/50 px-4 py-1.5 rounded-md text-xs transition-colors flex items-center gap-1"
                    >
                      <i></i> Reject
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}