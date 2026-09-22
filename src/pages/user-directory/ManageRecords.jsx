import React, { useState } from "react";
import { useAdmin } from "../../context/AdminContext";

export default function ManageRecords() {
  // Use the records from global state instead of local state
  const { records, setRecords } = useAdmin();
  
  const [selected, setSelected] = useState([]);

  // Checkbox Handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelected(records.map(record => record.id));
    } else {
      setSelected([]);
    }
  };

  const handleSelectOne = (e, id) => {
    if (e.target.checked) {
      setSelected([...selected, id]);
    } else {
      setSelected(selected.filter(item => item !== id));
    }
  };

  const handleBulkGenerate = (type) => {
    alert(`Initiating bulk generation of ${type}s for ${selected.length} selected users.`);
    setSelected([]); // Clear selection after action
  };

  return (
    <div className="h-full w-full p-8 overflow-y-auto">
      <div className="flex items-center gap-4 mb-2">
        <i className="ri-folder-user-line text-4xl text-gray-400"></i>
        <h1 className="text-3xl font-semibold">Manage Records</h1>
      </div>
      <p className="text-gray-500 text-sm mb-8">Edit user profiles and generate official credentials.</p>

      {/* Dynamic Toolbar */}
      <div className="flex justify-between items-center mb-6 h-10">
        <div className="relative w-80">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"></i>
          <input
            type="text"
            placeholder="Search by ID or Name..."
            className="w-full bg-transparent border border-gray-800 rounded-lg py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-[#00e676] transition-colors"
          />
        </div>
        
        {/* If items are selected, show Bulk Actions. Otherwise, show Add Record. */}
        {selected.length > 0 ? (
          <div className="flex items-center gap-3 animate-fade-in">
            <span className="text-sm text-[#00e676] mr-2">{selected.length} selected</span>
            <button 
              onClick={() => handleBulkGenerate('ID Card')}
              className="bg-[#1a1c26] border border-gray-700/50 hover:border-[#00e676]/50 text-gray-300 hover:text-[#00e676] px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2"
            >
              <i className="ri-id-card-line"></i> ID Card
            </button>
            <button 
              onClick={() => handleBulkGenerate('Certificate')}
              className="bg-[#1a1c26] border border-gray-700/50 hover:border-[#00e676]/50 text-gray-300 hover:text-[#00e676] px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2"
            >
              <i className="ri-file-paper-2-line"></i> Certificate
            </button>
          </div>
        ) : (
          <button className="bg-[#1a1c26] hover:bg-[#252836] border border-gray-700/50 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2">
            <i className="ri-add-line"></i> Add New Record
          </button>
        )}
      </div>

      <div className="border border-gray-800/80 rounded-xl overflow-hidden bg-[#0c0d12]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wider bg-white/[0.01]">
              <th className="px-6 py-4 w-12">
                <input 
                  type="checkbox" 
                  checked={selected.length === records.length && records.length > 0}
                  onChange={handleSelectAll}
                  className="accent-[#00e676] w-4 h-4 rounded border-gray-700 cursor-pointer"
                />
              </th>
              <th className="px-6 py-4 font-medium">User ID</th>
              <th className="px-6 py-4 font-medium">Full Name</th>
              <th className="px-6 py-4 font-medium">Program / Role</th>
              <th className="px-6 py-4 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="text-sm text-gray-300">
            {records.map((row) => (
              <tr key={row.id} className={`border-b border-gray-800/50 hover:bg-white/[0.02] transition-colors ${selected.includes(row.id) ? 'bg-[#00e676]/5' : ''}`}>
                <td className="px-6 py-4">
                  <input 
                    type="checkbox" 
                    checked={selected.includes(row.id)}
                    onChange={(e) => handleSelectOne(e, row.id)}
                    className="accent-[#00e676] w-4 h-4 rounded border-gray-700 cursor-pointer"
                  />
                </td>
                <td className="px-6 py-4 font-mono text-xs">{row.id}</td>
                <td className="px-6 py-4 font-medium text-white">{row.name}</td>
                <td className="px-6 py-4">{row.program}</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-semibold ${row.status === 'Active' ? 'bg-[#00e676]/10 text-[#00e676]' : 'bg-yellow-500/10 text-yellow-500'}`}>
                    {row.status}
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