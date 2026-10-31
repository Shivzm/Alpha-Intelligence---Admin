import { useState, useRef, useEffect, useMemo } from "react";
import { useAdmin } from "../../context/AdminContext";
import adminApi from "../../lib/adminApi";

export default function CommandInput() {
  const { adminProfile, commandHistory: apiHistory } = useAdmin();
  const [input, setInput] = useState("");
  const [localHistory, setLocalHistory] = useState([]);
  const [historyOverrides, setHistoryOverrides] = useState({});
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updatingCommand, setUpdatingCommand] = useState("");

  const history = useMemo(() => [
    ...apiHistory.flatMap((command) => [
      { role: "user", text: command.input || "" },
      {
        role: "system",
        text: command.intentId
          ? `Matched ${command.intentId} with ${Math.round((command.confidence || 0) * 100)}% confidence. Proposed action: ${command.proposedAction || "none"}.`
          : "No configured intent matched this command.",
        commandId: command.id,
        status: command.status,
      },
    ]),
    ...localHistory,
  ].map((message) => historyOverrides[message.commandId]
    ? { ...message, ...historyOverrides[message.commandId] }
    : message), [apiHistory, historyOverrides, localHistory]);
  
  const endOfMessagesRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const commandText = input.trim();
    if (!commandText || isSubmitting) return;

    setError("");
    setIsSubmitting(true);
    setLocalHistory((current) => [...current, { role: "user", text: commandText }]);
    setInput("");
    try {
      const analysis = await adminApi.analyzeCommand(commandText);
      const result = await adminApi.submitCommand(commandText);
      const command = result.data;
      const message = command.intentId
        ? `Matched ${command.intentId} with ${Math.round((command.confidence || 0) * 100)}% confidence. Proposed action: ${command.proposedAction || "none"}.`
        : "No configured intent matched this command.";
      setLocalHistory((current) => [...current, {
        role: "system",
        text: message,
        commandId: command.id,
        status: command.status,
        nlpResult: analysis.data.result,
      }]);
    } catch (requestError) {
      setError(requestError.message || "Unable to submit this command.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateCommand = async (commandId, action) => {
    setError("");
    setUpdatingCommand(commandId);
    try {
      const result = action === "confirm"
        ? await adminApi.confirmCommand(commandId)
        : await adminApi.cancelCommand(commandId);
      setHistoryOverrides((current) => ({
        ...current,
        [commandId]: {
          status: result.data.status,
          text: action === "confirm" ? "Action executed." : "Command cancelled.",
        },
      }));
    } catch (requestError) {
      setError(requestError.message || "Unable to update this command.");
      try {
        const latest = await adminApi.getCommand(commandId);
        setHistoryOverrides((current) => ({
          ...current,
          [commandId]: { ...current[commandId], status: latest.data.status },
        }));
      } catch (refreshError) {
        setError(`${requestError.message || "Unable to update this command."} Current command status could not be refreshed: ${refreshError.message}`);
      }
    } finally {
      setUpdatingCommand("");
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-base">
      {/* Header */}
      <div className="px-8 py-6 border-b border-divider/60 bg-surface/90 backdrop-blur-md z-10">
        <div className="flex items-center gap-4">
          <i className="ri-terminal-window-line text-3xl text-[#00e676]"></i>
          <div>
            <h1 className="text-2xl font-semibold text-primary mb-1">Command Input</h1>
            <p className="text-secondary text-xs font-mono flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00e676]"></span>
              Server-side intent matching
            </p>
          </div>
        </div>
      </div>

      {/* Terminal History Space */}
      <div className="flex-1 overflow-y-auto p-8 space-y-6">
        {history.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex max-w-[80%] gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              
              {/* Avatar */}
              <div className="shrink-0 mt-1">
                {msg.role === 'user' ? (
                  <img src={adminProfile.avatar} alt="Admin" className="w-8 h-8 rounded-full border border-gray-700 object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center">
                    <div className="w-4 h-4 bg-gradient-to-tr from-[#00e676] to-blue-500 clip-star rotate-45"></div>
                  </div>
                )}
              </div>

              {/* Message Bubble */}
              <div className={`p-4 rounded-xl text-sm ${
                msg.role === 'user' 
                  ? 'bg-gray-800/80 text-gray-200 border border-gray-700/50' 
                  : 'bg-[#00e676]/5 text-[#00e676] border border-[#00e676]/20 font-mono shadow-[0_0_15px_rgba(0,230,118,0.05)]'
              }`}>
                {msg.text}
                {msg.nlpResult && (
                  <div className="mt-3 border-t border-[#00e676]/20 pt-3 text-xs">
                    <p className="font-semibold">Advisory NLP preview</p>
                    <p>Intent: {msg.nlpResult.intent} ({Math.round((msg.nlpResult.intentConfidence || 0) * 100)}%)</p>
                    <p>Skills: {msg.nlpResult.filters.skills.join(", ") || "none detected"}</p>
                    <p>Status filter: {msg.nlpResult.filters.status || "none"}</p>
                    <p>Department filter: {msg.nlpResult.filters.department || "none"}</p>
                    <p className="mt-1 text-secondary">{msg.nlpResult.answer}</p>
                    <p className="mt-1 text-secondary">NLP did not search applicant records or execute an action.</p>
                  </div>
                )}
                {msg.commandId && <p className="mt-2 text-[10px] uppercase tracking-wide text-secondary">Command status: {msg.status}</p>}
                {msg.commandId && msg.status === "pending" && (
                  <div className="mt-3 flex gap-2 border-t border-[#00e676]/20 pt-3">
                    <button type="button" disabled={updatingCommand === msg.commandId} onClick={() => updateCommand(msg.commandId, "confirm")} className="rounded bg-[#00e676] px-3 py-1.5 text-xs font-semibold text-black hover:bg-[#00c868] disabled:opacity-50">Confirm action</button>
                    <button type="button" disabled={updatingCommand === msg.commandId} onClick={() => updateCommand(msg.commandId, "cancel")} className="rounded border border-gray-700 px-3 py-1.5 text-xs text-gray-300 hover:text-white disabled:opacity-50">Cancel</button>
                  </div>
                )}
              </div>

            </div>
          </div>
        ))}
        <div ref={endOfMessagesRef} />
      </div>

      {/* Input Area */}
      <div className="p-6 border-t border-divider/60 bg-surface">
        {error && <p role="alert" className="mx-auto mb-3 max-w-4xl rounded border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">{error}</p>}
        <form onSubmit={handleSubmit} className="relative max-w-4xl mx-auto">
          <i className="ri-arrow-right-s-line absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-[#00e676]"></i>
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isSubmitting}
            placeholder="Enter natural language command (e.g., 'Generate certificates for pending interns')..."
            className="w-full bg-surface-hover border border-gray-700 hover:border-gray-600 focus:border-[#00e676]/80 rounded-xl py-4 pl-12 pr-16 text-sm text-gray-200 focus:outline-none transition-colors shadow-inner"
            autoFocus
          />
          <button 
            type="submit"
            disabled={!input.trim() || isSubmitting}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-[#00e676] hover:bg-[#00c868] text-black w-10 h-10 rounded-full flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i className="ri-arrow-up-line text-lg"></i>
          </button>
        </form>
        <p className="text-center text-[10px] text-gray-600 mt-3 font-mono">
          Commands are proposed first; supported actions require confirmation.
        </p>
      </div>
    </div>
  );
}