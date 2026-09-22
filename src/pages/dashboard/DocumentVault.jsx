import React, { useState } from "react";

export default function DocumentVault() {
  const [documents, setDocuments] = useState([
    { id: "DOC-9921", name: "Alex Chen", type: "ID Card", date: "2026-09-22" },
    { id: "DOC-9922", name: "Sarah Jenkins", type: "Certificate", date: "2026-09-21" },
    { id: "DOC-9923", name: "Marcus Rossi", type: "ID Card", date: "2026-09-20" },
    { id: "DOC-9924", name: "Priya Patel", type: "Certificate", date: "2026-09-19" },
  ]);

  const [selected, setSelected] = useState([]);

  const handleSelectAll = (e) => {
    if (e.target.checked) setSelected(documents.map(doc => doc.id));
    else setSelected([]);
  };

  const handleSelectOne = (e, id) => {
    if (e.target.checked) setSelected([...selected, id]);
    else setSelected(selected.filter(item => item !== id));
  };

  const handleBulkDelete = () => {
    const confirmDelete = window.confirm(`Permanently revoke ${selected.length} documents?`);
    if (confirmDelete) {
      setDocuments(documents.filter(doc => !selected.includes(doc.id)));
      setSelected([]);
    }
  };

  return (
    <div className="h-full w-full p-8 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-2">
        <i className="ri-folder-2-line text-4xl text-gray-400"></i>
        <h1 className="text-3xl font-semibold">Document Vault</h1>
      </div>
      <p className="text-gray-500 text-sm mb-8">View, verify, and export generated credentials.</p>

      {/* Toolbar */}
      <div className="flex justify-between items-center mb-6 h-10">
        <div className="relative w-80">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"></i>
          <input type="text" placeholder="Search..." className="w-full bg-transparent border border-gray-800 rounded-lg py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-[#00e676] transition-colors" />
        </div>
        
        {/* Conditional Bulk Actions */}
        {selected.length > 0 ? (
          <div className="flex items-center gap-3 animate-fade-in">
             <span className="text-sm text-red-500 mr-2">{selected.length} selected</span>
             <button 
               onClick={handleBulkDelete}
               className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 hover:border-red-500/50 px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2"
             >
               <i className="ri-delete-bin-line"></i> Revoke
             </button>
             <button className="bg-[#00e676] text-black px-4 py-2 rounded-lg text-sm flex items-center gap-2 font-semibold">
               <i className="ri-download-cloud-2-line"></i> Export
             </button>
          </div>
        ) : (
          <button className="bg-[#00e676] hover:bg-[#00c868] text-black font-semibold px-6 py-2 rounded-lg text-sm shadow-[0_0_15px_rgba(0,230,118,0.3)] transition-all">
            Export All
          </button>
        )}
      </div>

      {/* Data Table */}
      <div className="border border-gray-800/80 rounded-xl overflow-hidden bg-[#0c0d12]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wider bg-white/[0.01]">
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
            </tr>
          </thead>
          <tbody className="text-sm text-gray-300">
            {documents.map((row) => (
              <tr key={row.id} className={`border-b border-gray-800/50 transition-colors ${selected.includes(row.id) ? 'bg-[#00e676]/5' : 'hover:bg-white/[0.02]'}`}>
                <td className="px-6 py-4">
                  <input 
                    type="checkbox" 
                    checked={selected.includes(row.id)} 
                    onChange={(e) => handleSelectOne(e, row.id)} 
                    className="accent-[#00e676] cursor-pointer w-4 h-4 rounded border-gray-700" 
                  />
                </td>
                <td className="px-6 py-4 font-mono text-xs text-gray-400">{row.id}</td>
                <td className="px-6 py-4 font-medium text-white">{row.name}</td>
                
                {/* The re-added icons for document types */}
                <td className="px-6 py-4 flex items-center gap-2">
                  <i className={row.type === 'ID Card' ? 'ri-id-card-fill text-blue-400 text-lg' : 'ri-file-paper-2-fill text-yellow-400 text-lg'}></i>
                  {row.type}
                </td>
                
                <td className="px-6 py-4 text-gray-400">{row.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}