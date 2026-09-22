import React, { useState, useEffect } from "react";
import { useAdmin } from "../../context/AdminContext";

export default function ModelTelemetry() {
  const { inferences: apiInferences } = useAdmin();
  // Simulate a live stream of AI inferences
  const [inferences, setInferences] = useState([]);

  useEffect(() => setInferences(apiInferences), [apiInferences]);

  // Make the inference stream feel "alive" by updating times and adding occasional new logs
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) { // 30% chance every 2 seconds to get a new inference
        const intents = ["GENERATE_DOC", "FETCH_LOGS", "REVOKE_DOC", "SYSTEM_STATUS"];
        const newInference = {
          id: `INF-${Math.floor(Math.random() * 9000) + 1000}`,
          intent: intents[Math.floor(Math.random() * intents.length)],
          confidence: (Math.random() * 15 + 85).toFixed(1), // 85% - 100%
          latency: `${Math.floor(Math.random() * 100) + 80}ms`,
          tokens: Math.floor(Math.random() * 150) + 20,
          time: "Just now"
        };
        setInferences(prev => [newInference, ...prev.slice(0, 5)]); // Keep latest 6
      }
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-full w-full p-8 overflow-y-auto">
      <div className="flex items-center gap-4 mb-2">
        <i className="ri-pulse-line text-4xl text-secondary"></i>
        <h1 className="text-3xl font-semibold">Model Telemetry</h1>
      </div>
      <p className="text-secondary text-sm mb-8">
        Live natural language processing metrics, confidence scores, and token consumption.
      </p>

      {/* Top Model Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-surface border border-divider rounded-xl p-6 relative overflow-hidden">
          <h3 className="text-secondary text-sm font-medium mb-1">Active Model</h3>
          <div className="text-xl font-bold text-primary mb-2 font-mono">Alpha-NLU-v2.4</div>
          <div className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-[#00e676] animate-pulse"></span>
            <span className="text-[#00e676]">Online</span>
            <span className="text-gray-600 ml-auto">Local API</span>
          </div>
        </div>

        <div className="bg-surface border border-divider rounded-xl p-6">
          <h3 className="text-secondary text-sm font-medium mb-1">Avg Confidence</h3>
          <div className="text-3xl font-bold text-primary mb-2">96.8<span className="text-lg text-secondary font-normal">%</span></div>
          <div className="w-full bg-gray-800/50 rounded-full h-1.5">
            <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '96.8%' }}></div>
          </div>
        </div>

        <div className="bg-surface border border-divider rounded-xl p-6">
          <h3 className="text-secondary text-sm font-medium mb-1">Daily Token Usage</h3>
          <div className="text-3xl font-bold text-primary mb-2">1.24<span className="text-lg text-secondary font-normal">M</span></div>
          <div className="flex items-center gap-2 text-xs">
            <i className="ri-arrow-up-line text-yellow-500"></i>
            <span className="text-yellow-500">8% nearing limit</span>
          </div>
        </div>

        <div className="bg-surface border border-divider rounded-xl p-6">
          <h3 className="text-secondary text-sm font-medium mb-1">Avg Latency</h3>
          <div className="text-3xl font-bold text-primary mb-2">112<span className="text-lg text-secondary font-normal">ms</span></div>
          <div className="flex items-center gap-2 text-xs text-secondary">
            <i className="ri-speed-up-line"></i> Highly optimal
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Live Inference Stream */}
        <div className="lg:col-span-2 bg-surface border border-divider rounded-xl overflow-hidden flex flex-col">
          <div className="p-6 border-b border-divider flex justify-between items-center bg-surface-hover/50">
            <h2 className="text-lg font-medium text-primary flex items-center gap-2">
              <i className="ri-live-line text-red-500 animate-pulse"></i> Live Inference Stream
            </h2>
          </div>
          
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-divider text-xs text-secondary uppercase tracking-wider bg-white/[0.01]">
                <th className="px-6 py-4 font-medium">Req ID</th>
                <th className="px-6 py-4 font-medium">Mapped Intent</th>
                <th className="px-6 py-4 font-medium">Confidence</th>
                <th className="px-6 py-4 font-medium">Latency</th>
                <th className="px-6 py-4 font-medium text-right">Tokens</th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-300">
              {inferences.map((row, idx) => (
                <tr key={row.id} className="border-b border-divider/50 hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-secondary">{row.id}</td>
                  <td className="px-6 py-4 flex items-center gap-2">
                    {row.warning && <i className="ri-error-warning-fill text-yellow-500"></i>}
                    <span className={row.warning ? 'text-yellow-500 font-medium' : 'text-primary'}>{row.intent}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-mono ${row.confidence > 90 ? 'text-[#00e676] bg-[#00e676]/10' : 'text-yellow-500 bg-yellow-500/10'}`}>
                      {row.confidence}%
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-secondary">{row.latency}</td>
                  <td className="px-6 py-4 text-right font-mono text-secondary">{row.tokens}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Right Side: Drift & Analytics */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-surface border border-divider rounded-xl p-6">
            <h2 className="text-lg font-medium text-primary mb-6">Model Drift Detection</h2>
            
            <div className="space-y-5">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-secondary">Semantic Accuracy</span>
                  <span className="text-[#00e676] font-mono">98.2%</span>
                </div>
                <div className="w-full bg-gray-800/50 rounded-full h-1.5">
                  <div className="bg-[#00e676] h-1.5 rounded-full" style={{ width: '98.2%' }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-secondary">Intent Mismatch Rate</span>
                  <span className="text-yellow-500 font-mono">1.8%</span>
                </div>
                <div className="w-full bg-gray-800/50 rounded-full h-1.5">
                  <div className="bg-yellow-500 h-1.5 rounded-full" style={{ width: '1.8%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-secondary">Data Bias Deviation</span>
                  <span className="text-blue-500 font-mono">0.4%</span>
                </div>
                <div className="w-full bg-gray-800/50 rounded-full h-1.5">
                  <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '0.4%' }}></div>
                </div>
              </div>
            </div>
            
            <button className="w-full mt-6 bg-[#1a1c26] hover:bg-[#252836] border border-gray-700/50 text-gray-300 py-2 rounded-lg text-sm transition-colors">
              Run Diagnostic Scan
            </button>
          </div>
        </div>
        
      </div>
    </div>
  );
}