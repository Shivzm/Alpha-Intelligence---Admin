import React, { useState } from "react";
import { useAdmin } from "../../context/AdminContext";
import adminApi from "../../lib/adminApi";

export default function DocumentVault() {
  const { documents, setDocuments } = useAdmin();
  const [selected, setSelected] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSelectAll = (e) => {
    if (e.target.checked) setSelected(documents.map(doc => doc.id));
    else setSelected([]);
  };

  const handleSelectOne = (e, id) => {
    if (e.target.checked) setSelected([...selected, id]);
    else setSelected(selected.filter(item => item !== id));
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Revoke ${selected.length} selected documents?`)) return;
    setError("");
    setBusy(true);
    const results = await Promise.allSettled(selected.map((id) => adminApi.revokeDocument(id)));
    const succeeded = selected.filter((_, index) => results[index].status === "fulfilled");
    const failed = selected.length - succeeded.length;
    setDocuments((current) => current.map((document) => succeeded.includes(document.id)
      ? { ...document, revokedAt: new Date().toISOString() }
      : document));
    setSelected((current) => current.filter((id) => !succeeded.includes(id)));
    if (failed) setError(`Could not revoke ${failed} document${failed === 1 ? "" : "s"}.`);
    setBusy(false);
  };

  const handleDownload = async (id) => {
    setError("");
    try {
      const result = await adminApi.downloadDocument(id);
      window.open(result.data.url, "_blank", "noopener,noreferrer");
    } catch (requestError) {
      setError(requestError.message || "Unable to create a document download link.");
    }
  };

  return (
    <div className="h-full w-full p-8 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-2">
        <i className="ri-folder-2-line text-4xl text-secondary"></i>
        <h1 className="text-3xl font-semibold">Document Vault</h1>
      </div>
      <p className="text-secondary text-sm mb-8">View, verify, and export generated credentials.</p>
      {error && <p role="alert" className="mb-4 rounded border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}

      {/* Toolbar */}
      <div className="flex justify-between items-center mb-6 h-10">
        <div className="relative w-80">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-secondary"></i>
          <input type="text" placeholder="Search..." className="w-full bg-transparent border border-divider rounded-lg py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-[#00e676] transition-colors" />
        </div>
        
        {/* Conditional Bulk Actions */}
        {selected.length > 0 ? (
          <div className="flex items-center gap-3 animate-fade-in">
             <span className="text-sm text-red-500 mr-2">{selected.length} selected</span>
             <button 
               onClick={handleBulkDelete}
               disabled={busy}
               className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 hover:border-red-500/50 px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2"
             >
               <i className="ri-delete-bin-line"></i> Revoke
             </button>
          </div>
        ) : (
          <span className="text-xs text-secondary">{documents.length} loaded</span>
        )}
      </div>

      {/* Data Table */}
      <div className="border border-divider rounded-xl overflow-hidden bg-surface">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-divider text-xs text-secondary uppercase tracking-wider bg-white/[0.01]">
              <th className="px-6 py-4 w-12">
                <input 
                  type="checkbox" 
                  checked={selected.length === documents.length && documents.length > 0} 
                  onChange={handleSelectAll} 
                  className="accent-[#00e676] cursor-pointer w-4 h-4 rounded border-gray-700" 
                />
              </th>
              <th className="px-6 py-4 font-medium">Document ID</th>
              <th className="px-6 py-4 font-medium">Student Name</th>
              <th className="px-6 py-4 font-medium">Type</th>
              <th className="px-6 py-4 font-medium">Date Generated</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm text-gray-300">
            {documents.map((row) => (
              <tr key={row.id} className={`border-b border-divider/50 transition-colors ${selected.includes(row.id) ? 'bg-[#00e676]/5' : 'hover:bg-white/[0.02]'}`}>
                <td className="px-6 py-4">
                  <input 
                    type="checkbox" 
                    checked={selected.includes(row.id)} 
                    onChange={(e) => handleSelectOne(e, row.id)} 
                    className="accent-[#00e676] cursor-pointer w-4 h-4 rounded border-gray-700" 
                  />
                </td>
                <td className="px-6 py-4 font-mono text-xs text-secondary">{row.id}</td>
                <td className="px-6 py-4 font-medium text-primary">{row.name}</td>
                
                {/* The re-added icons for document types */}
                <td className="px-6 py-4 flex items-center gap-2">
                  <i className={row.type === 'ID Card' ? 'ri-id-card-fill text-blue-400 text-lg' : 'ri-file-paper-2-fill text-yellow-400 text-lg'}></i>
                  {row.type}
                </td>
                
                <td className="px-6 py-4 text-secondary">{row.date}</td>
                <td className="px-6 py-4 text-right">
                  <button type="button" disabled={busy || row.revokedAt} onClick={() => handleDownload(row.id)} className="rounded border border-divider px-3 py-1.5 text-xs text-secondary hover:text-primary disabled:opacity-50" title="Download document">
                    <i className="ri-download-line"></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}