import React, { useState } from "react";
import { useAdmin } from "../../context/AdminContext";

export default function SystemAlerts() {
  const { alertChannels: channels, setAlertChannels, alerts, setAlerts } = useAdmin();

  const toggleChannel = (channel) => {
    setAlertChannels({ ...channels, [channel]: !channels[channel] });
  };

  const toggleAlert = (id) => {
    setAlerts(alerts.map(alert => alert.id === id ? { ...alert, active: !alert.active } : alert));
  };

  return (
    <div className="h-full w-full p-8 overflow-y-auto">
      <div className="flex items-center gap-4 mb-2">
        <i className="ri-alarm-warning-line text-4xl text-secondary"></i>
        <h1 className="text-3xl font-semibold">System Alerts</h1>
      </div>
      <p className="text-secondary text-sm mb-8">
        Configure automated security notifications and delivery channels.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Delivery Channels */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-surface border border-divider rounded-xl p-6">
            <h2 className="text-lg font-medium text-primary mb-6 border-b border-divider pb-2">Delivery Channels</h2>
            
            <div className="space-y-6">
              {/* Channel Toggle Item */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <i className="ri-mail-send-line text-xl text-secondary"></i>
                  <div>
                    <h4 className="text-sm text-gray-200 font-medium">Email Notifications</h4>
                    <p className="text-xs text-secondary">admin@alpha.com</p>
                  </div>
                </div>
                <div className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${channels.email ? 'bg-[#00e676]' : 'bg-gray-700'}`} onClick={() => toggleChannel('email')}>
                  <div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-transform ${channels.email ? 'translate-x-6' : 'translate-x-1'}`}></div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <i className="ri-smartphone-line text-xl text-secondary"></i>
                  <div>
                    <h4 className="text-sm text-gray-200 font-medium">SMS Alerts</h4>
                    <p className="text-xs text-secondary">+1 (555) 019-2041</p>
                  </div>
                </div>
                <div className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${channels.sms ? 'bg-[#00e676]' : 'bg-gray-700'}`} onClick={() => toggleChannel('sms')}>
                  <div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-transform ${channels.sms ? 'translate-x-6' : 'translate-x-1'}`}></div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <i className="ri-notification-3-line text-xl text-secondary"></i>
                  <div>
                    <h4 className="text-sm text-gray-200 font-medium">Dashboard Toasts</h4>
                    <p className="text-xs text-secondary">In-app push notifications</p>
                  </div>
                </div>
                <div className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${channels.dashboard ? 'bg-[#00e676]' : 'bg-gray-700'}`} onClick={() => toggleChannel('dashboard')}>
                  <div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-transform ${channels.dashboard ? 'translate-x-6' : 'translate-x-1'}`}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Alert Triggers */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface border border-divider rounded-xl p-6">
            <h2 className="text-lg font-medium text-primary mb-6 border-b border-divider pb-2">Event Triggers</h2>
            
            <div className="space-y-4">
              {alerts.map((alert) => (
                <div key={alert.id} className="bg-surface-hover border border-divider/50 p-4 rounded-lg flex items-center justify-between hover:border-gray-700 transition-colors">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="text-sm font-medium text-gray-200">{alert.name}</h4>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase 
                        ${alert.severity === 'High' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 
                          alert.severity === 'Medium' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' : 
                          'bg-blue-500/10 text-blue-500 border border-blue-500/20'}`}
                      >
                        {alert.severity}
                      </span>
                    </div>
                    <p className="text-xs text-secondary">{alert.desc}</p>
                  </div>
                  
                  <div className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${alert.active ? 'bg-[#00e676]' : 'bg-gray-700'}`} onClick={() => toggleAlert(alert.id)}>
                    <div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-transform ${alert.active ? 'translate-x-6' : 'translate-x-1'}`}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}