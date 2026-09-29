import React, { useState, useEffect } from "react";
import { useAdmin } from "../../context/AdminContext";
import adminApi from "../../lib/adminApi";

export default function ModelTelemetry() {
  const { inferences: apiInferences } = useAdmin();
  const [inferences, setInferences] = useState([]);
  const [metrics, setMetrics] = useState({ inferenceCount: 0, meanConfidence: 0, meanLatencyMs: 0, intentHitRate: 0 });
  const [error, setError] = useState("");

  useEffect(() => setInferences(apiInferences.map((inference) => ({
    ...inference,
    intent: inference.intent || inference.intentId || "No intent",
    latency: Number.isFinite(Number(inference.latencyMs)) ? `${Math.round(Number(inference.latencyMs))}ms` : "Unavailable",
    tokens: inference.tokens ?? "Not tracked",
    confidence: Number(inference.confidence || 0) * (Number(inference.confidence || 0) <= 1 ? 100 : 1),
  }))), [apiInferences]);

  useEffect(() => {
    let active = true;
    adminApi.getTelemetry()
      .then((result) => { if (active) setMetrics(result.data); })
      .catch((requestError) => { if (active) setError(requestError.message || "Unable to load telemetry."); });
    return () => { active = false; };
  }, []);

  return (
    <div className="h-full w-full p-8 overflow-y-auto">
      <div className="flex items-center gap-4 mb-2">
        <i className="ri-pulse-line text-4xl text-secondary"></i>
        <h1 className="text-3xl font-semibold">Model Telemetry</h1>
      </div>
      <p className="text-secondary text-sm mb-8">
        Recorded rule-matching requests, confidence scores, and latency. Unavailable model metrics are not estimated.
      </p>
      {error && <p role="alert" className="mb-4 rounded border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}

      {/* Top Model Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-surface border border-divider rounded-xl p-6 relative overflow-hidden">
          <h3 className="text-secondary text-sm font-medium mb-1">Active Model</h3>
          <div className="text-xl font-bold text-primary mb-2 font-mono">Rule matcher</div>
          <div className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-[#00e676] animate-pulse"></span>
            <span className="text-[#00e676]">Configured</span>
            <span className="text-gray-600 ml-auto">{metrics.inferenceCount} records</span>
          </div>
        </div>

        <div className="bg-surface border border-divider rounded-xl p-6">
          <h3 className="text-secondary text-sm font-medium mb-1">Avg Confidence</h3>
          <div className="text-3xl font-bold text-primary mb-2">{(metrics.meanConfidence * 100).toFixed(1)}<span className="text-lg text-secondary font-normal">%</span></div>
          <div className="w-full bg-gray-800/50 rounded-full h-1.5">
            <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, metrics.meanConfidence * 100)}%` }}></div>
          </div>
        </div>

        <div className="bg-surface border border-divider rounded-xl p-6">
          <h3 className="text-secondary text-sm font-medium mb-1">Daily Token Usage</h3>
          <div className="text-3xl font-bold text-primary mb-2">Not tracked</div>
          <div className="flex items-center gap-2 text-xs text-secondary">Token usage is not collected.</div>
        </div>

        <div className="bg-surface border border-divider rounded-xl p-6">
          <h3 className="text-secondary text-sm font-medium mb-1">Avg Latency</h3>
          <div className="text-3xl font-bold text-primary mb-2">{Math.round(metrics.meanLatencyMs)}<span className="text-lg text-secondary font-normal">ms</span></div>
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
              <i className="ri-pulse-line text-blue-400"></i> Recorded Inferences
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
                  <td className="px-6 py-4 font-mono text-xs text-secondary">{row.id || row.commandId || "-"}</td>
                  <td className="px-6 py-4 flex items-center gap-2">
                    {row.warning && <i className="ri-error-warning-fill text-yellow-500"></i>}
                    <span className={row.warning ? 'text-yellow-500 font-medium' : 'text-primary'}>{row.intent}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-mono ${row.confidence > 90 ? 'text-[#00e676] bg-[#00e676]/10' : 'text-yellow-500 bg-yellow-500/10'}`}>
                      {Number(row.confidence || 0).toFixed(1)}%
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
                  <span className="text-secondary">Mean confidence</span>
                  <span className="text-[#00e676] font-mono">{(metrics.meanConfidence * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-800/50 rounded-full h-1.5">
                  <div className="bg-[#00e676] h-1.5 rounded-full" style={{ width: `${Math.min(100, metrics.meanConfidence * 100)}%` }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-secondary">Intent Mismatch Rate</span>
                  <span className="text-yellow-500 font-mono">{metrics.inferenceCount ? `${((1 - metrics.intentHitRate) * 100).toFixed(1)}%` : "Not measured"}</span>
                </div>
                <div className="w-full bg-gray-800/50 rounded-full h-1.5">
                  <div className="bg-yellow-500 h-1.5 rounded-full" style={{ width: `${metrics.inferenceCount ? Math.min(100, (1 - metrics.intentHitRate) * 100) : 0}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-secondary">Data Bias Deviation</span>
                  <span className="text-blue-500 font-mono">Not measured</span>
                </div>
                <div className="w-full bg-gray-800/50 rounded-full h-1.5">
                  <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '0%' }}></div>
                </div>
              </div>
            </div>
            
            <p className="mt-6 text-xs text-secondary">Model quality diagnostics require a trained model and labeled evaluation data.</p>
          </div>
        </div>
        
      </div>
    </div>
  );
}