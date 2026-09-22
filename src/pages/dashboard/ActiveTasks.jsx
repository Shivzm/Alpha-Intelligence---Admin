import React, { useState, useEffect } from "react";

export default function ActiveTasks() {
  // Simulating live background tasks
  const [tasks, setTasks] = useState([
    { id: "TSK-091", name: "Batch Generation: Q3 Certificates", type: "Document AI", status: "Running", progress: 42, timeRemaining: "2m 14s", color: "bg-blue-500" },
    { id: "TSK-092", name: "NLP Intent Model Retraining", type: "AI Engine", status: "Running", progress: 87, timeRemaining: "45s", color: "bg-purple-500" },
    { id: "TSK-093", name: "System Snapshot / Backup", type: "Database", status: "Queued", progress: 0, timeRemaining: "Pending", color: "bg-gray-500" },
    { id: "TSK-090", name: "Purge Expired ID Cards", type: "Maintenance", status: "Completed", progress: 100, timeRemaining: "Done", color: "bg-[#00e676]" },
  ]);

  // Simulate progress bar movement
  useEffect(() => {
    const interval = setInterval(() => {
      setTasks(currentTasks => 
        currentTasks.map(task => {
          if (task.status === "Running" && task.progress < 100) {
            const newProgress = task.progress + Math.floor(Math.random() * 5);
            if (newProgress >= 100) {
              return { ...task, progress: 100, status: "Completed", timeRemaining: "Done", color: "bg-[#00e676]" };
            }
            return { ...task, progress: newProgress };
          }
          return task;
        })
      );
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  const handleCancel = (id) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  return (
    <div className="h-full w-full p-8 overflow-y-auto">
      <div className="flex items-center gap-4 mb-2">
        <i className="ri-list-settings-line text-4xl text-gray-400"></i>
        <h1 className="text-3xl font-semibold">Active Tasks</h1>
      </div>
      <p className="text-gray-500 text-sm mb-8">
        Monitor background workers, batch generation queues, and long-running AI processes.
      </p>

      <div className="bg-[#0c0d12] border border-gray-800/80 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-[#13151c]/50">
          <h2 className="text-lg font-medium text-white flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00e676] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#00e676]"></span>
            </span>
            Live Process Queue
          </h2>
          <button className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1">
            <i className="ri-pause-circle-line"></i> Pause All
          </button>
        </div>

        <div className="divide-y divide-gray-800/50">
          {tasks.map((task) => (
            <div key={task.id} className="p-6 hover:bg-white/[0.01] transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-white font-medium">{task.name}</h3>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider 
                      ${task.status === 'Running' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 
                        task.status === 'Completed' ? 'bg-[#00e676]/10 text-[#00e676] border border-[#00e676]/20' : 
                        'bg-gray-800 text-gray-400 border border-gray-700'}`}>
                      {task.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">ID: <span className="font-mono">{task.id}</span> • Type: {task.type}</p>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 font-mono w-16 text-right">{task.timeRemaining}</span>
                  {task.status !== 'Completed' && (
                    <button 
                      onClick={() => handleCancel(task.id)}
                      className="w-8 h-8 rounded-md bg-[#1a1c26] hover:bg-red-500/10 text-gray-400 hover:text-red-500 border border-gray-700/50 hover:border-red-500/30 transition-colors flex items-center justify-center"
                      title="Cancel Task"
                    >
                      <i className="ri-close-line"></i>
                    </button>
                  )}
                </div>
              </div>

              {/* Progress Bar Container */}
              <div className="flex items-center gap-4">
                <div className="flex-1 bg-gray-800/50 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className={`${task.color} h-1.5 rounded-full transition-all duration-500 ease-out`} 
                    style={{ width: `${task.progress}%` }}
                  ></div>
                </div>
                <span className="text-xs font-mono text-gray-400 w-8">{task.progress}%</span>
              </div>
            </div>
          ))}
          
          {tasks.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              <i className="ri-check-double-line text-4xl mb-3 block opacity-50"></i>
              No active tasks in the queue.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}