import React, { useState } from "react";

export default function IDCardTemplates() {
  const [templates] = useState([
    { id: "IDC-01", name: "Standard Employee ID", status: "Active", format: "CR80 (Portrait)", uses: 892 },
    { id: "IDC-02", name: "Contractor Badge", status: "Active", format: "CR80 (Portrait)", uses: 145 },
    { id: "IDC-03", name: "VIP Event Pass", status: "Draft", format: "A6 (Portrait)", uses: 0 },
  ]);

  return (
    <div className="h-full w-full p-8 overflow-y-auto">
      <div className="flex items-center gap-4 mb-2">
        <i className="ri-profile-line text-4xl text-gray-400"></i>
        <h1 className="text-3xl font-semibold">ID Card Templates</h1>
      </div>
      <p className="text-gray-500 text-sm mb-8">
        Manage portrait layouts, barcode variables, and photo placements for physical badges.
      </p>

      <div className="flex justify-between items-center mb-6 h-10">
        <div className="relative w-80">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"></i>
          <input type="text" placeholder="Search templates..." className="w-full bg-transparent border border-gray-800 rounded-lg py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-[#00e676] transition-colors" />
        </div>
        <button className="bg-[#00e676] hover:bg-[#00c868] text-black font-semibold px-4 py-2 rounded-lg text-sm transition-colors shadow-[0_0_15px_rgba(0,230,118,0.2)] flex items-center gap-2">
          <i className="ri-add-line text-lg"></i> Upload New Badge
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6">
        {templates.map((template) => (
          <div key={template.id} className="bg-[#0c0d12] border border-gray-800/80 rounded-xl overflow-hidden group hover:border-gray-700 transition-all duration-300 flex flex-col">
            
            {/* Visual Preview Placeholder (Portrait) */}
            <div className="h-64 bg-[#13151c] flex items-center justify-center relative overflow-hidden border-b border-gray-800 py-6">
              <div className="w-2/5 h-full border-2 border-gray-700 border-dashed rounded-lg flex flex-col items-center justify-center bg-black/20 gap-3 p-2 relative">
                 {/* Simulated Badge Layout */}
                 <div className="w-8 h-8 rounded-full bg-gray-800 absolute top-2"></div>
                 <div className="w-full h-2 bg-gray-800 rounded-full mt-8"></div>
                 <div className="w-3/4 h-2 bg-gray-800 rounded-full"></div>
                 <i className="ri-qr-code-line text-2xl text-gray-600 mt-auto"></i>
              </div>
              
              {/* Overlay Actions */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-3">
                <button className="bg-white/10 hover:bg-[#00e676] text-white hover:text-black w-10 h-10 rounded-full transition-colors flex items-center justify-center" title="Preview">
                  <i className="ri-eye-line text-xl"></i>
                </button>
                <button className="bg-white/10 hover:bg-[#00e676] text-white hover:text-black w-10 h-10 rounded-full transition-colors flex items-center justify-center" title="Edit Variables">
                  <i className="ri-edit-2-line text-xl"></i>
                </button>
              </div>
            </div>

            {/* Template Meta */}
            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-white font-medium truncate pr-2 leading-tight">{template.name}</h3>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${template.status === 'Active' ? 'bg-[#00e676]/10 text-[#00e676]' : 'bg-gray-800 text-gray-400'}`}>
                    {template.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-4 font-mono">{template.format}</p>
              </div>
              
              <div className="flex justify-between items-center text-xs text-gray-400 pt-4 border-t border-gray-800/50">
                <span className="flex items-center gap-1"><i className="ri-rfid-line"></i> {template.uses} prints</span>
                <span className="font-mono">{template.id}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}