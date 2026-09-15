import React from "react";

export default function DocumentVault() {
  const tableData = Array(6).fill({
    id: "123",
    name: "Fill Container",
    type: "ID Card",
    gen: "Yes",
  });

  return (
    <div className="h-full w-full p-8 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-2">
        <i className="ri-folder-2-line text-4xl text-gray-400"></i>
        <h1 className="text-3xl font-semibold">Document Vault</h1>
      </div>
      <p className="text-gray-500 text-sm mb-8">
        View, verify, and export generated student certificates and ID
        credentials.
      </p>

      {/* Toolbar */}
      <div className="flex justify-between items-center mb-6">
        <div className="relative w-80">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"></i>
          <input
            type="text"
            placeholder="Search by Student ID or Name..."
            className="w-full bg-transparent border border-gray-800 rounded-lg py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-[#00e676] transition-colors"
          />
        </div>
        <button className="bg-[#00e676] hover:bg-[#00c868] text-black font-semibold px-6 py-2 rounded-lg text-sm transition-all duration-300 shadow-[0_0_15px_rgba(0,230,118,0.3)] active:scale-95">
          Export All
        </button>
      </div>

      {/* Data Table */}
      <div className="border border-gray-800/80 rounded-xl overflow-hidden bg-[#0c0d12]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wider">
              <th className="px-6 py-4 font-medium">Document ID</th>
              <th className="px-6 py-4 font-medium">Student Name</th>
              <th className="px-6 py-4 font-medium">Document Type</th>
              <th className="px-6 py-4 font-medium">Date Generated</th>
              <th className="px-6 py-4 font-medium text-center">
                Status / Action
              </th>
            </tr>
          </thead>
          <tbody className="text-sm text-gray-300">
            {tableData.map((row, idx) => (
              <tr
                key={idx}
                className="border-b border-gray-800/50 hover:bg-white/[0.02] transition-colors"
              >
                <td className="px-6 py-4">{row.id}</td>
                <td className="px-6 py-4">{row.name}</td>
                <td className="px-6 py-4">{row.type}</td>
                <td className="px-6 py-4">{row.gen}</td>
                <td className="px-6 py-4 text-center">
                  <button className="bg-[#1a1c26] hover:bg-[#252836] border border-gray-700/50 text-gray-200 px-6 py-1.5 rounded-md text-xs transition-colors">
                    Export
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
