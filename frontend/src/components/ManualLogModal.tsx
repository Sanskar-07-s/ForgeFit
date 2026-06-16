// ForgeFit AI - Manual Metric Entry Log Modal (v5.1)

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Save, AlertCircle } from 'lucide-react';
import { MotionButton } from './MotionButton';
import { saveManualLog } from '../services/metric-validator';

interface Props {
  onClose: () => void;
  onLogged: () => void;
}

export const ManualLogModal: React.FC<Props> = ({ onClose, onLogged }) => {
  const [sleepHours, setSleepHours] = useState<number | ''>('');
  const [steps, setSteps]           = useState<number | ''>('');
  const [calories, setCalories]     = useState<number | ''>('');
  const [water, setWater]           = useState<number | ''>('');
  const [weight, setWeight]         = useState<number | ''>('');
  const [workout, setWorkout]       = useState(false);

  const handleSave = () => {
    const payload: any = {};
    if (sleepHours !== '') payload.sleepHours = Number(sleepHours);
    if (steps !== '')      payload.steps = Number(steps);
    if (calories !== '')   payload.caloriesBurned = Number(calories);
    if (water !== '')      payload.waterIntake = Number(water);
    if (weight !== '')     payload.weight = Number(weight);
    payload.workoutCompleted = workout;

    saveManualLog(payload);
    onLogged();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/75 backdrop-blur-md" onClick={onClose} />

      <motion.div
        className="glass-panel w-full max-w-md p-6 relative rounded-3xl overflow-hidden border border-white/10 z-10 text-left space-y-5"
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      >
        <div className="flex justify-between items-center border-b border-white/5 pb-3">
          <div>
            <h3 className="text-base font-black text-white">Manual Metric Logger</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Logged entries will be marked as "Source: Manual Entry"</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3.5 text-xs">
          {/* Weight */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-bold mb-1.5">Weight (kg)</label>
              <input
                type="number"
                placeholder="e.g. 78.5"
                value={weight}
                onChange={e => setWeight(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-brand-cyan/40"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-bold mb-1.5">Sleep Hours</label>
              <input
                type="number"
                step="0.5"
                placeholder="e.g. 7.5"
                value={sleepHours}
                onChange={e => setSleepHours(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-brand-cyan/40"
              />
            </div>
          </div>

          {/* Steps & Calories */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-bold mb-1.5">Steps Today</label>
              <input
                type="number"
                placeholder="e.g. 10000"
                value={steps}
                onChange={e => setSteps(e.target.value === '' ? '' : parseInt(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-brand-cyan/40"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-bold mb-1.5">Burned Calories (kcal)</label>
              <input
                type="number"
                placeholder="e.g. 450"
                value={calories}
                onChange={e => setCalories(e.target.value === '' ? '' : parseInt(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-brand-cyan/40"
              />
            </div>
          </div>

          {/* Water */}
          <div>
            <label className="block text-slate-400 font-bold mb-1.5">Water Intake (ml)</label>
            <input
              type="number"
              step="250"
              placeholder="e.g. 1500"
              value={water}
              onChange={e => setWater(e.target.value === '' ? '' : parseInt(e.target.value))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-brand-cyan/40"
            />
          </div>

          {/* Workout Completed */}
          <label className="flex items-center gap-2.5 p-3 rounded-xl bg-white/5 border border-white/5 cursor-pointer hover:bg-white/10 transition-colors">
            <input
              type="checkbox"
              checked={workout}
              onChange={e => setWorkout(e.target.checked)}
              className="w-4.5 h-4.5 rounded border-white/10 text-brand-cyan bg-transparent focus:ring-0 focus:ring-offset-0"
            />
            <span className="font-semibold text-slate-300">Mark Today's Workout Complete</span>
          </label>
        </div>

        <div className="pt-2 flex gap-2">
          <MotionButton onClick={onClose} variant="secondary" fullWidth size="md">
            Cancel
          </MotionButton>
          <MotionButton onClick={handleSave} variant="primary" fullWidth size="md">
            <Save className="w-4 h-4" /> Save Logs
          </MotionButton>
        </div>
      </motion.div>
    </div>
  );
};
