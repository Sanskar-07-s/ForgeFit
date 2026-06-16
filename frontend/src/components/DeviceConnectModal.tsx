// ForgeFit AI - Device Connection Wizard Modal (v5.1)

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, Shield, Key, RefreshCw, Cpu } from 'lucide-react';
import { MotionButton } from './MotionButton';
import { deviceManager, DeviceRegistryItem } from '../services/device-manager';

interface Props {
  deviceId: string | null;
  onClose: () => void;
  onConnected: () => void;
}

type Step = 'connect' | 'permissions' | 'verifying' | 'success';

export const DeviceConnectModal: React.FC<Props> = ({ deviceId, onClose, onConnected }) => {
  const [device, setDevice] = useState<DeviceRegistryItem | null>(null);
  const [step, setStep] = useState<Step>('connect');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (deviceId) {
      const devs = deviceManager.getDevices();
      const target = devs.find(d => d.id === deviceId);
      if (target) {
        setDevice(target);
        if (target.status === 'integration_not_configured') {
          setError('Integration API Credentials not found. Please setup environment variables.');
        } else {
          setError(null);
        }
      }
    }
  }, [deviceId]);

  if (!deviceId || !device) return null;

  const handleGrantPermissions = () => {
    setStep('verifying');
    setTimeout(() => {
      handleCompleteSync();
    }, 1500);
  };

  const handleCompleteSync = async () => {
    const success = await deviceManager.connectDevice(device.id);
    if (success) {
      setStep('success');
    } else {
      setError('Connection sync failed. Verify permissions or API status.');
      setStep('connect');
    }
  };

  const handleFinish = () => {
    onConnected();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />

      <motion.div
        className="glass-panel w-full max-w-md p-6 relative rounded-3xl overflow-hidden border border-white/10 z-10 text-center"
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        <AnimatePresence mode="wait">
          {step === 'connect' && (
            <motion.div
              key="connect"
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 15 }}
              className="space-y-5 py-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-brand-cyan/10 border border-brand-cyan/20 flex items-center justify-center text-2xl mx-auto">
                🔌
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-white">Connect {device.name}</h3>
                <p className="text-xs text-slate-500">
                  Allow ForgeFit AI to establish a secure connection channel.
                </p>
              </div>

              {error ? (
                <div className="bg-brand-rose/10 border border-brand-rose/20 rounded-xl p-3.5 flex items-start gap-2.5 text-left text-xs text-brand-rose">
                  <Key className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-extrabold">Missing Keys</h4>
                    <p className="text-slate-400 mt-0.5">
                      This integration requires credentials (OAuth Client IDs/Secrets) to link correctly. Fill VITE environment properties before connecting.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-white/5 border border-white/5 rounded-xl p-3 text-left space-y-2">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Available Metrics</span>
                  <div className="flex flex-wrap gap-1.5">
                    {device.availableMetrics.map(m => (
                      <span key={m} className="text-[10px] font-semibold bg-white/5 text-slate-300 px-2.5 py-0.5 rounded-full border border-white/5">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2 flex gap-2">
                <MotionButton onClick={onClose} variant="secondary" fullWidth size="md">
                  Cancel
                </MotionButton>
                <MotionButton
                  onClick={() => setStep('permissions')}
                  disabled={!!error}
                  variant="primary"
                  fullWidth
                  size="md"
                >
                  Configure ➜
                </MotionButton>
              </div>
            </motion.div>
          )}

          {step === 'permissions' && (
            <motion.div
              key="permissions"
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 15 }}
              className="space-y-5 py-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-brand-purple/10 border border-brand-purple/20 flex items-center justify-center mx-auto text-brand-purple">
                <Shield className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-white">Permissions Required</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                  ForgeFit AI respects your data privacy. Grant access to synchronize health metrics and local logs.
                </p>
              </div>

              <div className="bg-white/5 rounded-xl p-3 text-left text-xs text-slate-400 space-y-1.5 leading-relaxed">
                <p className="flex items-center gap-2">✔ Read activity telemetry (Steps, Calories)</p>
                <p className="flex items-center gap-2">✔ Read biosensor statistics (Heart Rate, HRV)</p>
                <p className="flex items-center gap-2">✔ Read sleep stages & duration</p>
              </div>

              <div className="pt-2 flex gap-2">
                <MotionButton onClick={() => setStep('connect')} variant="secondary" fullWidth size="md">
                  Back
                </MotionButton>
                <MotionButton onClick={handleGrantPermissions} variant="primary" fullWidth size="md">
                  Authorize Sync
                </MotionButton>
              </div>
            </motion.div>
          )}

          {step === 'verifying' && (
            <motion.div
              key="verifying"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4 py-8"
            >
              <RefreshCw className="w-10 h-10 text-brand-cyan animate-spin mx-auto" />
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-white">Verifying Synchronization</h3>
                <p className="text-xs text-slate-500">Exchanging API access keys and loading metrics...</p>
              </div>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-5 py-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-brand-emerald/10 border border-brand-emerald/20 flex items-center justify-center text-brand-emerald mx-auto animate-bounce">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-white">Device Connected!</h3>
                <p className="text-xs text-slate-500">
                  {device.name} is now connected. Metrics will sync automatically.
                </p>
              </div>

              <MotionButton onClick={handleFinish} variant="primary" fullWidth size="md">
                View Metrics
              </MotionButton>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
