import { useEffect, useState } from "react";
import adminApi from "../../lib/adminApi";

const emptyPosting = { title: "", domain: "", description: "", mode: "Remote", location: "", durationWeeks: "", openings: "1", status: "draft" };

export default function InternshipPostings() {
  const [postings, setPostings] = useState([]);
  const [form, setForm] = useState(emptyPosting);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    adminApi.listInternships()
      .then((result) => { if (active) setPostings(result.data); })
      .catch((requestError) => { if (active) setError(requestError.message || "Unable to load postings."); });
    return () => { active = false; };
  }, []);

  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const createPosting = async (event) => {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      const result = await adminApi.createInternship({
        ...form,
        durationWeeks: Number(form.durationWeeks) || null,
        openings: Number(form.openings) || 1,
      });
      setPostings((current) => [result.data, ...current]);
      setForm(emptyPosting);
    } catch (requestError) {
      setError(requestError.message || "Unable to create internship posting.");
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (posting) => {
    const status = posting.status === "open" ? "closed" : "open";
    setError("");
    try {
      const result = await adminApi.changeInternshipStatus(posting.id, status);
      setPostings((current) => current.map((item) => item.id === posting.id ? result.data : item));
    } catch (requestError) {
      setError(requestError.message || "Unable to change posting status.");
    }
  };

  return (
    <div className="h-full w-full overflow-y-auto p-8">
      <div className="mb-2 flex items-center gap-4">
        <i className="ri-briefcase-4-line text-4xl text-secondary"></i>
        <h1 className="text-3xl font-semibold">Internship Postings</h1>
      </div>
      <p className="mb-8 text-sm text-secondary">Create and manage opportunities visible to students.</p>
      {error && <p role="alert" className="mb-4 rounded border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}

      <form onSubmit={createPosting} className="mb-8 grid grid-cols-1 gap-3 rounded-lg border border-divider bg-surface p-5 md:grid-cols-2">
        <input required maxLength={160} value={form.title} onChange={(event) => updateField("title", event.target.value)} placeholder="Posting title" className="rounded border border-divider bg-surface-hover px-3 py-2 text-sm text-primary" />
        <input required maxLength={100} value={form.domain} onChange={(event) => updateField("domain", event.target.value)} placeholder="Domain" className="rounded border border-divider bg-surface-hover px-3 py-2 text-sm text-primary" />
        <textarea required maxLength={10000} value={form.description} onChange={(event) => updateField("description", event.target.value)} placeholder="Description" className="min-h-24 rounded border border-divider bg-surface-hover px-3 py-2 text-sm text-primary md:col-span-2" />
        <input value={form.mode} onChange={(event) => updateField("mode", event.target.value)} placeholder="Mode" className="rounded border border-divider bg-surface-hover px-3 py-2 text-sm text-primary" />
        <input value={form.location} onChange={(event) => updateField("location", event.target.value)} placeholder="Location" className="rounded border border-divider bg-surface-hover px-3 py-2 text-sm text-primary" />
        <input type="number" min="1" value={form.durationWeeks} onChange={(event) => updateField("durationWeeks", event.target.value)} placeholder="Duration (weeks)" className="rounded border border-divider bg-surface-hover px-3 py-2 text-sm text-primary" />
        <input type="number" min="1" value={form.openings} onChange={(event) => updateField("openings", event.target.value)} aria-label="Number of openings" className="rounded border border-divider bg-surface-hover px-3 py-2 text-sm text-primary" />
        <select value={form.status} onChange={(event) => updateField("status", event.target.value)} className="rounded border border-divider bg-surface-hover px-3 py-2 text-sm text-primary">
          <option value="draft">Draft</option><option value="open">Open immediately</option>
        </select>
        <button disabled={saving} className="rounded bg-[#00e676] px-4 py-2 text-sm font-semibold text-black disabled:opacity-50">{saving ? "Creating..." : "Create posting"}</button>
      </form>

      <div className="overflow-hidden rounded-lg border border-divider bg-surface">
        {postings.map((posting) => (
          <div key={posting.id} className="flex flex-wrap items-center justify-between gap-4 border-b border-divider/60 p-5 last:border-0">
            <div>
              <h2 className="font-medium text-primary">{posting.title}</h2>
              <p className="mt-1 text-xs text-secondary">{posting.domain} · {posting.mode || "Mode not set"} · {posting.openings || 1} opening(s)</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded border border-divider px-2 py-1 text-xs uppercase text-secondary">{posting.status}</span>
              <button type="button" onClick={() => changeStatus(posting)} disabled={posting.status === "archived"} className="rounded border border-divider px-3 py-1.5 text-xs text-primary hover:border-[#00e676] disabled:opacity-50">
                {posting.status === "open" ? "Close" : "Open"}
              </button>
            </div>
          </div>
        ))}
        {!postings.length && <p className="p-8 text-center text-sm text-secondary">No internship postings yet.</p>}
      </div>
    </div>
  );
}
