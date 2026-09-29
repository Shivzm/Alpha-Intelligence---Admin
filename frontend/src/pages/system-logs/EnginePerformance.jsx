import { useEffect, useState } from "react";
import adminApi from "../../lib/adminApi";

export default function EnginePerformance() {
  const [metrics, setMetrics] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    adminApi.getTelemetry()
      .then((result) => { if (active) setMetrics(result.data); })
      .catch((requestError) => { if (active) setError(requestError.message || "Unable to load engine telemetry."); });
    return () => { active = false; };
  }, []);

  const cards = [
    { title: "Recorded inference latency", value: metrics ? `${Math.round(metrics.meanLatencyMs)} ms` : "Unavailable", icon: "ri-speed-up-line" },
    { title: "Mean rule confidence", value: metrics ? `${(metrics.meanConfidence * 100).toFixed(1)}%` : "Unavailable", icon: "ri-check-double-line" },
    { title: "Recorded inferences", value: metrics ? String(metrics.inferenceCount) : "Unavailable", icon: "ri-pulse-line" },
  ];

  return (
    <div className="h-full w-full overflow-y-auto p-8">
      <div className="mb-2 flex items-center gap-4">
        <i className="ri-dashboard-3-line text-4xl text-secondary"></i>
        <h1 className="text-3xl font-semibold">Engine Performance</h1>
      </div>
      <p className="mb-8 text-sm text-secondary">Recorded inference telemetry. Host resource utilization and uptime are not provided by the current serverless runtime.</p>
      {error && <p role="alert" className="mb-4 rounded border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {cards.map((card) => (
          <section key={card.title} className="rounded-lg border border-divider bg-surface p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-medium text-secondary">{card.title}</h2>
              <i className={`${card.icon} text-xl text-[#00e676]`}></i>
            </div>
            <p className="text-3xl font-semibold text-primary">{card.value}</p>
          </section>
        ))}
      </div>

      <section className="mt-6 rounded-lg border border-divider bg-surface p-6">
        <h2 className="mb-2 text-lg font-medium text-primary">Runtime resource metrics</h2>
        <p className="text-sm text-secondary">CPU, memory, GPU, and uptime metrics are unavailable from this deployment. Use Vercel Observability for function-level runtime measurements.</p>
      </section>
    </div>
  );
}
