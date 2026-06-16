// ForgeFit AI - Dashboard v5.0 — "What should I do today?"

import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFitnessData } from '../context/FitnessDataContext';
import { useNotifications } from '../context/NotificationContext';
import { generateCentralRecommendations } from '@ai/recommendation-engine';
import { calculateReadinessScore } from '@ai/readiness-engine';
import { calculateMuscleFatigue } from '@ai/muscle-fatigue-engine';
import { calculateSupplementConsistency } from '@ai/supplement-engine';
import { generateVolumeAnalytics } from '@ai/analytics-engine';
import { calculateAdherenceReport } from '@ai/adherence-engine';
import { calculateGoalProgress } from '@ai/goal-engine';
import { trackEvent } from '../services/analytics';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import {
  Flame, Droplet, Dumbbell, Sparkles, Activity, Plus,
  TrendingUp, MessageSquare, Award, Calendar, CheckCircle,
  ChevronDown, ChevronUp, Zap, Moon, Utensils, Heart, XCircle, RefreshCw,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { StreakBadge } from '../components/StreakBadge';
import { GlassCard } from '../components/GlassCard';
import { MotionButton } from '../components/MotionButton';
import { MilestoneToast } from '../components/MilestoneToast';
import { WearableEmptyState } from '../components/WearableEmptyState';
import { deviceManager, DeviceRegistryItem } from '../services/device-manager';
import { metricValidator } from '../services/metric-validator';

// ── SVG Progress Ring ─────────────────────────────────────
const ProgressRing = ({ pct }: { pct: number }) => {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width="90" height="90" viewBox="0 0 90 90" className="shrink-0">
      <circle cx="45" cy="45" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
      <circle
        cx="45" cy="45" r={r} fill="none"
        stroke="url(#ringGrad)"
        strokeWidth="6"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 45 45)"
        style={{ transition: 'stroke-dasharray 0.7s cubic-bezier(0.4,0,0.2,1)' }}
      />
      <defs>
        <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#22D3EE" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>
      <text x="45" y="49" textAnchor="middle" fontSize="14" fontWeight="800" fill="white">{pct}%</text>
    </svg>
  );
};

export default function Dashboard() {
  const { profile } = useAuth();
  const { beginnerMode } = useAuth();
  const { workouts, workoutLogs, nutritionLogs, supplementLogs, recoveryLogs, exercises, measurements, logNutrition, logSupplement } = useFitnessData();
  const { triggerHydrationReminder } = useNotifications();
  const navigate = useNavigate();

  const [addingWater,    setAddingWater]    = useState(false);
  const [addingCreatine, setAddingCreatine] = useState(false);
  const [advancedOpen,   setAdvancedOpen]   = useState(false);
  const [missionXpEarned, setMissionXpEarned] = useState(false);

  const [devicesList, setDevicesList] = useState<DeviceRegistryItem[]>([]);
  const [syncTrigger, setSyncTrigger] = useState(0);

  React.useEffect(() => {
    setDevicesList(deviceManager.getDevices());

    const handleManualUpdate = () => {
      setSyncTrigger(prev => prev + 1);
    };
    window.addEventListener('forgefit_manual_log_updated', handleManualUpdate);
    return () => {
      window.removeEventListener('forgefit_manual_log_updated', handleManualUpdate);
    };
  }, []);

  const handleSync = async (id: string) => {
    await deviceManager.syncDevice(id);
    setDevicesList(deviceManager.getDevices());
    setSyncTrigger(prev => prev + 1);
  };

  const handleDisconnect = async (id: string) => {
    await deviceManager.disconnectDevice(id);
    setDevicesList(deviceManager.getDevices());
    setSyncTrigger(prev => prev + 1);
  };

  if (!profile) return null;

  const todayStr = new Date().toISOString().split('T')[0];

  const todayNutrition = nutritionLogs.find(n => new Date(n.logged_at).toISOString().split('T')[0] === todayStr)
    || { calories: 0, protein: 0, carbs: 0, fat: 0, water_ml: 0 };

  const todaySupplements = supplementLogs.find(s => new Date(s.logged_at).toISOString().split('T')[0] === todayStr)
    || { creatine_g: 0, whey_protein_g: 0 };

  const todayRecovery = recoveryLogs.find(r => new Date(r.logged_at).toISOString().split('T')[0] === todayStr)
    || { sleep_hours: 0, soreness_score: 3 };

  const todayWorkoutLogged = workoutLogs.some(w => new Date(w.logged_at).toISOString().split('T')[0] === todayStr);

  // Read dynamically from metric validator
  const recoveryMetric = metricValidator.getMetric<number>('recovery');
  const sleepMetric = metricValidator.getMetric<number>('sleep');
  const sleepHours = sleepMetric ? sleepMetric.value : (todayRecovery.sleep_hours || null);

  // AI recommendations
  const aiRecommendations = generateCentralRecommendations(profile, exercises, todayRecovery.soreness_score || 3, sleepHours || 8, profile.streak || 1);
  const targetCalories  = aiRecommendations.nutritionSuggestion.calorieTarget;
  const targetProtein   = aiRecommendations.nutritionSuggestion.macroTargetG.protein;
  const loggedCalories  = todayNutrition.calories  || 0;
  const loggedProtein   = Number(todayNutrition.protein || 0);
  const loggedWater     = todayNutrition.water_ml  || 0;
  const calPct          = targetCalories > 0 ? Math.round((loggedCalories / targetCalories) * 100) : 0;
  const protPct         = targetProtein  > 0 ? Math.min(Math.round((loggedProtein / targetProtein) * 100), 100) : 0;

  // ── Today's Mission ───────────────────────────────────
  const missions = [
    { id: 'workout',  icon: Dumbbell,  label: 'Complete Workout',  done: todayWorkoutLogged,              xp: 20 },
    { id: 'water',    icon: Droplet,   label: 'Drink Water Goal',  done: loggedWater >= 3000,             xp: 10 },
    { id: 'protein',  icon: Utensils,  label: 'Reach Protein Goal',done: loggedProtein >= targetProtein,  xp: 10 },
    { id: 'sleep',    icon: Moon,      label: 'Sleep 8 Hours',     done: (sleepHours || 0) >= 8, xp: 10 },
  ];
  const doneMissions = missions.filter(m => m.done).length;
  const missionPct   = Math.round((doneMissions / missions.length) * 100);

  // Fire confetti on 100%
  if (missionPct === 100 && !missionXpEarned) {
    setMissionXpEarned(true);
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 }, colors: ['#22D3EE','#8B5CF6','#10B981'] });
  }

  // Advanced widgets
  const readinessReport = calculateReadinessScore(sleepHours || 8, 75, todayRecovery.soreness_score || 3, profile.streak || 1, workoutLogs.length > 0 ? workoutLogs[workoutLogs.length - 1].total_volume : 0);
  const goalReport      = calculateGoalProgress(profile, measurements, []);
  const adherenceReport = calculateAdherenceReport(profile, workoutLogs, nutritionLogs, supplementLogs, recoveryLogs);
  const muscleFatigue   = calculateMuscleFatigue(workoutLogs, [], exercises);
  const supplementConsistency = calculateSupplementConsistency(supplementLogs);

  const chartData = workoutLogs.length > 0
    ? generateVolumeAnalytics(workoutLogs)
    : [{ date: 'Mon', volume: 4000 }, { date: 'Tue', volume: 5500 }, { date: 'Wed', volume: 4800 }, { date: 'Thu', volume: 6200 }, { date: 'Fri', volume: 7000 }];

  const readinessColor = recoveryMetric
    ? (recoveryMetric.value >= 80 ? '#10B981' : recoveryMetric.value >= 50 ? '#F59E0B' : '#EF4444')
    : '#475569';

  const handleQuickAddWater = async () => {
    setAddingWater(true);
    const success = await logNutrition(loggedCalories, Number(loggedProtein), Number(todayNutrition.carbs || 0), Number(todayNutrition.fat || 0), loggedWater + 250);
    if (success) { confetti({ particleCount: 30, spread: 50, colors: ['#22D3EE','#38bdf8'] }); triggerHydrationReminder(); }
    setAddingWater(false);
  };

  const handleQuickAddCreatine = async () => {
    setAddingCreatine(true);
    const success = await logSupplement(5.0, Number(todaySupplements.whey_protein_g || 0));
    if (success) confetti({ particleCount: 40, spread: 70, colors: ['#8B5CF6','#ec4899'] });
    setAddingCreatine(false);
  };

  return (
    <div className="space-y-5" role="region" aria-label="Dashboard">

      {/* ── 1. Welcome Header ── */}
      <GlassCard className="p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4" glowColor="#22D3EE">
        <div className="relative z-10 flex-1">
          <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">
            Welcome back, {profile.name || 'Champion'}! 👋
          </h1>
          <div className="flex flex-wrap items-center gap-4 mt-3">
            <StreakBadge streak={profile.streak} isAtRisk={!todayWorkoutLogged} />
            <div className="w-1.5 h-1.5 rounded-full bg-slate-700 hidden sm:block" />
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-brand-cyan text-sm font-bold bg-brand-cyan/10 border border-brand-cyan/20">
              <Zap className="w-4 h-4" />
              <span>{profile.xp} XP</span>
            </div>
          </div>
        </div>
        <div className="shrink-0">
          <MotionButton
            onClick={() => { trackEvent('Workout Started', {}); navigate('/workouts'); }}
            variant="primary"
            size="lg"
            ariaLabel="Start today's workout"
          >
            <Dumbbell className="w-4 h-4" /> Start Workout
          </MotionButton>
        </div>
      </GlassCard>

      {/* ── Gym Buddy Card ── */}
      <GlassCard className="p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-6" glowColor="#8B5CF6">
        <div className="flex items-start gap-4">
          <div className="text-4xl p-3 bg-white/5 rounded-2xl shrink-0 animate-pulse">
            👊
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase text-brand-purple tracking-widest bg-brand-purple/10 px-2 py-0.5 rounded border border-brand-purple/20">
              Coach: {localStorage.getItem('forgefit_gym_buddy_coach') === 'strict_coach' ? 'Strict Coach ⚡' : localStorage.getItem('forgefit_gym_buddy_coach') === 'science_coach' ? 'Science Coach 🔬' : 'Friendly Bro 👊'}
            </span>
            <h2 className="text-lg font-bold text-white mt-1.5">Gym Buddy Active Session</h2>
            <p className="text-xs text-slate-400 max-w-md leading-relaxed">
              Start your companion workout to get real-time audio cues, sets/reps trackers, 3D animations, and biometric readiness optimization.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-semibold text-slate-400">
              <span className="flex items-center gap-1"><Dumbbell className="w-3.5 h-3.5 text-brand-cyan" /> 5 Exercises</span>
              <span className="text-slate-700">•</span>
              <span className="flex items-center gap-1">
                <Heart className={`w-3.5 h-3.5 ${recoveryMetric ? 'text-brand-rose animate-pulse' : 'text-slate-600'}`} />
                <span>Recovery: {recoveryMetric ? `${recoveryMetric.value}%` : 'No Device Connected'}</span>
              </span>
            </div>
          </div>
        </div>
        <div className="shrink-0">
          <MotionButton onClick={() => navigate('/coach-session')} variant="primary" size="md">
            Start Live Session ➜
          </MotionButton>
        </div>
      </GlassCard>

      {/* ── 2. Today's Mission ── */}
      <GlassCard className="p-6 rounded-3xl" glowColor="#8B5CF6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-brand-cyan" />
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Today's Mission</h2>
            </div>
            {missionPct === 100 ? (
              <p className="text-base font-extrabold text-brand-emerald mt-1">All missions complete! +50 XP earned 🎉</p>
            ) : (
              <p className="text-base font-bold text-white mt-1">{doneMissions} of {missions.length} done</p>
            )}

            <motion.div
              className="mt-4 space-y-3"
              variants={{
                show: { transition: { staggerChildren: 0.08 } }
              }}
              initial="hidden"
              animate="show"
            >
              {missions.map(m => {
                const Icon = m.icon;
                return (
                  <motion.div
                    key={m.id}
                    variants={{
                      hidden: { opacity: 0, x: -10 },
                      show: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 300, damping: 25 } }
                    }}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 ${m.done ? '' : 'opacity-65'}`}
                    style={{
                      background: m.done ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${m.done ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)'}`
                    }}
                    whileHover={{ scale: 1.01, x: 2 }}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${m.done ? 'text-brand-emerald' : 'text-slate-500'}`}
                      style={{ background: m.done ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.05)' }}>
                      {m.done ? <CheckCircle className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                    </div>
                    <span className={`flex-1 text-sm font-semibold ${m.done ? 'text-slate-500 line-through' : 'text-white'}`}>{m.label}</span>
                    <span className="text-xs font-bold text-brand-cyan">+{m.xp} XP</span>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>

          <ProgressRing pct={missionPct} />
        </div>
      </GlassCard>

      {/* ── 3. Core Metrics Row (Always Visible) ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Calories */}
        <GlassCard className="p-5 rounded-3xl space-y-3" glowColor="#F59E0B">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs uppercase font-bold tracking-wider">Calories Today</span>
            <Flame className="w-4 h-4 text-brand-amber animate-pulse" />
          </div>
          <div className="text-3xl font-extrabold text-white">{loggedCalories} <span className="text-sm text-slate-500 font-normal">/ {targetCalories} kcal</span></div>
          <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
            <div className="progress-fill-cyan h-full" style={{ width: `${Math.min(calPct, 100)}%`, background: 'linear-gradient(90deg, #F59E0B, #EF4444)' }} />
          </div>
          <div className="text-xs text-slate-500">Protein: <strong className="text-brand-purple">{loggedProtein}g</strong> / {targetProtein}g</div>
        </GlassCard>

        {/* Water */}
        <GlassCard className="p-5 rounded-3xl space-y-3" glowColor="#22D3EE">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs uppercase font-bold tracking-wider">Hydration</span>
            <Droplet className="w-4 h-4 text-brand-cyan" />
          </div>
          <div className="text-3xl font-extrabold text-white">{loggedWater} <span className="text-sm text-slate-500 font-normal">ml / 3000ml</span></div>
          <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
            <div className="progress-fill-cyan h-full" style={{ width: `${Math.min(Math.round((loggedWater / 3000) * 100), 100)}%` }} />
          </div>
          <MotionButton onClick={handleQuickAddWater} disabled={addingWater} variant="cyan" size="sm" fullWidth>
            <Plus className="w-3.5 h-3.5" /> +250ml Glass
          </MotionButton>
        </GlassCard>

        {/* Supplements */}
        <GlassCard className="p-5 rounded-3xl space-y-3" glowColor="#8B5CF6">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs uppercase font-bold tracking-wider">Supplements</span>
            <Flame className="w-4 h-4 text-brand-purple" />
          </div>
          <div className="text-3xl font-extrabold text-white">
            {todaySupplements.creatine_g > 0 ? <span className="text-brand-emerald">✓ Logged</span> : <span className="text-slate-600">Missing</span>}
          </div>
          <div className="text-xs text-slate-500">Creatine streak: <strong className="text-brand-purple">{supplementConsistency.creatineStreakDays} days</strong></div>
          <MotionButton onClick={handleQuickAddCreatine} disabled={addingCreatine} variant="secondary" size="sm" fullWidth className="text-brand-purple hover:text-brand-purple">
            <Plus className="w-3.5 h-3.5" /> +5g Creatine
          </MotionButton>
        </GlassCard>
      </div>

      {/* ── 4. AI Coach Shortcut ── */}
      <GlassCard
        onClick={() => navigate('/coach')}
        className="w-full p-5 rounded-3xl flex items-center gap-4 text-left"
        glowColor="#22D3EE"
      >
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 glow-pulse"
          style={{ background: 'linear-gradient(135deg, rgba(34,211,238,0.2), rgba(139,92,246,0.2))', border: '1px solid rgba(34,211,238,0.2)' }}>
          <MessageSquare className="w-6 h-6 text-brand-cyan" />
        </div>
        <div className="flex-1">
          <p className="font-bold text-white text-sm">Ask your AI Coach</p>
          <p className="text-xs text-slate-500 mt-0.5">Get a personalized workout tip, meal advice, or recovery insight</p>
        </div>
        <ChevronDown className="w-4 h-4 text-slate-500 -rotate-90" />
      </GlassCard>

      {/* ── Connected Devices Dashboard Section ── */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Connected Devices</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {devicesList.map(dev => {
            const isConnected = dev.status === 'connected';
            const isSyncing = dev.status === 'syncing';
            return (
              <GlassCard
                key={dev.id}
                className={`p-3 rounded-2xl flex flex-col justify-between text-center space-y-2 border transition-all duration-300 ${
                  isConnected ? 'border-brand-cyan/20 bg-brand-cyan/[0.01]' : 'border-white/5'
                }`}
                glowColor={isConnected ? '#22D3EE' : '#8B5CF6'}
              >
                <div>
                  <h4 className="font-extrabold text-white text-[11px] truncate">{dev.name}</h4>
                  <div className="flex justify-center mt-1">
                    {dev.status === 'connected' ? (
                      <span className="text-[8px] font-black uppercase text-brand-emerald bg-brand-emerald/10 px-1.5 py-0.5 rounded">
                        Connected
                      </span>
                    ) : dev.status === 'syncing' ? (
                      <span className="text-[8px] font-black uppercase text-brand-cyan bg-brand-cyan/10 px-1.5 py-0.5 rounded animate-pulse">
                        Syncing...
                      </span>
                    ) : dev.status === 'integration_not_configured' ? (
                      <span className="text-[8px] font-black text-slate-500 bg-white/5 px-1.5 py-0.5 rounded">
                        Config Req
                      </span>
                    ) : (
                      <span className="text-[8px] font-black text-slate-600 bg-white/5 px-1.5 py-0.5 rounded">
                        Offline
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-1 justify-center pt-1.5">
                  {isConnected ? (
                    <>
                      <button
                        onClick={() => handleSync(dev.id)}
                        disabled={isSyncing}
                        className="p-1 rounded-lg bg-white/5 hover:bg-brand-cyan/10 hover:text-brand-cyan text-slate-400 transition-colors"
                        title="Sync Now"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                      </button>
                      <button
                        onClick={() => handleDisconnect(dev.id)}
                        className="p-1 rounded-lg bg-white/5 hover:bg-brand-rose/10 hover:text-brand-rose text-slate-400 transition-colors"
                        title="Disconnect"
                      >
                        <XCircle className="w-3.5 h-3.5 text-brand-rose" />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => navigate('/devices')}
                      disabled={dev.status === 'integration_not_configured'}
                      className="text-[9px] font-bold text-slate-400 hover:text-white px-2 py-1 bg-white/5 hover:bg-white/10 rounded-lg transition-all disabled:opacity-40"
                    >
                      Connect
                    </button>
                  )}
                </div>
              </GlassCard>
            );
          })}
        </div>
      </div>

      {/* ── 5. Advanced Insights Drawer (hidden in beginner mode) ── */}
      {!beginnerMode && (
        <div className="glass-panel rounded-3xl overflow-hidden">
          <button
            onClick={() => setAdvancedOpen(p => !p)}
            className="w-full flex items-center justify-between p-5 text-left hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-brand-purple" />
              <span className="font-bold text-white text-sm">Advanced Insights</span>
              <span className="text-xs text-slate-600 font-medium">({Object.keys({}).length + 4} metrics)</span>
            </div>
            {advancedOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </button>

          <AnimatePresence initial={false}>
            {advancedOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 220, damping: 24 }}
                className="px-5 pb-6 space-y-5 border-t border-dark-border/30 overflow-hidden"
              >
                {/* Intelligence widgets */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-5">

                  {/* Readiness */}
                  {recoveryMetric ? (
                    <GlassCard className="p-5 rounded-2xl space-y-3 animate-fade-in" glowColor={readinessColor}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs uppercase font-extrabold tracking-wider" style={{ color: readinessColor }}>CNS Readiness</span>
                        <Activity className="w-4 h-4" style={{ color: readinessColor }} />
                      </div>
                      <div className="text-3xl font-black text-white">{recoveryMetric.value}<span className="text-xs text-slate-500">/100</span></div>
                      <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${recoveryMetric.value}%`, background: readinessColor }} />
                      </div>
                      <div className="flex justify-between items-center text-[9px] text-slate-500">
                        <span>Source: {recoveryMetric.source}</span>
                        {recoveryMetric.isLive && <span className="text-brand-cyan animate-pulse">LIVE</span>}
                      </div>
                    </GlassCard>
                  ) : (
                    <WearableEmptyState metricName="CNS Readiness" icon="🔋" />
                  )}

                  {/* Goal Progress */}
                  <GlassCard className="p-5 rounded-2xl space-y-3" glowColor="#22D3EE">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-xs uppercase font-extrabold tracking-wider">Goal Progress</span>
                      <Award className="w-4 h-4 text-brand-cyan" />
                    </div>
                    <div className="text-lg font-black text-white truncate">{profile.goal || 'General Fitness'}</div>
                    <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                      <div className="progress-fill-cyan h-full" style={{ width: `${goalReport.progressPct}%` }} />
                    </div>
                    <p className="text-[10px] text-slate-500">{goalReport.progressPct}% toward target</p>
                  </GlassCard>

                  {/* Adherence */}
                  <GlassCard className="p-5 rounded-2xl space-y-3" glowColor="#8B5CF6">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-xs uppercase font-extrabold tracking-wider">Adherence</span>
                      <span className="text-xs font-black text-brand-purple px-2 py-0.5 rounded-md" style={{ background: 'rgba(139,92,246,0.1)' }}>
                        {adherenceReport.grade}
                      </span>
                    </div>
                    <div className="text-3xl font-black text-white">{adherenceReport.combinedAdherenceScore}%</div>
                    <p className="text-[10px] text-slate-500 line-clamp-2">{adherenceReport.feedback}</p>
                  </GlassCard>

                  {/* Recovery Forecast */}
                  <GlassCard className="p-5 rounded-2xl space-y-2" glowColor="#10B981">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-xs uppercase font-extrabold tracking-wider">Muscle Forecast</span>
                      <Calendar className="w-4 h-4 text-brand-cyan" />
                    </div>
                    <div className="space-y-1.5 max-h-[100px] overflow-y-auto pr-1">
                      {muscleFatigue.slice(0, 5).map(mf => {
                        const state = mf.fatiguePct > 60 ? 'Fatigued' : mf.fatiguePct >= 30 ? 'Recovering' : 'Ready';
                        const col   = state === 'Fatigued' ? '#EF4444' : state === 'Recovering' ? '#F59E0B' : '#10B981';
                        return (
                          <div key={mf.muscleGroup} className="flex justify-between items-center text-[10px]">
                            <span className="text-slate-400">{mf.muscleGroup}</span>
                            <span className="font-bold" style={{ color: col }}>{state}</span>
                          </div>
                        );
                      })}
                    </div>
                  </GlassCard>
                </div>

                {/* Training Volume Chart */}
                <GlassCard className="p-6 rounded-2xl space-y-4" glowColor="#22D3EE">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-white">Training Volume</h3>
                      <p className="text-xs text-slate-500">Cumulative load (kg) over sessions</p>
                    </div>
                    <TrendingUp className="w-4 h-4 text-brand-cyan" />
                  </div>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#22D3EE" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#22D3EE" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="date" stroke="#475569" fontSize={11} tickLine={false} />
                        <YAxis stroke="#475569" fontSize={11} tickLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: 'rgba(11,16,32,0.95)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', fontSize: '11px' }} />
                        <Area type="monotone" dataKey="volume" stroke="#22D3EE" strokeWidth={2} fillOpacity={1} fill="url(#volGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </GlassCard>

                {/* AI Insights */}
                <GlassCard className="p-6 rounded-2xl space-y-4" glowColor="#8B5CF6">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-brand-cyan" />
                    <h3 className="font-bold text-white">Daily AI Insights</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    {[
                      { label: 'Workout',   text: aiRecommendations.workoutSuggestion.shouldTrain ? `Train today — ${aiRecommendations.workoutSuggestion.recommendedSplit}. Focus: ${aiRecommendations.workoutSuggestion.focusAreas.slice(0,2).join(', ')}` : `Rest day recommended. Focus: ${aiRecommendations.workoutSuggestion.focusAreas.join(', ')}` },
                      { label: 'Nutrition', text: `Target ${aiRecommendations.nutritionSuggestion.calorieTarget} kcal with emphasis on ${aiRecommendations.nutritionSuggestion.focusMacro}.` },
                      { label: 'Recovery',  text: `${aiRecommendations.recoverySuggestion.activityTip} Aim for ${Math.round(aiRecommendations.recoverySuggestion.recommendedSleepMin / 60)}h sleep.` },
                    ].map(ins => (
                      <div key={ins.label} className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                        <div className="font-bold text-slate-400 text-[10px] uppercase mb-1">{ins.label}</div>
                        <p className="text-slate-400 leading-relaxed">{ins.text}</p>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
