import React, { useState } from "react";
import { useAdmin } from "../../context/AdminContext";

export default function CertificateTemplates() {
  const { certificateTemplates: templates } = useAdmin();

  return (
    <div className="h-full w-full p-8 overflow-y-auto">
      <div className="flex items-center gap-4 mb-2">
        <i className="ri-layout-masonry-line text-4xl text-secondary"></i>
        <h1 className="text-3xl font-semibold">Certificate Templates</h1>
      </div>
      <p className="text-secondary text-sm mb-8">
        Design, upload, and map dynamic variables to your official certificate layouts.
      </p>

      <div className="flex justify-between items-center mb-6 h-10">
        <div className="relative w-80">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-secondary"></i>
          <input type="text" placeholder="Search templates..." className="w-full bg-transparent border border-divider rounded-lg py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-[#00e676] transition-colors" />
        </div>
        <button className="bg-[#00e676] hover:bg-[#00c868] text-black font-semibold px-4 py-2 rounded-lg text-sm transition-colors shadow-[0_0_15px_rgba(0,230,118,0.2)] flex items-center gap-2">
          <i className="ri-add-line text-lg"></i> Upload New Template
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {templates.map((template) => (
          <div key={template.id} className="bg-surface border border-divider rounded-xl overflow-hidden group hover:border-gray-700 transition-all duration-300 flex flex-col">
            
            {/* Visual Preview Placeholder */}
            <div className="h-48 bg-surface-hover flex items-center justify-center relative overflow-hidden border-b border-divider">
              <div className="w-4/5 h-3/5 border-2 border-gray-700 border-dashed rounded-lg flex items-center justify-center bg-black/20">
                <i className="ri-file-paper-2-line text-4xl text-gray-600"></i>
              </div>
              {/* Overlay Actions */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
                <button className="bg-white/10 hover:bg-[#00e676] text-primary hover:text-black p-2 rounded-full transition-colors" title="Preview">
                  <i className="ri-eye-line text-xl"></i>
                </button>
                <button className="bg-white/10 hover:bg-[#00e676] text-primary hover:text-black p-2 rounded-full transition-colors" title="Edit Variables">
                  <i className="ri-edit-2-line text-xl"></i>
                </button>
              </div>
            </div>

            {/* Template Meta */}
            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-primary font-medium truncate pr-2">{template.name}</h3>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${template.status === 'Active' ? 'bg-[#00e676]/10 text-[#00e676]' : 'bg-gray-800 text-secondary'}`}>
                    {template.status}
                  </span>
                </div>
                <p className="text-xs text-secondary mb-4 font-mono">{template.format}</p>
              </div>
              
              <div className="flex justify-between items-center text-xs text-secondary pt-4 border-t border-divider/50">
                <span className="flex items-center gap-1"><i className="ri-loop-right-line"></i> {template.uses} generated</span>
                <span className="font-mono">{template.id}</span>
              </div>
            </div>
            
          </div>
        ))}
      </div>
    </div>
  );
}