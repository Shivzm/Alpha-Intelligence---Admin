import React from "react";

export default function CommandCenter() {
  return (
    <div className="h-full w-full flex overflow-hidden">
      {/* Main Terminal Area */}
      <div className="flex-1 flex flex-col p-8 relative">
        <div className="flex items-center gap-4 mb-2">
          <i className="ri-terminal-window-line text-4xl text-gray-400"></i>
          <h1 className="text-3xl font-semibold">AI Command Center</h1>
        </div>
        <p className="text-gray-500 text-sm mb-8">
          Execute NLP text commands and monitor live model telemetry.
        </p>

        {/* Chat / Terminal Output Area (Placeholder) */}
        <div className="flex-1 overflow-y-auto"></div>

        {/* Input Bar */}
        <div className="relative w-full">
          <input
            type="text"
            placeholder="Enter command or system prompt..."
            className="w-full bg-[#0c0d12] border border-gray-800 rounded-xl py-4 pl-6 pr-14 text-sm text-gray-200 focus:outline-none focus:border-[#00e676]/50 transition-colors shadow-lg"
          />
          <button className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-[#00e676]/10 text-[#00e676] rounded-full flex items-center justify-center hover:bg-[#00e676] hover:text-black transition-colors">
            <i className="ri-arrow-up-line text-lg"></i>
          </button>
        </div>
      </div>

      {/* Right Telemetry Panel */}
      <div className="w-80 border-l border-gray-800/60 bg-[#0a0b10] p-6 flex flex-col z-10">
        <h3 className="text-sm font-semibold text-white mb-4 border-b border-gray-800 pb-2">
          Live Telemetry
        </h3>

        <div className="space-y-2 mb-8 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Latency:</span>{" "}
            <span className="text-[#00e676]">124ms</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Confidence:</span>{" "}
            <span className="text-white">98.4%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Engine:</span>{" "}
            <span className="text-white">PyTorch v2.1</span>
          </div>
        </div>

        <div className="bg-[#050608] border border-gray-800/80 rounded-lg p-4 font-mono text-xs text-[#00e676] leading-relaxed shadow-inner">
          {"{"}
          <br />
          &nbsp;&nbsp;"intent": "generate_doc",
          <br />
          &nbsp;&nbsp;"status": "success"
          <br />
          {"}"}
        </div>
      </div>
    </div>
  );
}
