// ForgeFit AI - Biometrics & Progress Tracking Page (v4.3)

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useFitnessData } from '../context/FitnessDataContext';
import { calculateBMI } from '@shared/fitness-models';
import { calculateGoalProgress } from '@ai/goal-engine';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { 
  Plus, 
  TrendingUp, 
  Camera, 
  Sliders, 
  Award, 
  Calendar,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function Progress() {
  const { profile } = useAuth();
  const { measurements, logMeasurement, workoutLogs } = useFitnessData();

  // State variables for logging metrics
  const [weight, setWeight] = useState(profile?.weight || 70);
  const [chest, setChest] = useState(95);
  const [arms, setArms] = useState(35);
  const [waist, setWaist] = useState(80);
  const [shoulders, setShoulders] = useState(110);
  const [thighs, setThighs] = useState(55);
  const [calves, setCalves] = useState(38);
  const [submitting, setSubmitting] = useState(false);

  if (!profile) return null;

  // Process chart records
  const sortedMeasurements = [...measurements].sort(
    (a, b) => new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime()
  );

  const chartData = sortedMeasurements.slice(-10).map((m) => {
    const d = new Date(m.logged_at);
    return {
      date: `${d.getMonth() + 1}/${d.getDate()}`,
      weight: m.weight || profile.weight,
      waist: m.waist || 80,
      arms: m.arms || 35,
    };
  });

  const goalProgressReport = calculateGoalProgress(profile, measurements, []);

  const handleSubmitMetrics = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const success = await logMeasurement({
      weight,
      chest,
      arms,
      waist,
      shoulders,
      thighs,
      calves,
    });

    if (success) {
      confetti({ particleCount: 30, spread: 60, colors: ['#2563eb', '#7c3aed'] });
    }
    setSubmitting(false);
  };

  const currentBmi = calculateBMI(profile.weight, profile.height);

  return (
    <div className="space-y-6">

      {/* 1. Goal Progress header banner */}
      <div className="glass-panel p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-1.5 text-xs text-brand-cyan font-bold uppercase tracking-wider">
            <Award className="w-4 h-4" />
            Performance Lab — Goal Progress
          </div>
          <h1 className="text-2xl font-extrabold text-white">{profile.goal} Goal</h1>
          <p className="text-xs text-slate-500">{goalProgressReport.currentStatus}</p>
          <div className="flex items-center gap-4 pt-2">
            <div className="text-3xl font-extrabold text-white">{goalProgressReport.progressPct}%</div>
            <div className="text-xs text-slate-600 font-medium">
              Current: {goalProgressReport.currentValue} · Target: {goalProgressReport.targetValue}
            </div>
          </div>
          <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
            <div className="progress-fill-cyan h-full" style={{ width: `${goalProgressReport.progressPct}%` }} />
          </div>
        </div>

        <div className="glass-panel px-6 py-4 rounded-2xl text-center shrink-0">
          <div className="text-slate-500 text-[10px] uppercase font-bold">BMI Index</div>
          <div className="text-3xl font-extrabold text-white mt-1">{currentBmi}</div>
          <span className="text-[10px] text-brand-cyan font-bold">Normal: 18.5 – 24.9</span>
        </div>
      </div>

      {/* 2. Charts & Log forms Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recharts progress curves */}
        <div className="glass-panel p-6 rounded-3xl border border-white/5 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg text-white">Biometrics Progression Curve</h3>
              <p className="text-xs text-slate-400">Weight and waist tracking over historical logs</p>
            </div>
            <TrendingUp className="w-4 h-4 text-brand-blue" />
          </div>

          <div className="h-60">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(15, 17, 28, 0.9)', 
                      borderColor: 'rgba(255,255,255,0.08)',
                      borderRadius: '16px',
                      color: '#fff'
                    }} 
                  />
                  <Line type="monotone" dataKey="weight" stroke="#2563eb" strokeWidth={2.5} dot={{ fill: '#2563eb' }} />
                  <Line type="monotone" dataKey="waist" stroke="#7c3aed" strokeWidth={2} dot={{ fill: '#7c3aed' }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 gap-1.5 text-xs">
                <AlertCircle className="w-6 h-6" />
                <span>No metrics loaded. Log your weight on the right to start charts.</span>
              </div>
            )}
          </div>
        </div>

        {/* Logging inputs form */}
        <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-4">
          <h3 className="font-bold text-lg text-white flex items-center gap-1.5">
            <Sliders className="w-5 h-5 text-brand-blue" />
            Update Biometrics & Girth
          </h3>

          <form onSubmit={handleSubmitMetrics} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 font-semibold mb-2">Weight (kg)</label>
                <input 
                  type="number" 
                  step="0.1"
                  value={weight}
                  onChange={e => setWeight(parseFloat(e.target.value) || 0)}
                  className="glass-input"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-2">Waist Girth (cm)</label>
                <input 
                  type="number" 
                  value={waist}
                  onChange={e => setWaist(parseInt(e.target.value) || 0)}
                  className="glass-input"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-2">Arm Width (cm)</label>
                <input 
                  type="number" 
                  value={arms}
                  onChange={e => setArms(parseInt(e.target.value) || 0)}
                  className="glass-input"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-2">Chest Girth (cm)</label>
                <input 
                  type="number" 
                  value={chest}
                  onChange={e => setChest(parseInt(e.target.value) || 0)}
                  className="glass-input"
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={submitting}
              className="w-full glass-btn-primary py-3 rounded-xl font-bold mt-2 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Log Biometrics'}
            </button>
          </form>
        </div>
      </div>

      {/* 3. Photo Timeline block */}
      <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-4">
        <h3 className="font-bold text-lg text-white flex items-center gap-1.5">
          <Camera className="w-5 h-5 text-brand-blue" />
          Transformation Timeline Photos
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="h-44 border border-dashed border-white/10 hover:border-white/20 rounded-2xl flex flex-col items-center justify-center text-slate-500 gap-1.5 transition-colors">
            <Plus className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Log Photo</span>
          </button>
          
          {/* Mock placeholders */}
          <div className="relative h-44 rounded-2xl overflow-hidden border border-white/5 group bg-white/5">
            <div className="absolute inset-0 flex items-center justify-center text-[10px] text-slate-500 font-bold uppercase">
              Photo Log #1
            </div>
            <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-2.5 py-0.5 rounded-lg text-[9px] font-bold text-slate-400">
              June 1, 2026
            </div>
          </div>
          <div className="relative h-44 rounded-2xl overflow-hidden border border-white/5 group bg-white/5">
            <div className="absolute inset-0 flex items-center justify-center text-[10px] text-slate-500 font-bold uppercase">
              Photo Log #2
            </div>
            <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-2.5 py-0.5 rounded-lg text-[9px] font-bold text-slate-400">
              June 14, 2026
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
