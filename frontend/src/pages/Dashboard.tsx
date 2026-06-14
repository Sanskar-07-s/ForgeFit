// ForgeFit AI - Smart Dashboard Command Center Page (v4.4)
import React, { useState } from 'react';
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
  Flame, 
  Droplet, 
  Dumbbell, 
  Sparkles, 
  Activity, 
  Plus, 
  TrendingUp, 
  MessageSquare,
  Award,
  Calendar,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function Dashboard() {
  const { user, profile } = useAuth();
  const { 
    workouts, 
    workoutLogs, 
    nutritionLogs, 
    supplementLogs, 
    recoveryLogs, 
    exercises, 
    measurements,
    logNutrition, 
    logSupplement 
  } = useFitnessData();
  const { triggerHydrationReminder } = useNotifications();
  const navigate = useNavigate();

  const [addingWater, setAddingWater] = useState(false);
  const [addingCreatine, setAddingCreatine] = useState(false);

  if (!profile) return null;

  // Retrieve today's date keys
  const todayStr = new Date().toISOString().split('T')[0];
  
  // Find current day logs
  const todayNutrition = nutritionLogs.find(
    (n) => new Date(n.logged_at).toISOString().split('T')[0] === todayStr
  ) || { calories: 0, protein: 0, carbs: 0, fat: 0, water_ml: 0 };

  const todaySupplements = supplementLogs.find(
    (s) => new Date(s.logged_at).toISOString().split('T')[0] === todayStr
  ) || { creatine_g: 0, whey_protein_g: 0 };

  const todayRecovery = recoveryLogs.find(
    (r) => new Date(r.logged_at).toISOString().split('T')[0] === todayStr
  ) || { sleep_hours: 8, soreness_score: 3 };

  // 1. Calculate Readiness Score (0-100)
  const readinessReport = calculateReadinessScore(
    todayRecovery.sleep_hours || 8,
    75, // estimated recovery pct
    todayRecovery.soreness_score || 3,
    profile.streak || 1,
    workoutLogs.length > 0 ? workoutLogs[workoutLogs.length - 1].total_volume : 0
  );

  // Map readiness score to strict color scale (Red, Amber, Green)
  let readinessColorClass = 'text-red-400 border-red-500/20 bg-red-500/5';
  let readinessProgressColor = 'bg-red-500';
  if (readinessReport.score >= 80) {
    readinessColorClass = 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5';
    readinessProgressColor = 'bg-emerald-500';
  } else if (readinessReport.score >= 50) {
    readinessColorClass = 'text-amber-500 border-amber-500/20 bg-amber-500/5';
    readinessProgressColor = 'bg-amber-500';
  }

  // 2. Calculate Goal Progress
  const goalReport = calculateGoalProgress(profile, measurements, []);
  // Set default target date as 90 days after profile creation
  const createdDate = profile.created_at ? new Date(profile.created_at) : new Date();
  const targetDate = new Date(createdDate.getTime() + 90 * 24 * 60 * 60 * 1000);
  const targetDateStr = targetDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

  // 3. Calculate Adherence Score
  const adherenceReport = calculateAdherenceReport(
    profile,
    workoutLogs,
    nutritionLogs,
    supplementLogs,
    recoveryLogs
  );

  // 4. Calculate Recovery Forecast
  const muscleFatigue = calculateMuscleFatigue(workoutLogs, [], exercises);
  const recoveryForecast = muscleFatigue.map((mf) => {
    let state: 'Ready' | 'Recovering' | 'Fatigued' = 'Ready';
    let colorClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    let timeText = 'Ready now';

    if (mf.fatiguePct > 60) {
      state = 'Fatigued';
      colorClass = 'bg-red-500/10 text-red-400 border-red-500/20';
      timeText = 'Ready in ~48h';
    } else if (mf.fatiguePct >= 30) {
      state = 'Recovering';
      colorClass = 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      timeText = 'Ready in ~24h';
    }

    return {
      muscleGroup: mf.muscleGroup,
      state,
      colorClass,
      timeText,
      fatiguePct: mf.fatiguePct
    };
  });

  const supplementConsistency = calculateSupplementConsistency(supplementLogs);
  const aiRecommendations = generateCentralRecommendations(
    profile, 
    exercises, 
    todayRecovery.soreness_score || 3,
    todayRecovery.sleep_hours || 8,
    profile.streak || 1
  );

  // Prepare Weekly Volume chart data using Recharts
  const chartData = workoutLogs.length > 0 
    ? generateVolumeAnalytics(workoutLogs)
    : [
        { date: 'Mon', volume: 4000 },
        { date: 'Tue', volume: 5500 },
        { date: 'Wed', volume: 4800 },
        { date: 'Thu', volume: 6200 },
        { date: 'Fri', volume: 7000 },
      ];

  const handleStartWorkout = () => {
    trackEvent('Workout Started', {
      splitRecommended: aiRecommendations.workoutSuggestion.recommendedSplit,
      readinessScore: readinessReport.score
    });
    navigate('/workouts');
  };

  const handleQuickAddWater = async () => {
    setAddingWater(true);
    const newWater = (todayNutrition.water_ml || 0) + 250;
    const success = await logNutrition(
      todayNutrition.calories || 0,
      Number(todayNutrition.protein || 0),
      Number(todayNutrition.carbs || 0),
      Number(todayNutrition.fat || 0),
      newWater
    );
    if (success) {
      confetti({ particleCount: 30, spread: 60, colors: ['#2563eb', '#38bdf8'] });
      triggerHydrationReminder();
      trackEvent('Nutrition Logged', { type: 'water', amountMl: 250 });
    }
    setAddingWater(false);
  };

  const handleQuickAddCreatine = async () => {
    setAddingCreatine(true);
    const success = await logSupplement(5.0, Number(todaySupplements.whey_protein_g || 0));
    if (success) {
      confetti({ particleCount: 40, spread: 80, colors: ['#7c3aed', '#ec4899'] });
      trackEvent('Supplement Logged', { type: 'creatine', amountG: 5.0 });
    }
    setAddingCreatine(false);
  };

  const handleChatCoachRedirect = () => {
    trackEvent('AI Coach Used', { source: 'dashboard_quick_insight' });
    navigate('/coach');
  };

  const targetCalories = aiRecommendations.nutritionSuggestion.calorieTarget;
  const targetProtein = aiRecommendations.nutritionSuggestion.macroTargetG.protein;
  const loggedCalories = todayNutrition.calories || 0;
  const loggedProtein = todayNutrition.protein || 0;

  const calProgress = targetCalories > 0 ? Math.round((loggedCalories / targetCalories) * 100) : 0;
  const protProgress = targetProtein > 0 ? Math.min(Math.round((Number(loggedProtein) / targetProtein) * 100), 100) : 0;

  return (
    <div className="space-y-6" role="region" aria-label="Dashboard metrics console">
      
      {/* 1. Welcome Hero banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-brand-blue/10 to-brand-purple/10 border border-white/5 p-6 rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-brand-purple/5 blur-[50px] pointer-events-none" />
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">Welcome back, {profile.name}!</h1>
          <p className="text-xs text-slate-400 mt-1">Ecosystem metrics compiled successfully. Active streak: {profile.streak} days.</p>
        </div>
        <button 
          onClick={handleStartWorkout}
          className="glass-btn-primary flex items-center gap-2 py-3 rounded-2xl text-xs font-bold"
          aria-label="Start today's routine workout split"
        >
          <Dumbbell className="w-4 h-4" /> Start Today's Routine
        </button>
      </div>

      {/* 2. Intelligence Widgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* WIDGET A: Readiness Score */}
        <div className={`glass-panel p-5 rounded-3xl border ${readinessColorClass} flex flex-col justify-between space-y-3`}>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-extrabold tracking-wider opacity-85">Readiness Score</span>
              <Activity className="w-4 h-4" />
            </div>
            <div className="text-3xl font-black mt-3 flex items-baseline gap-1">
              <span>{readinessReport.score}</span>
              <span className="text-xs font-semibold opacity-70">/100</span>
            </div>
            <p className="text-[10px] mt-2 leading-relaxed opacity-90">{readinessReport.description}</p>
          </div>
          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between text-[9px] font-bold uppercase opacity-80">
              <span>CNS Capacity</span>
              <span>{readinessReport.status}</span>
            </div>
            <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${readinessProgressColor}`} style={{ width: `${readinessReport.score}%` }} />
            </div>
          </div>
        </div>

        {/* WIDGET B: Goal Progress */}
        <div className="glass-panel p-5 rounded-3xl border border-white/5 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs uppercase font-extrabold tracking-wider">Goal Progress</span>
              <Award className="w-4 h-4 text-brand-blue" />
            </div>
            <div className="text-lg font-black mt-3 text-white truncate" title={profile.goal || 'General Fitness'}>
              {profile.goal || 'General Fitness'}
            </div>
            <div className="text-[10px] text-slate-400 flex flex-col gap-0.5 mt-1">
              <span>Target: <strong className="text-slate-200">{goalReport.targetValue || 'Active logs'}</strong></span>
              <span>Current: <strong className="text-slate-200">{goalReport.currentValue || 'N/A'}</strong></span>
              <span>Deadline: <strong className="text-slate-200">{targetDateStr}</strong></span>
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-[9px] font-bold text-brand-blue uppercase">
              <span>Progress</span>
              <span>{goalReport.progressPct}%</span>
            </div>
            <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
              <div className="bg-brand-blue h-full rounded-full shadow-glow-blue" style={{ width: `${goalReport.progressPct}%` }} />
            </div>
          </div>
        </div>

        {/* WIDGET C: Adherence Score */}
        <div className="glass-panel p-5 rounded-3xl border border-white/5 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs uppercase font-extrabold tracking-wider">Adherence Audit</span>
              <span className="text-[10px] bg-brand-purple/10 text-brand-purple border border-brand-purple/20 px-2 py-0.5 rounded-md font-bold uppercase">
                Grade {adherenceReport.grade}
              </span>
            </div>
            <div className="text-3xl font-black mt-3 text-white flex items-baseline gap-1">
              <span>{adherenceReport.combinedAdherenceScore}%</span>
              <span className="text-xs font-semibold text-slate-500">Overall</span>
            </div>
            <p className="text-[9px] text-slate-400 mt-1 line-clamp-2">{adherenceReport.feedback}</p>
          </div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[8px] text-slate-400 uppercase pt-1">
            <div className="flex justify-between border-b border-white/5 pb-0.5">
              <span>Workout</span>
              <span className="font-bold text-white">{adherenceReport.workoutAdherencePct}%</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-0.5">
              <span>Nutrition</span>
              <span className="font-bold text-white">{adherenceReport.nutritionAdherencePct}%</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-0.5">
              <span>Supplement</span>
              <span className="font-bold text-white">{adherenceReport.supplementAdherencePct}%</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-0.5">
              <span>Recovery</span>
              <span className="font-bold text-white">{adherenceReport.recoveryAdherencePct}%</span>
            </div>
          </div>
        </div>

        {/* WIDGET D: Recovery Forecast */}
        <div className="glass-panel p-5 rounded-3xl border border-white/5 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs uppercase font-extrabold tracking-wider">Muscle Forecast</span>
              <Calendar className="w-4 h-4 text-brand-cyan" />
            </div>
            <div className="space-y-1.5 mt-3 max-h-[120px] overflow-y-auto pr-1">
              {recoveryForecast.map((rf) => (
                <div key={rf.muscleGroup} className="flex justify-between items-center text-[10px] border-b border-white/5 pb-1">
                  <span className="font-semibold text-slate-300">{rf.muscleGroup}</span>
                  <div className="flex items-center gap-1.5">
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold border ${rf.colorClass}`}>
                      {rf.state}
                    </span>
                    <span className="text-[8px] text-slate-500 font-medium">{rf.timeText}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* 3. Quick Stats & Log Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Macros card */}
        <div className="glass-panel p-5 rounded-3xl border border-white/5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs uppercase font-bold tracking-wider">Nutrition Calibration</span>
              <span className="text-brand-blue text-[10px] font-bold">{calProgress}% Cal</span>
            </div>
            <div className="text-3xl font-extrabold mt-3 text-white">
              {loggedCalories} <span className="text-sm font-normal text-slate-400">/ {targetCalories} kcal</span>
            </div>
            <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden mt-3">
              <div className="bg-brand-blue h-full rounded-full" style={{ width: `${Math.min(calProgress, 100)}%` }} />
            </div>
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-400 mt-4">
            <span>Protein: {loggedProtein}g / {targetProtein}g</span>
            <span className="text-brand-purple font-semibold">{protProgress}% Met</span>
          </div>
        </div>

        {/* Water log card */}
        <div className="glass-panel p-5 rounded-3xl border border-white/5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs uppercase font-bold tracking-wider">Hydration Intake</span>
              <Droplet className="w-4 h-4 text-brand-blue" />
            </div>
            <div className="text-3xl font-extrabold mt-3 text-white">
              {todayNutrition.water_ml} <span className="text-xs font-normal text-slate-400">ml</span>
            </div>
          </div>
          <button 
            onClick={handleQuickAddWater}
            disabled={addingWater}
            className="w-full glass-btn-secondary flex items-center justify-center gap-1.5 py-2 mt-4 text-xs font-bold bg-brand-blue/5 border-brand-blue/20 hover:border-brand-blue/30 text-brand-blue"
            aria-label="Log 250ml glass of water"
          >
            <Plus className="w-3.5 h-3.5" /> 250ml Glass
          </button>
        </div>

        {/* Creatine log card */}
        <div className="glass-panel p-5 rounded-3xl border border-white/5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs uppercase font-bold tracking-wider">Creatine Monitor</span>
              <Flame className="w-4 h-4 text-brand-purple" />
            </div>
            <div className="text-3xl font-extrabold mt-3 text-white">
              {todaySupplements.creatine_g > 0 ? 'Logged' : 'Missing'}
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5">Streak: {supplementConsistency.creatineStreakDays} Days</p>
          </div>
          <button 
            onClick={handleQuickAddCreatine}
            disabled={addingCreatine}
            className="w-full glass-btn-secondary flex items-center justify-center gap-1.5 py-2 mt-4 text-xs font-bold bg-brand-purple/5 border-brand-purple/20 hover:border-brand-purple/30 text-brand-purple"
            aria-label="Log 5 grams of creatine supplement"
          >
            <Plus className="w-3.5 h-3.5" /> 5g Creatine
          </button>
        </div>
      </div>

      {/* 4. Bottom Analytics Chart & AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Weekly Training Volume Chart */}
        <div className="glass-panel p-6 rounded-3xl border border-white/5 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-lg text-white">Training Volume Progress</h2>
              <p className="text-xs text-slate-400">Cumulative load tracked (kg) over past workouts</p>
            </div>
            <TrendingUp className="w-4 h-4 text-brand-blue" />
          </div>
          
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
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
                <Area type="monotone" dataKey="volume" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#volGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Recommendations panel */}
        <div className="glass-panel p-6 rounded-3xl border border-white/5 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-brand-blue" />
              <h2 className="font-bold text-lg text-white">Daily AI Insights</h2>
            </div>
            <button 
              onClick={handleChatCoachRedirect} 
              className="text-[10px] text-brand-blue font-bold flex items-center gap-1 hover:underline focus:outline-none"
              aria-label="Open AI coach chatbot session"
            >
              <MessageSquare className="w-3.5 h-3.5" /> Chat Coach
            </button>
          </div>

          <div className="flex-1 space-y-4 text-xs">
            <div className="p-3 bg-white/5 border border-white/5 rounded-2xl">
              <div className="font-bold text-slate-300">Workout recommendation:</div>
              <p className="text-slate-400 mt-1 leading-relaxed">
                {aiRecommendations.workoutSuggestion.shouldTrain 
                  ? `Go train! Recommended split is ${aiRecommendations.workoutSuggestion.recommendedSplit}. Focus areas: ${aiRecommendations.workoutSuggestion.focusAreas.join(', ')}.`
                  : `Suggest rest day. Focus on: ${aiRecommendations.workoutSuggestion.focusAreas.join(', ')}.`}
              </p>
            </div>

            <div className="p-3 bg-white/5 border border-white/5 rounded-2xl">
              <div className="font-bold text-slate-300">Nutrition advice:</div>
              <p className="text-slate-400 mt-1 leading-relaxed">
                Aim for **{aiRecommendations.nutritionSuggestion.calorieTarget} kcal** focusing heavily on **{aiRecommendations.nutritionSuggestion.focusMacro}** macro density.
              </p>
            </div>

            <div className="p-3 bg-white/5 border border-white/5 rounded-2xl">
              <div className="font-bold text-slate-300">Recovery focus:</div>
              <p className="text-slate-400 mt-1 leading-relaxed">
                {aiRecommendations.recoverySuggestion.activityTip} Recommended sleep target: **{Math.round(aiRecommendations.recoverySuggestion.recommendedSleepMin / 60)} hours**.
              </p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
