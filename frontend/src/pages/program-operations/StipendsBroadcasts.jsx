import { useEffect, useState } from "react";
import adminApi from "../../lib/adminApi";

const emptyStipend = { recordId: "", userId: "", period: "", amount: "", currency: "INR", status: "pending" };

export default function StipendsBroadcasts() {
  const [stipends, setStipends] = useState([]);
  const [stipend, setStipend] = useState(emptyStipend);
  const [broadcast, setBroadcast] = useState({ userIds: "", title: "", body: "", link: "" });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState("");

  useEffect(() => {
    let active = true;
    adminApi.listStipends()
      .then((result) => { if (active) setStipends(result.data); })
      .catch((requestError) => { if (active) setError(requestError.message || "Unable to load stipends."); });
    return () => { active = false; };
  }, []);

  const createStipend = async (event) => {
    event.preventDefault();
    setError("");
    setSaving("stipend");
    try {
      const result = await adminApi.createStipend({ ...stipend, amount: Number(stipend.amount) });
      setStipends((current) => [result.data, ...current]);
      setStipend(emptyStipend);
    } catch (requestError) {
      setError(requestError.message || "Unable to record stipend payment.");
    } finally {
      setSaving("");
    }
  };

  const sendBroadcast = async (event) => {
    event.preventDefault();
    setError("");
    setSaving("broadcast");
    try {
      const userIds = broadcast.userIds.split(",").map((id) => id.trim()).filter(Boolean);
      const result = await adminApi.sendNotification({ ...broadcast, userIds, type: "admin.broadcast" });
      setNotice(`In-app notification queued for ${result.data.recipientCount} user(s).`);
      setBroadcast({ userIds: "", title: "", body: "", link: "" });
    } catch (requestError) {
      setError(requestError.message || "Unable to send the in-app notification.");
    } finally {
      setSaving("");
    }
  };

  return (
    <div className="h-full w-full overflow-y-auto p-8">
      <div className="mb-2 flex items-center gap-4">
        <i className="ri-wallet-3-line text-4xl text-secondary"></i>
        <h1 className="text-3xl font-semibold">Stipends & Broadcasts</h1>
      </div>
      <p className="mb-8 text-sm text-secondary">Record intern stipend payments and send in-app notifications.</p>
      {error && <p role="alert" className="mb-4 rounded border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}
      {notice && <p role="status" className="mb-4 rounded border border-[#00e676]/30 bg-[#00e676]/10 px-4 py-3 text-sm text-[#00e676]">{notice}</p>}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <form onSubmit={createStipend} className="space-y-3 rounded-lg border border-divider bg-surface p-5">
          <h2 className="text-lg font-medium text-primary">Record a stipend</h2>
          <input required value={stipend.recordId} onChange={(event) => setStipend((current) => ({ ...current, recordId: event.target.value }))} placeholder="Intern record ID" className="w-full rounded border border-divider bg-surface-hover px-3 py-2 text-sm text-primary" />
          <input required value={stipend.userId} onChange={(event) => setStipend((current) => ({ ...current, userId: event.target.value }))} placeholder="Student user ID" className="w-full rounded border border-divider bg-surface-hover px-3 py-2 text-sm text-primary" />
          <div className="grid grid-cols-2 gap-3">
            <input required value={stipend.period} onChange={(event) => setStipend((current) => ({ ...current, period: event.target.value }))} placeholder="Period (e.g. 2026-09)" className="rounded border border-divider bg-surface-hover px-3 py-2 text-sm text-primary" />
            <input required type="number" min="0" step="0.01" value={stipend.amount} onChange={(event) => setStipend((current) => ({ ...current, amount: event.target.value }))} placeholder="Amount" className="rounded border border-divider bg-surface-hover px-3 py-2 text-sm text-primary" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input required maxLength={3} value={stipend.currency} onChange={(event) => setStipend((current) => ({ ...current, currency: event.target.value.toUpperCase() }))} aria-label="Currency" className="rounded border border-divider bg-surface-hover px-3 py-2 text-sm text-primary" />
            <select value={stipend.status} onChange={(event) => setStipend((current) => ({ ...current, status: event.target.value }))} className="rounded border border-divider bg-surface-hover px-3 py-2 text-sm text-primary"><option value="pending">Pending</option><option value="paid">Paid</option><option value="failed">Failed</option></select>
          </div>
          <button disabled={saving === "stipend"} className="w-full rounded bg-[#00e676] px-4 py-2 text-sm font-semibold text-black disabled:opacity-50">{saving === "stipend" ? "Saving..." : "Save stipend record"}</button>
        </form>

        <form onSubmit={sendBroadcast} className="space-y-3 rounded-lg border border-divider bg-surface p-5">
          <h2 className="text-lg font-medium text-primary">In-app broadcast</h2>
          <input required value={broadcast.userIds} onChange={(event) => setBroadcast((current) => ({ ...current, userIds: event.target.value }))} placeholder="Student user IDs, comma separated (max 100)" className="w-full rounded border border-divider bg-surface-hover px-3 py-2 text-sm text-primary" />
          <input required maxLength={160} value={broadcast.title} onChange={(event) => setBroadcast((current) => ({ ...current, title: event.target.value }))} placeholder="Notification title" className="w-full rounded border border-divider bg-surface-hover px-3 py-2 text-sm text-primary" />
          <textarea required maxLength={2000} value={broadcast.body} onChange={(event) => setBroadcast((current) => ({ ...current, body: event.target.value }))} placeholder="Message" className="min-h-28 w-full rounded border border-divider bg-surface-hover px-3 py-2 text-sm text-primary" />
          <input value={broadcast.link} onChange={(event) => setBroadcast((current) => ({ ...current, link: event.target.value }))} placeholder="Optional portal link" className="w-full rounded border border-divider bg-surface-hover px-3 py-2 text-sm text-primary" />
          <button disabled={saving === "broadcast"} className="w-full rounded border border-[#00e676]/50 px-4 py-2 text-sm text-[#00e676] disabled:opacity-50">{saving === "broadcast" ? "Sending..." : "Send in-app notification"}</button>
          <p className="text-xs text-secondary">Email and SMS delivery require separate provider credentials and are not sent by this action.</p>
        </form>
      </div>

      <section className="mt-6 overflow-hidden rounded-lg border border-divider bg-surface">
        <h2 className="border-b border-divider px-5 py-4 text-lg font-medium text-primary">Recent stipend records</h2>
        {stipends.map((item) => (
          <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-divider/60 px-5 py-4 last:border-0 text-sm">
            <span className="font-mono text-secondary">{item.recordId} · {item.period}</span>
            <span className="text-primary">{item.amount} {item.currency}</span>
            <span className="text-secondary">{item.status}</span>
          </div>
        ))}
        {!stipends.length && <p className="p-6 text-sm text-secondary">No stipend records yet.</p>}
      </section>
    </div>
  );
}
