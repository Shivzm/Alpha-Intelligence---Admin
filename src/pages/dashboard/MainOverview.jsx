import React from "react";

export default function MainOverview() {
  return (
    <div className="h-full w-full p-8 overflow-y-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold mb-1">System Overview</h1>
          <p className="text-gray-500 text-sm">Welcome back. Here is your system snapshot for today.</p>
        </div>
        <div className="bg-[#13151c] border border-gray-800 px-4 py-2 rounded-lg text-sm text-gray-300 flex items-center gap-2">
          <i className="ri-calendar-line text-[#00e676]"></i>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { title: "Total Users", val: "1,204", icon: "ri-group-line", color: "text-blue-400", trend: "+12%" },
          { title: "Docs Generated", val: "8,432", icon: "ri-file-copy-2-line", color: "text-[#00e676]", trend: "+3.4%" },
          { title: "Pending Apps", val: "42", icon: "ri-inbox-archive-line", color: "text-yellow-400", trend: "-5" },
          { title: "AI Commands Executed", val: "892", icon: "ri-terminal-box-line", color: "text-purple-400", trend: "+24%" }
        ].map((stat, idx) => (
          <div key={idx} className="bg-[#0c0d12] border border-gray-800/80 rounded-xl p-6 hover:border-gray-700 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-lg bg-white/[0.02] ${stat.color}`}>
                <i className={`${stat.icon} text-xl`}></i>
              </div>
              <span className="text-xs font-medium text-gray-500 bg-gray-800/50 px-2 py-1 rounded-full">{stat.trend}</span>
            </div>
            <h3 className="text-gray-400 text-sm font-medium mb-1">{stat.title}</h3>
            <div className="text-3xl font-bold text-white">{stat.val}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Chart Placeholder & Quick Actions */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-[#0c0d12] border border-gray-800/80 rounded-xl p-6 h-80 flex flex-col">
            <h2 className="text-lg font-medium text-white mb-6">Document Generation Trend</h2>
            <div className="flex-1 border border-gray-800/50 rounded-lg bg-[#13151c] flex items-end justify-between px-4 pb-4 pt-10 relative">
              {/* Simulated Chart Bars */}
              <div className="absolute top-4 left-4 text-xs text-gray-600 font-mono">Last 7 Days</div>
              {[40, 65, 30, 85, 55, 90, 75].map((h, i) => (
                <div key={i} className="w-[10%] bg-gradient-to-t from-[#00e676]/80 to-[#00e676]/20 rounded-t-sm hover:opacity-80 transition-opacity cursor-pointer group relative" style={{ height: `${h}%` }}>
                   <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100">{h * 10}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Activity Feed */}
        <div className="lg:col-span-1 bg-[#0c0d12] border border-gray-800/80 rounded-xl p-6">
          <h2 className="text-lg font-medium text-white mb-6">Recent Activity</h2>
          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-gray-800 before:to-transparent">
            
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-5 h-5 rounded-full border border-gray-800 bg-[#0c0d12] group-[.is-active]:bg-[#00e676] text-black shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow shadow-[#00e676]/30 z-10"></div>
              <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.25rem)] p-3 rounded bg-[#13151c] border border-gray-800/50 ml-4 md:ml-0 md:mr-4">
                <div className="text-sm font-medium text-white mb-1">Backup Completed</div>
                <div className="text-xs text-gray-500 font-mono">10 mins ago</div>
              </div>
            </div>
            
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
              <div className="flex items-center justify-center w-5 h-5 rounded-full border border-gray-700 bg-gray-800 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10"></div>
              <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.25rem)] p-3 rounded bg-[#13151c] border border-gray-800/50 ml-4 md:ml-0 md:mr-4 md:ml-4">
                <div className="text-sm font-medium text-white mb-1">Batch ID Gen (42)</div>
                <div className="text-xs text-gray-500 font-mono">1 hour ago</div>
              </div>
            </div>

            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
              <div className="flex items-center justify-center w-5 h-5 rounded-full border border-gray-700 bg-gray-800 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10"></div>
              <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.25rem)] p-3 rounded bg-[#13151c] border border-gray-800/50 ml-4 md:ml-0 md:mr-4">
                <div className="text-sm font-medium text-white mb-1">Admin Jane Logged In</div>
                <div className="text-xs text-gray-500 font-mono">3 hours ago</div>
              </div>
            </div>

          </div>
          <button className="w-full mt-6 text-sm text-[#00e676] hover:text-[#00c868] transition-colors py-2">View Full Audit Log &rarr;</button>
        </div>
      </div>
    </div>
  );
}