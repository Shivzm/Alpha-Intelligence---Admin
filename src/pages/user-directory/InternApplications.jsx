import React from "react";

export default function InternApplications() {
  return (
    <div className="h-full w-full p-8 overflow-y-auto">
      <div className="flex items-center gap-4 mb-2">
        <i className="ri-settings-3-line text-4xl text-gray-400"></i>
        <h1 className="text-3xl font-semibold">Intern Applications</h1>
      </div>
      <p className="text-gray-500 text-sm mb-8">
        Check all the intern applications here.
      </p>

      <div className="border border-gray-800/80 rounded-xl p-8 bg-[#0c0d12]">
        <p className="text-gray-400">Page content coming soon...</p>
      </div>
    </div>
  );
}
