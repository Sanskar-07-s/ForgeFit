// ForgeFit AI - Central Devices Hub (v5.1)

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from '../components/GlassCard';
import { MotionButton } from '../components/MotionButton';
import { DeviceConnectModal } from '../components/DeviceConnectModal';
import { ManualLogModal } from '../components/ManualLogModal';
import { deviceManager, DeviceRegistryItem } from '../services/device-manager';
import {
  Smartphone,
  CheckCircle,
  XCircle,
  RefreshCw,
  Cpu,
  Zap,
  Battery,
  AlertTriangle,
  FileText,
  Heart,
  Calendar,
  Lock,
  Plus
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function Devices() {
  const [devices, setDevices] = useState<DeviceRegistryItem[]>([]);
  const [routing, setRouting] = useState<Record<string, string>>({});
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [showManualModal, setShowManualModal] = useState(false);
  const [syncingAll, setSyncingAll] = useState(false);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setDevices(deviceManager.getDevices());
    setRouting(deviceManager.getDataSourcesRouting());
  };

  const handleConnectClick = (id: string) => {
    setSelectedDevice(id);
  };

  const handleDisconnect = async (id: string) => {
    await deviceManager.disconnectDevice(id);
    refreshData();
    confetti({ particleCount: 20, spread: 30 });
  };

  const handleSync = async (id: string) => {
    await deviceManager.syncDevice(id);
    refreshData();
  };

  const handleSyncAll = async () => {
    setSyncingAll(true);
    const connected = devices.filter(d => d.status === 'connected');
    for (const d of connected) {
      await deviceManager.syncDevice(d.id);
    }
    refreshData();
    setSyncingAll(false);
    confetti({ particleCount: 50, spread: 50 });
  };

  const handleRouteSource = (metric: string, source: string) => {
    deviceManager.setDataSourceRouting(metric, source);
    refreshData();
  };

  // Helper for rendering badges
  const renderStatusBadge = (status: DeviceRegistryItem['status']) => {
    switch (status) {
      case 'connected':
        return (
          <span className="flex items-center gap-1 text-[10px] font-black uppercase text-brand-emerald bg-brand-emerald/10 border border-brand-emerald/20 px-2 py-0.5 rounded-md">
            <CheckCircle className="w-3 h-3" /> Connected
          </span>
        );
      case 'syncing':
        return (
          <span className="flex items-center gap-1 text-[10px] font-black uppercase text-brand-cyan bg-brand-cyan/10 border border-brand-cyan/20 px-2 py-0.5 rounded-md animate-pulse">
            <RefreshCw className="w-3 h-3 animate-spin" /> Syncing
          </span>
        );
      case 'sync_failed':
        return (
          <span className="flex items-center gap-1 text-[10px] font-black uppercase text-brand-rose bg-brand-rose/10 border border-brand-rose/20 px-2 py-0.5 rounded-md">
            <AlertTriangle className="w-3 h-3" /> Sync Failed
          </span>
        );
      case 'integration_not_configured':
        return (
          <span className="flex items-center gap-1 text-[10px] font-black uppercase text-slate-500 bg-white/5 border border-white/5 px-2 py-0.5 rounded-md" title="API Credentials not setup in env">
            <Lock className="w-3 h-3" /> Config Required
          </span>
        );
      case 'connecting':
        return (
          <span className="flex items-center gap-1 text-[10px] font-black uppercase text-brand-purple bg-brand-purple/10 border border-brand-purple/20 px-2 py-0.5 rounded-md animate-pulse">
            Connecting...
          </span>
        );
      case 'not_connected':
      default:
        return (
          <span className="text-[10px] font-black uppercase text-slate-500 bg-white/5 border border-white/5 px-2 py-0.5 rounded-md">
            Not Connected
          </span>
        );
    }
  };

  const activeConnectedCount = devices.filter(d => d.status === 'connected').length;

  return (
    <div className="space-y-6 animate-fade-in" role="region" aria-label="Devices Hub">
      {/* Welcome Banner */}
      <GlassCard className="p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-6" glowColor="#8B5CF6">
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs text-brand-purple font-bold uppercase tracking-wider">
            <Cpu className="w-4 h-4" /> Device Connections & Trust Hub
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">Manage Fitness Wearables</h1>
          <p className="text-xs text-slate-500 max-w-xl">
            Audit API credentials, link smartwatches, customize biometric data sources, and log parameters manually.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <MotionButton onClick={() => setShowManualModal(true)} variant="secondary" size="md">
            <Plus className="w-4 h-4" /> Manual Log Entry
          </MotionButton>
          <MotionButton
            onClick={handleSyncAll}
            disabled={syncingAll || activeConnectedCount === 0}
            variant="primary"
            size="md"
          >
            <RefreshCw className={`w-4 h-4 ${syncingAll ? 'animate-spin' : ''}`} /> Sync All
          </MotionButton>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Device Cards Grid */}
        <div className="lg:col-span-2 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Available Integrations</h3>
            <p className="text-xs text-slate-500 mt-0.5">Link cloud platforms or local Bluetooth devices</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {devices.map((dev) => {
              const isNotConfigured = dev.status === 'integration_not_configured';
              const isConnected = dev.status === 'connected';
              const isSyncing = dev.status === 'syncing';
              return (
                <GlassCard
                  key={dev.id}
                  className={`p-5 rounded-2xl flex flex-col justify-between space-y-4 border transition-all duration-300 ${
                    isConnected ? 'border-brand-cyan/20 bg-brand-cyan/[0.02]' : 'border-white/5'
                  }`}
                  glowColor={isConnected ? '#22D3EE' : '#8B5CF6'}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex gap-3 items-center">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-xl">
                          {dev.id === 'apple-watch' || dev.id === 'wear-os' || dev.id === 'bluetooth-wear' ? '⌚' : '🔌'}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-white text-sm">{dev.name}</h4>
                          <span className="text-[9px] text-slate-500 capitalize">{dev.category.replace('_', ' ')}</span>
                        </div>
                      </div>
                      {renderStatusBadge(dev.status)}
                    </div>

                    {/* Metadata specs */}
                    {(dev.batteryPct !== null || dev.firmwareVersion !== null || dev.lastSynced !== null) && (
                      <div className="bg-white/[0.02] p-2.5 rounded-xl border border-white/5 text-[10px] text-slate-400 space-y-1">
                        {dev.lastSynced && (
                          <div className="flex justify-between">
                            <span>Last Sync:</span>
                            <span className="font-semibold text-white">
                              {new Date(dev.lastSynced).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        )}
                        {dev.batteryPct !== null && (
                          <div className="flex justify-between items-center">
                            <span>Battery:</span>
                            <span className="font-semibold text-white flex items-center gap-1">
                              <Battery className="w-3 h-3 text-brand-emerald" /> {dev.batteryPct}%
                            </span>
                          </div>
                        )}
                        {dev.firmwareVersion && (
                          <div className="flex justify-between">
                            <span>Firmware:</span>
                            <span className="font-semibold text-slate-400">{dev.firmwareVersion}</span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="space-y-1">
                      <span className="text-[9px] uppercase font-bold text-slate-500">Available Metrics</span>
                      <div className="flex flex-wrap gap-1 text-[9px] font-semibold text-slate-400">
                        {dev.availableMetrics.join(' • ')}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex gap-2">
                    {isConnected ? (
                      <>
                        <MotionButton onClick={() => handleSync(dev.id)} disabled={isSyncing} variant="secondary" size="sm" className="flex-1 py-1.5 text-xs">
                          Sync Now
                        </MotionButton>
                        <MotionButton onClick={() => handleDisconnect(dev.id)} variant="danger" size="sm" className="py-1.5 text-xs text-brand-rose">
                          Disconnect
                        </MotionButton>
                      </>
                    ) : (
                      <MotionButton
                        onClick={() => handleConnectClick(dev.id)}
                        disabled={isNotConfigured}
                        variant="primary"
                        size="sm"
                        fullWidth
                        className="py-1.5 text-xs"
                      >
                        {isNotConfigured ? 'API Config Required' : 'Connect'}
                      </MotionButton>
                    )}
                  </div>
                </GlassCard>
              );
            })}
          </div>
        </div>

        {/* Central Data Routing & Manual Entry Details */}
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Metrics Routing</h3>
            <p className="text-xs text-slate-500 mt-0.5">Assign data streams to connected sources</p>
          </div>

          <GlassCard className="p-5 rounded-2xl space-y-4" glowColor="#8B5CF6">
            <div className="divide-y divide-white/5 space-y-3">
              {[
                { key: 'heartrate',   label: 'Heart Rate',   icon: Heart },
                { key: 'sleep',       label: 'Sleep Quality',icon: Calendar },
                { key: 'steps',       label: 'Steps Count',  icon: Zap },
                { key: 'calories',    label: 'Calories',     icon: Zap },
                { key: 'recovery',    label: 'Recovery Score',icon: Heart },
              ].map((item, idx) => {
                const currentSource = routing[item.key] || 'None';
                // Find connected devices offering this metric
                const eligibleDevices = devices.filter(
                  d => d.status === 'connected' && d.availableMetrics.includes(item.label)
                );

                return (
                  <div key={item.key} className={`flex flex-col gap-2 ${idx > 0 ? 'pt-3' : ''}`}>
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <item.icon className="w-3.5 h-3.5 text-brand-purple" /> {item.label}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase ${
                        currentSource === 'None'
                          ? 'bg-slate-800 text-slate-500'
                          : currentSource === 'Manual Entry'
                          ? 'bg-brand-cyan/15 text-brand-cyan border border-brand-cyan/25'
                          : 'bg-brand-emerald/10 text-brand-emerald border border-brand-emerald/20'
                      }`}>
                        {currentSource}
                      </span>
                    </div>

                    {eligibleDevices.length > 0 && (
                      <select
                        value={currentSource}
                        onChange={e => handleRouteSource(item.key, e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-[11px] text-slate-300 focus:outline-none focus:border-brand-purple/40"
                      >
                        <option value="None" className="bg-dark-bg text-white">None (Disabled)</option>
                        {eligibleDevices.map(d => (
                          <option key={d.id} value={d.name} className="bg-dark-bg text-white">{d.name}</option>
                        ))}
                      </select>
                    )}
                  </div>
                );
              })}
            </div>
          </GlassCard>

          {/* Environmental Keys Status card */}
          <GlassCard className="p-5 rounded-2xl space-y-3" glowColor="#EF4444">
            <h4 className="font-extrabold text-white text-xs uppercase tracking-wider">Integrations Health</h4>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              ForgeFit AI checks configured credentials securely in the local context.
            </p>
            <div className="space-y-2 text-[10px] text-slate-400">
              <div className="flex justify-between items-center">
                <span>Fitbit Auth Keys:</span>
                <span className={devices.find(d => d.id === 'fitbit')?.status !== 'integration_not_configured' ? 'text-brand-emerald font-bold' : 'text-slate-600 font-semibold'}>
                  {devices.find(d => d.id === 'fitbit')?.status !== 'integration_not_configured' ? 'Configured' : 'Missing'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Google Fit Keys:</span>
                <span className={devices.find(d => d.id === 'google-fit')?.status !== 'integration_not_configured' ? 'text-brand-emerald font-bold' : 'text-slate-600 font-semibold'}>
                  {devices.find(d => d.id === 'google-fit')?.status !== 'integration_not_configured' ? 'Configured' : 'Missing'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Garmin connect SDK:</span>
                <span className={devices.find(d => d.id === 'garmin')?.status !== 'integration_not_configured' ? 'text-brand-emerald font-bold' : 'text-slate-600 font-semibold'}>
                  {devices.find(d => d.id === 'garmin')?.status !== 'integration_not_configured' ? 'Configured' : 'Missing'}
                </span>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Connect Wizard Modal */}
      <AnimatePresence>
        {selectedDevice && (
          <DeviceConnectModal
            deviceId={selectedDevice}
            onClose={() => setSelectedDevice(null)}
            onConnected={refreshData}
          />
        )}
      </AnimatePresence>

      {/* Manual logger modal */}
      <AnimatePresence>
        {showManualModal && (
          <ManualLogModal
            onClose={() => setShowManualModal(false)}
            onLogged={refreshData}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
