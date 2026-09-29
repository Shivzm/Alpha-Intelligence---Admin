import React, { useState, useRef, useEffect } from "react";
import { useAdmin } from "../../context/AdminContext";
import adminApi from "../../lib/adminApi";

export default function CommandInput() {
  const { adminProfile, commandHistory: apiHistory } = useAdmin();
  const [input, setInput] = useState("");
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setHistory(apiHistory.flatMap((command) => [
      { role: "user", text: command.input || "" },
      {
        role: "system",
        text: command.intentId
          ? `Matched ${command.intentId} with ${Math.round((command.confidence || 0) * 100)}% confidence. Proposed action: ${command.proposedAction || "none"}.`
          : "No configured intent matched this command.",
        commandId: command.id,
        status: command.status,
      },
    ]));
  }, [apiHistory]);
  
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
    setHistory((current) => [...current, { role: "user", text: commandText }]);
    setInput("");
    try {
      const result = await adminApi.submitCommand(commandText);
      const command = result.data;
      const message = command.intentId
        ? `Matched ${command.intentId} with ${Math.round((command.confidence || 0) * 100)}% confidence. Proposed action: ${command.proposedAction || "none"}.`
        : "No configured intent matched this command.";
      setHistory((current) => [...current, {
        role: "system",
        text: message,
        commandId: command.id,
        status: command.status,
      }]);
    } catch (requestError) {
      setError(requestError.message || "Unable to submit this command.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateCommand = async (commandId, action) => {
    setError("");
    try {
      const result = action === "confirm"
        ? await adminApi.confirmCommand(commandId)
        : await adminApi.cancelCommand(commandId);
      setHistory((current) => current.map((message) => message.commandId === commandId
        ? { ...message, status: result.data.status, text: action === "confirm" ? "Action executed." : "Command cancelled." }
        : message));
    } catch (requestError) {
      setError(requestError.message || "Unable to update this command.");
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
                {msg.commandId && msg.status === "pending" && (
                  <div className="mt-3 flex gap-2 border-t border-[#00e676]/20 pt-3">
                    <button type="button" onClick={() => updateCommand(msg.commandId, "confirm")} className="rounded bg-[#00e676] px-3 py-1.5 text-xs font-semibold text-black hover:bg-[#00c868]">Confirm action</button>
                    <button type="button" onClick={() => updateCommand(msg.commandId, "cancel")} className="rounded border border-gray-700 px-3 py-1.5 text-xs text-gray-300 hover:text-white">Cancel</button>
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