import React from "react";

export default function SystemAnalytics() {
  return (
    <div className="h-full w-full p-8 overflow-y-auto">
      <div className="flex items-center gap-4 mb-2">
        <i className="ri-bar-chart-grouped-line text-4xl text-gray-400"></i>
        <h1 className="text-3xl font-semibold">System Analytics</h1>
      </div>
      <p className="text-gray-500 text-sm mb-8">
        Deep dive into API usage, traffic sources, and historical system performance.
      </p>

      {/* Filter Bar */}
      <div className="flex justify-between items-center mb-6 h-10">
        <div className="flex bg-[#13151c] border border-gray-800 rounded-lg p-1">
          <button className="px-4 py-1.5 rounded-md bg-gray-800 text-white text-xs font-medium">7 Days</button>
          <button className="px-4 py-1.5 rounded-md text-gray-400 hover:text-white text-xs font-medium transition-colors">30 Days</button>
          <button className="px-4 py-1.5 rounded-md text-gray-400 hover:text-white text-xs font-medium transition-colors">YTD</button>
        </div>
        <button className="bg-[#1a1c26] border border-gray-700/50 text-gray-300 hover:text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2">
          <i className="ri-file-chart-line"></i> Export Report
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        
        {/* Main Chart Area */}
        <div className="lg:col-span-2 bg-[#0c0d12] border border-gray-800/80 rounded-xl p-6 h-96 flex flex-col">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-lg font-medium text-white">API Request Volume</h2>
              <p className="text-xs text-gray-500">Total requests processed by the AI Engine</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-white">124.5k</div>
              <div className="text-xs text-[#00e676]"><i className="ri-arrow-up-line"></i> 14.2%</div>
            </div>
          </div>
          
          {/* Simulated Line Chart */}
          <div className="flex-1 flex items-end justify-between gap-2 relative">
            {/* Y-Axis Labels */}
            <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-[10px] text-gray-600 font-mono pb-6">
              <span>20k</span><span>15k</span><span>10k</span><span>5k</span><span>0</span>
            </div>
            
            <div className="flex-1 flex items-end justify-between pl-8 h-full pb-6 border-b border-gray-800/50">
              {[40, 55, 35, 75, 60, 90, 85, 100, 70, 85, 60, 45, 80, 95].map((h, i) => (
                <div key={i} className="w-full mx-1 group relative flex justify-center h-full items-end">
                  <div 
                    className="w-full bg-gradient-to-t from-blue-500/20 to-blue-500/80 rounded-t-sm group-hover:from-[#00e676]/40 group-hover:to-[#00e676] transition-all" 
                    style={{ height: `${h}%` }}
                  ></div>
                  <div className="absolute -top-8 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 z-10">
                    {h * 200}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Traffic Sources Donut Chart Alternative */}
        <div className="lg:col-span-1 bg-[#0c0d12] border border-gray-800/80 rounded-xl p-6 flex flex-col">
          <h2 className="text-lg font-medium text-white mb-1">Request Sources</h2>
          <p className="text-xs text-gray-500 mb-8">Where traffic is originating from</p>
          
          <div className="flex-1 space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-300 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#00e676]"></div> Dashboard UI</span>
                <span className="text-white font-medium">65%</span>
              </div>
              <div className="w-full bg-gray-800/50 rounded-full h-2"><div className="bg-[#00e676] h-2 rounded-full" style={{ width: '65%' }}></div></div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-300 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500"></div> API Endpoints</span>
                <span className="text-white font-medium">25%</span>
              </div>
              <div className="w-full bg-gray-800/50 rounded-full h-2"><div className="bg-blue-500 h-2 rounded-full" style={{ width: '25%' }}></div></div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-300 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-purple-500"></div> Automated Cron Jobs</span>
                <span className="text-white font-medium">10%</span>
              </div>
              <div className="w-full bg-gray-800/50 rounded-full h-2"><div className="bg-purple-500 h-2 rounded-full" style={{ width: '10%' }}></div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}