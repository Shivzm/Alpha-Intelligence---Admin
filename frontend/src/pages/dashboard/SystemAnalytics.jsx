import { useEffect, useState } from "react";
import adminApi from "../../lib/adminApi";

export default function SystemAnalytics() {
  const [analytics, setAnalytics] = useState({ applications: [], funnel: [], domains: { domains: [], colleges: [] } });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([
      adminApi.getApplicationAnalytics(),
      adminApi.getApplicationFunnel(),
      adminApi.getApplicationDomains(),
    ])
      .then(([applications, funnel, domains]) => {
        if (!active) return;
        setAnalytics({
          applications: applications.data,
          funnel: funnel.data,
          domains: domains.data,
        });
      })
      .catch((requestError) => {
        if (active) setError(requestError.message || "Unable to load analytics.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const maximumCount = Math.max(1, ...analytics.applications.map((point) => point.count));

  return (
    <div className="h-full w-full overflow-y-auto p-8">
      <div className="mb-2 flex items-center gap-4">
        <i className="ri-bar-chart-grouped-line text-4xl text-secondary"></i>
        <h1 className="text-3xl font-semibold">System Analytics</h1>
      </div>
      <p className="mb-8 text-sm text-secondary">Application volume and lifecycle summaries from persisted records.</p>
      {error && <p role="alert" className="mb-4 rounded border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}
      {loading && <p className="mb-4 text-sm text-secondary">Loading analytics...</p>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="flex h-80 flex-col rounded-lg border border-divider bg-surface p-6">
          <h2 className="mb-1 text-lg font-medium text-primary">Applications over time</h2>
          <p className="mb-6 text-xs text-secondary">Grouped by day. Current source sample: up to 100 records.</p>
          {analytics.applications.length ? (
            <div className="flex min-h-0 flex-1 items-end gap-2 border-b border-divider/50 px-2">
              {analytics.applications.map((point) => (
                <div key={point.period} className="group relative flex h-full min-w-2 flex-1 items-end">
                  <div
                    className="w-full rounded-t-sm bg-[#00e676]/70 transition-colors group-hover:bg-[#00e676]"
                    style={{ height: `${Math.max(2, (point.count / maximumCount) * 100)}%` }}
                    title={`${point.period}: ${point.count}`}
                  />
                  <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] text-secondary">{point.period.slice(5)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-secondary">No application records yet.</div>
          )}
        </section>

        <section className="rounded-lg border border-divider bg-surface p-6">
          <h2 className="mb-5 text-lg font-medium text-primary">Application funnel</h2>
          <div className="space-y-4">
            {analytics.funnel.map((stage) => {
              const peak = Math.max(1, ...analytics.funnel.map((item) => item.count));
              return (
                <div key={stage.status}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-secondary">{stage.status}</span>
                    <span className="font-mono text-primary">{stage.count}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-gray-800/60">
                    <div className="h-full rounded-full bg-blue-500" style={{ width: `${(stage.count / peak) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-lg border border-divider bg-surface p-6">
          <h2 className="mb-5 text-lg font-medium text-primary">By internship domain</h2>
          <div className="space-y-3">
            {analytics.domains.domains.map((item) => (
              <div key={item.name} className="flex justify-between border-b border-divider/50 pb-2 text-sm">
                <span className="text-secondary">{item.name}</span><span className="font-mono text-primary">{item.count}</span>
              </div>
            ))}
            {!analytics.domains.domains.length && <p className="text-sm text-secondary">No domain data yet.</p>}
          </div>
        </section>

        <section className="rounded-lg border border-divider bg-surface p-6">
          <h2 className="mb-5 text-lg font-medium text-primary">By college</h2>
          <div className="space-y-3">
            {analytics.domains.colleges.map((item) => (
              <div key={item.name} className="flex justify-between border-b border-divider/50 pb-2 text-sm">
                <span className="text-secondary">{item.name}</span><span className="font-mono text-primary">{item.count}</span>
              </div>
            ))}
            {!analytics.domains.colleges.length && <p className="text-sm text-secondary">No college data yet.</p>}
          </div>
        </section>
      </div>
    </div>
  );
}
