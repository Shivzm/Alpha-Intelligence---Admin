import React, { useState } from "react";
import { useAdmin } from "../../context/AdminContext";
import adminApi from "../../lib/adminApi";

export default function NLPKeywordMapping() {
  const { intents: apiIntents, setIntents } = useAdmin();
  const [intents, setLocalIntents] = useState([]);
  const [newIntent, setNewIntent] = useState({ name: "", systemAction: "", keywords: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState("");

  React.useEffect(() => setLocalIntents(apiIntents), [apiIntents]);

  const handleAddKeyword = async (index, e) => {
    e.preventDefault();
    const intent = intents[index];
    const keyword = intent.newKeyword?.trim().toLowerCase();
    if (!keyword || intent.keywords.includes(keyword)) return;
    await saveIntent(intent, { keywords: [...intent.keywords, keyword] }, index);
  };

  const saveIntent = async (intent, changes, index) => {
    setError("");
    setSaving(intent.id);
    try {
      const result = await adminApi.updateIntent(intent.id, {
        name: changes.name ?? intent.name,
        systemAction: changes.systemAction ?? intent.systemAction,
        keywords: changes.keywords ?? intent.keywords,
        confidenceMin: changes.confidenceMin ?? intent.confidenceMin,
        enabled: changes.enabled ?? intent.enabled,
      });
      const updatedIntent = { ...result.data, newKeyword: "" };
      setLocalIntents((current) => current.map((item, itemIndex) => itemIndex === index ? updatedIntent : item));
      setIntents((current) => current.map((item) => item.id === intent.id ? updatedIntent : item));
    } catch (requestError) {
      setError(requestError.message || "Unable to update the intent mapping.");
    } finally {
      setSaving("");
    }
  };

  const handleRemoveKeyword = async (intentIndex, keywordIndex) => {
    const intent = intents[intentIndex];
    await saveIntent(intent, { keywords: intent.keywords.filter((_, index) => index !== keywordIndex) }, intentIndex);
  };

  const handleDeleteIntent = async (intent) => {
    setError("");
    setSaving(intent.id);
    try {
      await adminApi.deleteIntent(intent.id);
      setLocalIntents((current) => current.filter((item) => item.id !== intent.id));
      setIntents((current) => current.filter((item) => item.id !== intent.id));
    } catch (requestError) {
      setError(requestError.message || "Unable to delete the intent mapping.");
    } finally {
      setSaving("");
    }
  };

  const handleCreateIntent = async (event) => {
    event.preventDefault();
    const keywords = newIntent.keywords.split(",").map((keyword) => keyword.trim().toLowerCase()).filter(Boolean);
    setError("");
    setSaving("new");
    try {
      const result = await adminApi.createIntent({
        name: newIntent.name.trim(),
        systemAction: newIntent.systemAction.trim(),
        keywords,
        confidenceMin: 0.5,
        enabled: true,
      });
      const createdIntent = { ...result.data, newKeyword: "" };
      setLocalIntents((current) => [...current, createdIntent]);
      setIntents((current) => [...current, createdIntent]);
      setNewIntent({ name: "", systemAction: "", keywords: "" });
    } catch (requestError) {
      setError(requestError.message || "Unable to create the intent mapping.");
    } finally {
      setSaving("");
    }
  };

  return (
    <div className="h-full w-full p-8 overflow-y-auto">
      <div className="flex items-center gap-4 mb-2">
        <i className="ri-brain-line text-4xl text-secondary"></i>
        <h1 className="text-3xl font-semibold">NLP Keyword Mapping</h1>
      </div>
      <p className="text-secondary text-sm mb-8">
        Train the AI Command Center by mapping natural language keywords to specific system actions.
      </p>
      {error && <p role="alert" className="mb-4 rounded border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}

      <div className="space-y-6">
        {intents.map((intent, intentIndex) => (
          <div key={intent.id} className="bg-surface border border-divider rounded-xl p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-medium text-primary flex items-center gap-2">
                  {intent.name}
                </h3>
                <p className="text-xs text-secondary font-mono mt-1">Action: {intent.systemAction}</p>
              </div>
              <button type="button" disabled={saving === intent.id} onClick={() => handleDeleteIntent(intent)} className="text-secondary hover:text-red-500 transition-colors disabled:opacity-50" aria-label={`Delete ${intent.name} intent`}>
                <i className="ri-delete-bin-line"></i>
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {intent.keywords.map((keyword, kwIndex) => (
                <span 
                  key={kwIndex} 
                  className="bg-surface-hover border border-gray-700 text-gray-300 px-3 py-1.5 rounded-md text-xs flex items-center gap-2"
                >
                  {keyword}
                  <button 
                    disabled={saving === intent.id}
                    onClick={() => handleRemoveKeyword(intentIndex, kwIndex)}
                    className="text-secondary hover:text-red-500 focus:outline-none"
                  >
                    <i className="ri-close-line"></i>
                  </button>
                </span>
              ))}
            </div>

            <form onSubmit={(e) => handleAddKeyword(intentIndex, e)} className="relative w-64">
              <input 
                type="text" 
                placeholder="Add new keyword..." 
                value={intent.newKeyword || ""}
                disabled={saving === intent.id}
                onChange={(e) => setLocalIntents((current) => current.map((item, index) => index === intentIndex ? { ...item, newKeyword: e.target.value } : item))}
                className="w-full bg-surface-hover border border-divider rounded-lg py-2 pl-3 pr-10 text-sm focus:outline-none focus:border-[#00e676]/50 transition-colors"
              />
              <button 
                type="submit" 
                className="absolute right-2 top-1/2 -translate-y-1/2 text-secondary hover:text-[#00e676] transition-colors"
              >
                <i className="ri-add-line"></i>
              </button>
            </form>
          </div>
        ))}
      </div>
      
      <form onSubmit={handleCreateIntent} className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3 rounded-lg border border-divider bg-surface p-4">
        <input required value={newIntent.name} onChange={(event) => setNewIntent((current) => ({ ...current, name: event.target.value }))} placeholder="Intent name" className="rounded border border-divider bg-surface-hover px-3 py-2 text-sm text-primary" />
        <input required value={newIntent.systemAction} onChange={(event) => setNewIntent((current) => ({ ...current, systemAction: event.target.value }))} placeholder="System action" className="rounded border border-divider bg-surface-hover px-3 py-2 text-sm text-primary" />
        <input required value={newIntent.keywords} onChange={(event) => setNewIntent((current) => ({ ...current, keywords: event.target.value }))} placeholder="Keywords, comma separated" className="rounded border border-divider bg-surface-hover px-3 py-2 text-sm text-primary" />
        <button disabled={saving === "new"} className="md:col-span-3 bg-[#1a1c26] border border-gray-700 hover:border-[#00e676]/50 text-gray-300 hover:text-[#00e676] px-6 py-3 rounded text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
          <i className="ri-add-circle-line"></i> {saving === "new" ? "Creating..." : "Create Intent Mapping"}
        </button>
      </form>
    </div>
  );
}