import React, { useState } from "react";

export default function NLPKeywordMapping() {
  const [intents, setIntents] = useState([
    {
      id: "INT-01",
      name: "Generate Document",
      systemAction: "CREATE_DOC",
      keywords: ["generate", "create", "make", "issue certificate", "new id"],
      newKeyword: ""
    },
    {
      id: "INT-02",
      name: "Revoke Access",
      systemAction: "REVOKE_DOC",
      keywords: ["revoke", "delete", "remove", "cancel access", "terminate"],
      newKeyword: ""
    },
    {
      id: "INT-03",
      name: "System Query",
      systemAction: "FETCH_LOGS",
      keywords: ["show logs", "get history", "what happened", "audit trail"],
      newKeyword: ""
    }
  ]);

  const handleAddKeyword = (index, e) => {
    e.preventDefault();
    const intent = intents[index];
    if (intent.newKeyword.trim() !== "" && !intent.keywords.includes(intent.newKeyword.toLowerCase())) {
      const updatedIntents = [...intents];
      updatedIntents[index].keywords.push(intent.newKeyword.toLowerCase());
      updatedIntents[index].newKeyword = "";
      setIntents(updatedIntents);
    }
  };

  const handleRemoveKeyword = (intentIndex, keywordIndex) => {
    const updatedIntents = [...intents];
    updatedIntents[intentIndex].keywords.splice(keywordIndex, 1);
    setIntents(updatedIntents);
  };

  return (
    <div className="h-full w-full p-8 overflow-y-auto">
      <div className="flex items-center gap-4 mb-2">
        <i className="ri-brain-line text-4xl text-gray-400"></i>
        <h1 className="text-3xl font-semibold">NLP Keyword Mapping</h1>
      </div>
      <p className="text-gray-500 text-sm mb-8">
        Train the AI Command Center by mapping natural language keywords to specific system actions.
      </p>

      <div className="space-y-6">
        {intents.map((intent, intentIndex) => (
          <div key={intent.id} className="bg-[#0c0d12] border border-gray-800/80 rounded-xl p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-medium text-white flex items-center gap-2">
                  {intent.name}
                </h3>
                <p className="text-xs text-gray-500 font-mono mt-1">Action: {intent.systemAction}</p>
              </div>
              <button className="text-gray-500 hover:text-red-500 transition-colors">
                <i className="ri-delete-bin-line"></i>
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {intent.keywords.map((keyword, kwIndex) => (
                <span 
                  key={kwIndex} 
                  className="bg-[#13151c] border border-gray-700 text-gray-300 px-3 py-1.5 rounded-md text-xs flex items-center gap-2"
                >
                  {keyword}
                  <button 
                    onClick={() => handleRemoveKeyword(intentIndex, kwIndex)}
                    className="text-gray-500 hover:text-red-500 focus:outline-none"
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
                value={intent.newKeyword}
                onChange={(e) => {
                  const updatedIntents = [...intents];
                  updatedIntents[intentIndex].newKeyword = e.target.value;
                  setIntents(updatedIntents);
                }}
                className="w-full bg-[#13151c] border border-gray-800 rounded-lg py-2 pl-3 pr-10 text-sm focus:outline-none focus:border-[#00e676]/50 transition-colors"
              />
              <button 
                type="submit" 
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#00e676] transition-colors"
              >
                <i className="ri-add-line"></i>
              </button>
            </form>
          </div>
        ))}
      </div>
      
      <button className="mt-6 bg-[#1a1c26] border border-gray-700 hover:border-[#00e676]/50 text-gray-300 hover:text-[#00e676] px-6 py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 w-full border-dashed">
        <i className="ri-add-circle-line"></i> Create New Intent Mapping
      </button>
    </div>
  );
}