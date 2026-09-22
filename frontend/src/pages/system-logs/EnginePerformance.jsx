import React from "react";

export default function EnginePerformance() {
  return (
    <div className="h-full w-full p-8 overflow-y-auto">
      <div className="flex items-center gap-4 mb-2">
        <i className="ri-dashboard-3-line text-4xl text-secondary"></i>
        <h1 className="text-3xl font-semibold">Engine Performance</h1>
      </div>
      <p className="text-secondary text-sm mb-8">Live telemetry and resource utilization for the AI backend.</p>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        
        <div className="bg-surface border border-divider rounded-xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10"><i className="ri-cpu-line text-6xl text-[#00e676]"></i></div>
          <h3 className="text-secondary text-sm font-medium mb-1">Model Latency</h3>
          <div className="text-3xl font-bold text-primary mb-2">124<span className="text-lg text-secondary font-normal">ms</span></div>
          <div className="flex items-center gap-2 text-xs">
            <i className="ri-arrow-down-line text-[#00e676]"></i>
            <span className="text-[#00e676]">12% faster</span>
            <span className="text-gray-600">than last hour</span>
          </div>
        </div>

        <div className="bg-surface border border-divider rounded-xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10"><i className="ri-check-double-line text-6xl text-blue-500"></i></div>
          <h3 className="text-secondary text-sm font-medium mb-1">Intent Accuracy</h3>
          <div className="text-3xl font-bold text-primary mb-2">98.4<span className="text-lg text-secondary font-normal">%</span></div>
          <div className="flex items-center gap-2 text-xs">
            <i className="ri-subtract-line text-secondary"></i>
            <span className="text-secondary">Stable</span>
            <span className="text-gray-600">across 1,204 requests</span>
          </div>
        </div>

        <div className="bg-surface border border-divider rounded-xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10"><i className="ri-server-line text-6xl text-purple-500"></i></div>
          <h3 className="text-secondary text-sm font-medium mb-1">System Uptime</h3>
          <div className="text-3xl font-bold text-primary mb-2">99.99<span className="text-lg text-secondary font-normal">%</span></div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-purple-400 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span> Active</span>
            <span className="text-gray-600">No disruptions detected</span>
          </div>
        </div>

      </div>

      {/* Hardware Utilization Bars */}
      <div className="bg-surface border border-divider rounded-xl p-8 mb-6">
        <h2 className="text-lg font-medium text-primary mb-6 flex items-center gap-2">
          <i className="ri-hard-drive-2-line text-[#00e676]"></i> Resource Utilization
        </h2>
        
        <div className="space-y-6">
          {/* CPU */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-secondary">CPU Usage (Cluster A)</span>
              <span className="text-primary font-mono">42%</span>
            </div>
            <div className="w-full bg-gray-800/50 rounded-full h-2">
              <div className="bg-[#00e676] h-2 rounded-full" style={{ width: '42%' }}></div>
            </div>
          </div>
          
          {/* RAM */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-secondary">Memory Allocation</span>
              <span className="text-primary font-mono">68%</span>
            </div>
            <div className="w-full bg-gray-800/50 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: '68%' }}></div>
            </div>
          </div>

          {/* GPU */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-secondary">GPU VRAM (Model Inference)</span>
              <span className="text-primary font-mono">89%</span>
            </div>
            <div className="w-full bg-gray-800/50 rounded-full h-2">
              <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '89%' }}></div>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
}