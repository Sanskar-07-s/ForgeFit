// ForgeFit AI - Admin Operations Console & Error Monitoring Page (v4.3)

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useFitnessData } from '../context/FitnessDataContext';
import { errorMonitor } from '../services/error-monitor';
import { notifications } from '../services/notifications';
import { 
  ShieldAlert, 
  Terminal, 
  Users, 
  Megaphone, 
  AlertCircle, 
  Settings,
  Flame,
  CheckCircle,
  Database
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AuditRecord {
  id: string;
  action: string;
  user: string;
  time: string;
  details: string;
}

export default function Admin() {
  const { profile } = useAuth();
  const { loadAllData } = useFitnessData();

  // Load diagnostic logs from our Error Monitoring Service
  const [errorLogs, setErrorLogs] = useState(() => errorMonitor.getLogs());

  // Local simulated audits to maintain a high-quality console view
  const [audits, setAudits] = useState<AuditRecord[]>([
    { id: 'a-1', action: 'UPDATE_PROFILE', user: profile?.name || 'Admin', time: new Date(Date.now() - 600000).toISOString(), details: 'Calibrated targets to Build Muscle' },
    { id: 'a-2', action: 'UNLOCK_ACHIEVEMENT', user: profile?.name || 'Admin', time: new Date(Date.now() - 1200000).toISOString(), details: 'Unlocked Centurion Lifter badge' },
    { id: 'a-3', action: 'SYNC_QUEUE_PROCESSED', user: 'System Sync Node', time: new Date(Date.now() - 1800000).toISOString(), details: 'Synced 3 pending offline database inserts' },
  ]);

  // Alert broadcasting state
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcasting, setBroadcasting] = useState(false);

  const handleClearErrors = () => {
    errorMonitor.clearLogs();
    setErrorLogs([]);
    confetti({ particleCount: 20, colors: ['#10b981'] });
  };

  const handleBroadcastAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) return;

    setBroadcasting(true);
    // Broadcast notification locally
    await notifications.sendNotification(
      'all-users',
      `🚨 SYSTEM BROADCAST: ${broadcastTitle}`,
      broadcastMessage,
      'system'
    );

    // Insert audit log
    const audit: AuditRecord = {
      id: 'a-' + Math.random().toString(36).substring(2, 9),
      action: 'BROADCAST_ALERT',
      user: profile?.name || 'Admin',
      time: new Date().toISOString(),
      details: `Title: ${broadcastTitle}`,
    };
    setAudits(prev => [audit, ...prev]);

    setBroadcastTitle('');
    setBroadcastMessage('');
    setBroadcasting(false);
    confetti({ particleCount: 50, spread: 80, colors: ['#ef4444', '#7c3aed'] });
  };

  // Mock User directories list
  const userDirectory = [
    { name: profile?.name || 'Admin', email: 'admin@forgefit.ai', tier: 'Pro', registered: 'June 1, 2026' },
    { name: 'David Goggins', email: 'goggins@dontknowme.com', tier: 'Coach', registered: 'May 14, 2026' },
    { name: 'Sarah Connor', email: 'connor@judgmentday.net', tier: 'Free', registered: 'June 10, 2026' },
  ];

  return (
    <div className="space-y-6">
      
      <div className="flex items-center gap-2 border-b border-white/5 pb-4">
        <ShieldAlert className="w-6 h-6 text-red-500" />
        <div>
          <h2 className="text-2xl font-extrabold text-white">Administrative Operations Console</h2>
          <p className="text-xs text-slate-400">Review system exceptions, broadcast notifications, and view audit events</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Error Monitor Boundary Logs */}
        <div className="glass-panel p-6 rounded-3xl border border-white/5 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Terminal className="w-4 h-4 text-red-500" /> System Diagnostics (Error boundaries logs)
            </h3>
            {errorLogs.length > 0 && (
              <button 
                onClick={handleClearErrors}
                className="text-[10px] text-red-400 font-bold hover:underline"
              >
                Clear Log List
              </button>
            )}
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {errorLogs.map((log) => (
              <div key={log.id} className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl text-xs space-y-1">
                <div className="flex justify-between items-center text-[10px] text-slate-500">
                  <span className="font-bold uppercase tracking-wider text-red-400">{log.error_type}</span>
                  <span>{new Date(log.created_at).toLocaleTimeString()}</span>
                </div>
                <p className="text-slate-300 leading-normal">{log.message}</p>
                {log.stack && (
                  <pre className="text-[9px] text-slate-600 bg-black/40 p-2 rounded-lg overflow-x-auto">
                    {log.stack.slice(0, 150)}...
                  </pre>
                )}
              </div>
            ))}

            {errorLogs.length === 0 && (
              <div className="p-8 text-center text-slate-500 font-semibold text-xs flex flex-col items-center gap-1">
                <CheckCircle className="w-6 h-6 text-emerald-500" />
                <span>Zero system exceptions registered. Application health normal.</span>
              </div>
            )}
          </div>
        </div>

        {/* Global broadcaster tool */}
        <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-4">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-brand-blue" /> Alert Broadcast Broadcaster
          </h3>
          <p className="text-[10px] text-slate-400">Sends a high-priority push alert directly to active user browsers.</p>

          <form onSubmit={handleBroadcastAlert} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-400 font-semibold mb-2">Message Title</label>
              <input 
                type="text" 
                placeholder="e.g. Server Maintenance Operations"
                value={broadcastTitle}
                onChange={e => setBroadcastTitle(e.target.value)}
                className="glass-input"
                required
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-2">Message Body</label>
              <textarea 
                placeholder="Details of warning updates..."
                value={broadcastMessage}
                onChange={e => setBroadcastMessage(e.target.value)}
                className="glass-input h-16 resize-none"
                required
              />
            </div>
            
            <button 
              type="submit"
              disabled={broadcasting}
              className="w-full glass-btn-primary py-2.5 text-xs font-bold disabled:opacity-50"
            >
              {broadcasting ? 'Broadcasting...' : 'Broadcast Alert'}
            </button>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* User directory management */}
        <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-4">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-brand-blue" /> User Profiles Directories
          </h3>

          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {userDirectory.map((usr) => (
              <div key={usr.email} className="p-3 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between gap-4 text-xs">
                <div>
                  <div className="font-bold text-white">{usr.name}</div>
                  <div className="text-[10px] text-slate-500">{usr.email}</div>
                </div>
                <div className="text-right">
                  <span className={`text-[9px] font-bold border px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    usr.tier === 'Coach' ? 'bg-brand-purple/10 text-brand-purple border-brand-purple/20' :
                    usr.tier === 'Pro' ? 'bg-brand-blue/10 text-brand-blue border-brand-blue/20' :
                    'bg-slate-500/10 text-slate-400 border-slate-500/20'
                  }`}>
                    {usr.tier} Tier
                  </span>
                  <div className="text-[9px] text-slate-600 mt-1">Joined: {usr.registered}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Audit event logging panel */}
        <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-4">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <Database className="w-4 h-4 text-brand-blue" /> System Operations Auditing Logs
          </h3>

          <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
            {audits.map((a) => (
              <div key={a.id} className="p-3 bg-white/5 border border-white/5 rounded-xl text-xs space-y-1">
                <div className="flex justify-between items-center text-[9px] text-slate-500">
                  <span className="font-bold uppercase tracking-wider text-brand-purple">{a.action}</span>
                  <span>{new Date(a.time).toLocaleTimeString()}</span>
                </div>
                <p className="text-slate-300 font-medium">{a.details}</p>
                <div className="text-[9px] text-slate-600">Actor: {a.user}</div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
