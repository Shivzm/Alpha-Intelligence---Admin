import React, { useState, useRef, useEffect } from "react";
import { useAdmin } from "../../context/AdminContext";

export default function CommandInput() {
  const { adminProfile } = useAdmin();
  const [input, setInput] = useState("");
  const [history, setHistory] = useState([
    { role: "system", text: "Alpha Engine v2.4 initialized. Natural Language Processor is online. How can I assist you today?" }
  ]);
  
  const endOfMessagesRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add User Command
    const userMsg = { role: "user", text: input };
    setHistory(prev => [...prev, userMsg]);
    setInput("");

    // Simulate AI Processing & Response
    setTimeout(() => {
      let aiResponse = "Command parsed. Executing system sequence...";
      
      const lowerInput = userMsg.text.toLowerCase();
      if (lowerInput.includes("generate") || lowerInput.includes("create")) {
        aiResponse = "Operation successful. 42 documents generated and pushed to Document Vault.";
      } else if (lowerInput.includes("revoke") || lowerInput.includes("delete")) {
        aiResponse = "Action confirmed. Credentials revoked and access terminated.";
      } else if (lowerInput.includes("status") || lowerInput.includes("health")) {
        aiResponse = "All systems operational. Latency is 42ms. Active DB connections: 14.";
      } else {
        aiResponse = "Intent unrecognized. Please check NLP mappings or rephrase your command.";
      }

      setHistory(prev => [...prev, { role: "system", text: aiResponse }]);
    }, 1000);
  };

  return (
    <div className="h-full w-full flex flex-col bg-[#07080a]">
      {/* Header */}
      <div className="px-8 py-6 border-b border-gray-800/60 bg-[#0a0b10]/90 backdrop-blur-md z-10">
        <div className="flex items-center gap-4">
          <i className="ri-terminal-window-line text-3xl text-[#00e676]"></i>
          <div>
            <h1 className="text-2xl font-semibold text-white mb-1">Command Input</h1>
            <p className="text-gray-500 text-xs font-mono flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00e676] animate-pulse"></span> 
              NLU Engine Connected
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
              </div>

            </div>
          </div>
        ))}
        <div ref={endOfMessagesRef} />
      </div>

      {/* Input Area */}
      <div className="p-6 border-t border-gray-800/60 bg-[#0a0b10]">
        <form onSubmit={handleSubmit} className="relative max-w-4xl mx-auto">
          <i className="ri-arrow-right-s-line absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-[#00e676]"></i>
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter natural language command (e.g., 'Generate certificates for pending interns')..."
            className="w-full bg-[#13151c] border border-gray-700 hover:border-gray-600 focus:border-[#00e676]/80 rounded-xl py-4 pl-12 pr-16 text-sm text-gray-200 focus:outline-none transition-colors shadow-inner"
            autoFocus
          />
          <button 
            type="submit"
            disabled={!input.trim()}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-[#00e676] hover:bg-[#00c868] text-black w-10 h-10 rounded-full flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i className="ri-arrow-up-line text-lg"></i>
          </button>
        </form>
        <p className="text-center text-[10px] text-gray-600 mt-3 font-mono">
          Model: Alpha-NLU-v2.4 | Press Enter to execute command
        </p>
      </div>
    </div>
  );
}