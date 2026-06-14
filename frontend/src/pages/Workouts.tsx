// ForgeFit AI - Workout Generator & Active Tracker Page (v4.3)

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useFitnessData } from '../context/FitnessDataContext';
import { generateWorkoutSplit } from '@ai/workout-planner';
import { calculateProgressiveOverload } from '@ai/progression-engine';
import { trackEvent } from '../services/analytics';
import { 
  Plus, 
  Dumbbell, 
  Play, 
  Sparkles, 
  Trash2, 
  CheckCircle, 
  Timer, 
  Maximize2,
  ChevronRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface TrackingSet {
  exercise_id: string;
  name: string;
  weight: number;
  reps: number;
  completed: boolean;
  rpe: number;
}

export default function Workouts() {
  const { profile } = useAuth();
  const { workouts, exercises, createWorkout, logWorkoutSession, workoutLogs } = useFitnessData();

  // Generator states
  const [showGenerator, setShowGenerator] = useState(false);
  const [splitName, setSplitName] = useState('');
  const [splitType, setSplitType] = useState('Push Pull Legs');
  
  // Tracker states
  const [activeWorkout, setActiveWorkout] = useState<any>(null);
  const [workoutSessionSets, setWorkoutSessionSets] = useState<TrackingSet[]>([]);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [sessionNotes, setSessionNotes] = useState('');
  const [sessionRpe, setSessionRpe] = useState(8);

  // Timer states
  const [timerRunning, setTimerRunning] = useState(false);
  const [restTimerSeconds, setRestTimerSeconds] = useState(0);
  const [restTimerMax, setRestTimerMax] = useState(90);
  const [restRunning, setRestRunning] = useState(false);

  // Auto-increment session duration timer
  useEffect(() => {
    let interval: any;
    if (activeWorkout && timerRunning) {
      interval = setInterval(() => {
        setSessionDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeWorkout, timerRunning]);

  // Rest timer countdown
  useEffect(() => {
    let interval: any;
    if (restRunning && restTimerSeconds > 0) {
      interval = setInterval(() => {
        setRestTimerSeconds(prev => prev - 1);
      }, 1000);
    } else if (restTimerSeconds === 0) {
      setRestRunning(false);
    }
    return () => clearInterval(interval);
  }, [restRunning, restTimerSeconds]);

  const handleGenerate = () => {
    if (!profile) return;
    const split = generateWorkoutSplit(
      exercises,
      profile.goal,
      profile.experience_level,
      profile.available_equipment,
      splitType
    );

    // Take the first day to generate a single routine template
    const defaultName = splitName.trim() || `${splitType} Split`;
    createWorkout(defaultName, splitType, split.schedule[0]?.exercises || []);
    
    // Track event
    try {
      trackEvent('Workout Generated', { name: defaultName, splitType });
    } catch (e) {}

    // Clear form
    setSplitName('');
    setShowGenerator(false);
    confetti({ particleCount: 50, spread: 80, colors: ['#2563eb', '#10b981'] });
  };

  const handleStartWorkout = (workout: any) => {
    // We fetch default exercises linked to this workout
    // In simulator mode or supabase, we map them
    // Let's create mock sets for tracking (3 sets per exercise in the routine)
    const initialSets: TrackingSet[] = [];
    
    // Simulating sets template load
    exercises.slice(0, 4).forEach((ex) => {
      for (let i = 0; i < 3; i++) {
        initialSets.push({
          exercise_id: ex.id,
          name: ex.name,
          weight: 20, // default start
          reps: 10,
          completed: false,
          rpe: 8,
        });
      }
    });

    // Track event
    try {
      trackEvent('Workout Started', { workoutId: workout.id, name: workout.name });
    } catch (e) {}

    setActiveWorkout(workout);
    setWorkoutSessionSets(initialSets);
    setSessionDuration(0);
    setTimerRunning(true);
    setSessionNotes('');
    setSessionRpe(8);
  };

  const handleToggleSet = (index: number) => {
    const sets = [...workoutSessionSets];
    sets[index].completed = !sets[index].completed;
    setWorkoutSessionSets(sets);

    // If set was completed, trigger rest timer countdown
    if (sets[index].completed) {
      setRestTimerMax(90);
      setRestTimerSeconds(90);
      setRestRunning(true);
    }
  };

  const handleUpdateSet = (index: number, field: keyof TrackingSet, value: any) => {
    const sets = [...workoutSessionSets];
    (sets[index] as any)[field] = value;
    setWorkoutSessionSets(sets);
  };

  const handleFinishWorkout = async () => {
    if (!activeWorkout) return;
    setTimerRunning(false);
    setRestRunning(false);

    const durationMin = Math.round(sessionDuration / 60) || 1;

    const success = await logWorkoutSession(
      activeWorkout.id,
      durationMin,
      sessionRpe,
      sessionNotes,
      workoutSessionSets
    );

    if (success) {
      // Track event
      try {
        trackEvent('Workout Completed', { 
          workoutId: activeWorkout.id, 
          name: activeWorkout.name, 
          durationMinutes: durationMin, 
          rpe: sessionRpe 
        });
      } catch (e) {}

      confetti({ particleCount: 150, spread: 80, colors: ['#2563eb', '#7c3aed', '#10b981'] });
      setActiveWorkout(null);
    }
  };

  // Group active sets by exercise name for clean UI grouping
  const getGroupedSets = () => {
    const groups: Record<string, { name: string; sets: { originalIndex: number; set: TrackingSet }[] }> = {};
    workoutSessionSets.forEach((item, idx) => {
      if (!groups[item.name]) {
        groups[item.name] = { name: item.name, sets: [] };
      }
      groups[item.name].sets.push({ originalIndex: idx, set: item });
    });
    return Object.values(groups);
  };

  return (
    <div className="space-y-6">
      
      {/* Active Workout Session Tracker View (Full-screen overlay panel styling) */}
      {activeWorkout ? (
        <div className="glass-panel p-6 rounded-3xl border border-brand-blue/30 bg-[#0c0d16] space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
            <div>
              <span className="text-[10px] bg-brand-blue/10 text-brand-blue border border-brand-blue/20 px-3 py-1 rounded-full uppercase font-bold tracking-wider">Session Active</span>
              <h2 className="text-2xl font-extrabold text-white mt-2">Tracking: {activeWorkout.name}</h2>
            </div>
            
            {/* Timer readouts */}
            <div className="flex items-center gap-4 text-xs font-bold">
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/5">
                <Timer className="w-4 h-4 text-brand-blue" />
                <span>
                  {Math.floor(sessionDuration / 60)}m {sessionDuration % 60}s
                </span>
              </div>

              {/* Countdown Rest Timer Alert */}
              {restRunning && (
                <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand-purple/10 border border-brand-purple/20 text-brand-purple animate-pulse">
                  <span>Rest: {restTimerSeconds}s</span>
                </div>
              )}
            </div>
          </div>

          {/* Grouped active exercise sets list */}
          <div className="space-y-6">
            {getGroupedSets().map((group) => {
              // Calculate progressive overload suggestion for the top exercise label
              const overloadRec = calculateProgressiveOverload([]);
              
              return (
                <div key={group.name} className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                      <Dumbbell className="w-4 h-4 text-brand-blue" />
                      {group.name}
                    </h4>
                    <span className="text-[10px] text-slate-500 font-semibold">{overloadRec.value} overload advice ready</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    {/* Headers */}
                    <div className="grid grid-cols-5 gap-2 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                      <span>Set</span>
                      <span>Weight (kg)</span>
                      <span>Reps</span>
                      <span>RPE</span>
                      <span className="text-center">Done</span>
                    </div>

                    {group.sets.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-5 gap-2 items-center">
                        <span className="font-bold text-slate-400">Set {idx + 1}</span>
                        <input 
                          type="number"
                          value={item.set.weight}
                          onChange={e => handleUpdateSet(item.originalIndex, 'weight', parseFloat(e.target.value) || 0)}
                          className="glass-input py-1 text-center font-bold"
                        />
                        <input 
                          type="number"
                          value={item.set.reps}
                          onChange={e => handleUpdateSet(item.originalIndex, 'reps', parseInt(e.target.value) || 0)}
                          className="glass-input py-1 text-center font-bold"
                        />
                        <input 
                          type="number"
                          value={item.set.rpe}
                          min="1"
                          max="10"
                          onChange={e => handleUpdateSet(item.originalIndex, 'rpe', parseInt(e.target.value) || 8)}
                          className="glass-input py-1 text-center font-bold"
                        />
                        <div className="flex justify-center">
                          <button 
                            onClick={() => handleToggleSet(item.originalIndex)}
                            className={`p-1.5 rounded-lg border transition-colors ${
                              item.set.completed 
                                ? 'bg-emerald-500/25 border-emerald-500/40 text-emerald-400' 
                                : 'border-white/10 hover:border-white/20 text-slate-500'
                            }`}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Session Summary feedback inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-white/5 pt-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2">Session Notes</label>
              <textarea 
                value={sessionNotes}
                onChange={e => setSessionNotes(e.target.value)}
                placeholder="Log energy levels, injury checks, or overall reps fatigue..."
                className="glass-input h-24 resize-none"
              />
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2">Subjective Workout RPE (1-10)</label>
              <input 
                type="range"
                min="1"
                max="10"
                value={sessionRpe}
                onChange={e => setSessionRpe(parseInt(e.target.value))}
                className="w-full accent-brand-blue bg-white/10 h-2 rounded-lg mt-3"
              />
              <div className="flex justify-between text-xs font-bold text-slate-500 mt-2">
                <span>RPE 1 (Rest)</span>
                <span className="text-brand-purple">RPE {sessionRpe}</span>
                <span>RPE 10 (Failure)</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-white/5 pt-4">
            <button 
              onClick={() => setActiveWorkout(null)}
              className="glass-btn-secondary py-3 text-xs"
            >
              Discard Session
            </button>
            <button 
              onClick={handleFinishWorkout}
              className="glass-btn-primary py-3 px-6 text-xs"
            >
              Complete Workout Log
            </button>
          </div>
        </div>
      ) : (
        
        // Routines Catalog Selection and AI Generator Entry
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-extrabold text-white">Your Training Routines</h2>
              <p className="text-xs text-slate-400">Generate custom plans or log active lifts</p>
            </div>
            <button 
              onClick={() => setShowGenerator(!showGenerator)}
              className="glass-btn-primary flex items-center gap-1 text-xs"
            >
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              AI Split Generator
            </button>
          </div>

          {/* AI Routine Generator wizard form */}
          {showGenerator && (
            <div className="glass-panel p-5 rounded-3xl border border-brand-blue/30 space-y-4">
              <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-brand-blue" />
                Configure AI Routine Calibration
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-400 font-semibold mb-2">Split Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Hypertrophy PPL Cycle"
                    value={splitName}
                    onChange={e => setSplitName(e.target.value)}
                    className="glass-input"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-2">Routine Splits type</label>
                  <select 
                    value={splitType}
                    onChange={e => setSplitType(e.target.value)}
                    className="glass-input"
                  >
                    <option value="Push Pull Legs">Push Pull Legs (PPL)</option>
                    <option value="Upper Lower">Upper Lower (UL)</option>
                    <option value="Full Body">Full Body Routine</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  onClick={() => setShowGenerator(false)}
                  className="glass-btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleGenerate}
                  className="glass-btn-primary text-xs"
                >
                  Generate & Save
                </button>
              </div>
            </div>
          )}

          {/* List of saved routines */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {workouts.map((w) => (
              <div key={w.id} className="glass-panel p-5 rounded-2xl border border-white/5 flex flex-col justify-between hover:border-white/10 transition-colors">
                <div>
                  <span className="text-[9px] bg-brand-purple/10 text-brand-purple border border-brand-purple/20 px-2.5 py-0.5 rounded-full uppercase font-bold tracking-wider">{w.split_type}</span>
                  <h4 className="font-extrabold text-white text-base mt-2">{w.name}</h4>
                  <p className="text-[11px] text-slate-400 mt-1">Saves default progression overload notes per exercise.</p>
                </div>
                
                <button 
                  onClick={() => handleStartWorkout(w)}
                  className="w-full glass-btn-primary flex items-center justify-center gap-1.5 py-2 mt-6 text-xs"
                >
                  <Play className="w-3.5 h-3.5 fill-white" /> Start Workout Session
                </button>
              </div>
            ))}

            {workouts.length === 0 && (
              <div className="md:col-span-3 p-8 border border-dashed border-white/10 rounded-3xl text-center space-y-2 text-slate-500">
                <AlertCircle className="w-8 h-8 mx-auto" />
                <h4 className="font-bold text-sm">No workouts created yet.</h4>
                <p className="text-xs">Click the AI Split Generator at the top to configure your first routine!</p>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
