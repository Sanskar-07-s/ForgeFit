// ForgeFit AI - Live Workout Session Screen (v6.0)

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFitnessData } from '../context/FitnessDataContext';
import { calculateRealtimeReadiness } from '@ai/realtime-readiness-engine';
import { fetchWearableData, WearableData } from '../services/wearables';
import { ExerciseAvatar } from '../components/gymbuddy/ExerciseAvatar';
import { MuscleActivation } from '../components/gymbuddy/MuscleActivation';
import { GlassCard } from '../components/GlassCard';
import { MotionButton } from '../components/MotionButton';
import { WearableEmptyState } from '../components/WearableEmptyState';
import { metricValidator } from '../services/metric-validator';
import { supabase } from '../services/supabase';
import {
  Sparkles,
  Flame,
  Award,
  Zap,
  Play,
  Pause,
  ArrowRight,
  CheckCircle,
  Cpu,
  Heart,
  Droplet,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  Plus,
  Trash2,
  Search,
  ArrowUp,
  ArrowDown,
  Dumbbell
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ExerciseSession {
  exercise_id?: string;
  name: string;
  muscle_group: string;
  secondary_muscles: string[];
  sets: number;
  reps: number;
  weightKg: number;
}

const DEFAULT_ROUTINE: ExerciseSession[] = [
  { name: 'Squat',            muscle_group: 'Legs',       secondary_muscles: ['Glutes', 'Core'],        sets: 4, reps: 8,  weightKg: 80 },
  { name: 'Bench Press',      muscle_group: 'Chest',      secondary_muscles: ['Triceps', 'Shoulders'], sets: 4, reps: 10, weightKg: 60 },
  { name: 'Deadlift',         muscle_group: 'Back',       secondary_muscles: ['Hamstrings', 'Core'],    sets: 3, reps: 5,  weightKg: 100 },
  { name: 'Bicep Curl',       muscle_group: 'Biceps',     secondary_muscles: ['Forearms'],             sets: 3, reps: 12, weightKg: 14 },
  { name: 'Tricep Pushdown',  muscle_group: 'Triceps',    secondary_muscles: ['Chest'],                 sets: 3, reps: 12, weightKg: 20 },
];

const PRESET_SPLITS = {
  'Full Body Power': [
    { name: 'Barbell Back Squat', muscle_group: 'Quads', secondary_muscles: ['Glutes', 'Core'], sets: 4, reps: 8, weightKg: 80 },
    { name: 'Flat Barbell Bench Press', muscle_group: 'Chest', secondary_muscles: ['Triceps', 'Front Delts'], sets: 4, reps: 10, weightKg: 60 },
    { name: 'Barbell Deadlift', muscle_group: 'Lower Back', secondary_muscles: ['Glutes', 'Hamstrings'], sets: 3, reps: 5, weightKg: 100 },
    { name: 'Barbell Bicep Curl', muscle_group: 'Biceps', secondary_muscles: ['Forearms'], sets: 3, reps: 12, weightKg: 15 },
    { name: 'Plank', muscle_group: 'Abs', secondary_muscles: ['Shoulders'], sets: 3, reps: 60, weightKg: 0 }
  ],
  'Push Day': [
    { name: 'Flat Barbell Bench Press', muscle_group: 'Chest', secondary_muscles: ['Triceps', 'Front Delts'], sets: 4, reps: 8, weightKg: 60 },
    { name: 'Overhead Barbell Press', muscle_group: 'Front Delts', secondary_muscles: ['Triceps', 'Side Delts'], sets: 3, reps: 10, weightKg: 35 },
    { name: 'Push-Ups', muscle_group: 'Chest', secondary_muscles: ['Triceps', 'Abs'], sets: 3, reps: 15, weightKg: 0 },
    { name: 'Cable Tricep Pushdown', muscle_group: 'Triceps', secondary_muscles: ['Forearms'], sets: 3, reps: 12, weightKg: 20 }
  ],
  'Pull Day': [
    { name: 'Bodyweight Pull-Ups', muscle_group: 'Lats', secondary_muscles: ['Biceps', 'Rhomboids'], sets: 4, reps: 8, weightKg: 0 },
    { name: 'Wide-Grip Lat Pulldown', muscle_group: 'Lats', secondary_muscles: ['Biceps', 'Rhomboids'], sets: 3, reps: 10, weightKg: 45 },
    { name: 'Single-Arm Dumbbell Row', muscle_group: 'Lats', secondary_muscles: ['Biceps', 'Rhomboids'], sets: 3, reps: 12, weightKg: 16 },
    { name: 'Barbell Bicep Curl', muscle_group: 'Biceps', secondary_muscles: ['Forearms'], sets: 3, reps: 12, weightKg: 15 }
  ],
  'Leg Day': [
    { name: 'Barbell Back Squat', muscle_group: 'Quads', secondary_muscles: ['Glutes', 'Hamstrings'], sets: 4, reps: 8, weightKg: 80 },
    { name: 'Dumbbell Bulgarian Split Squat', muscle_group: 'Quads', secondary_muscles: ['Glutes'], sets: 3, reps: 10, weightKg: 12 },
    { name: 'Romanian Deadlift', muscle_group: 'Hamstrings', secondary_muscles: ['Glutes', 'Lower Back'], sets: 3, reps: 10, weightKg: 40 },
    { name: 'Standing Calf Raise', muscle_group: 'Calves', secondary_muscles: [], sets: 3, reps: 15, weightKg: 15 }
  ],
  'Core Specialist': [
    { name: 'Plank', muscle_group: 'Abs', secondary_muscles: ['Shoulders', 'Glutes'], sets: 3, reps: 60, weightKg: 0 },
    { name: 'Hanging Leg Raise', muscle_group: 'Abs', secondary_muscles: ['Obliques'], sets: 3, reps: 12, weightKg: 0 },
    { name: 'Push-Ups', muscle_group: 'Chest', secondary_muscles: ['Triceps', 'Abs'], sets: 3, reps: 15, weightKg: 0 }
  ]
};

export default function WorkoutSession() {
  const { profile } = useAuth();
  const { workouts, exercises, workoutLogs, nutritionLogs, recoveryLogs, logWorkoutSession } = useFitnessData();
  const navigate = useNavigate();
  const location = useLocation();

  // Setup/Customizer States
  const [sessionStarted, setSessionStarted] = useState(false);
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string>('live_session_workout');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingExercises, setLoadingExercises] = useState(false);

  // Active workout states
  const [routine, setRoutine] = useState<ExerciseSession[]>(DEFAULT_ROUTINE);
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [workoutFinished, setWorkoutFinished] = useState(false);
  const [completedSetsTracker, setCompletedSetsTracker] = useState<any[]>([]);

  // Timer state
  const [timerActive, setTimerActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(90);
  const [totalDuration, setTotalDuration] = useState(0); // in seconds

  // Real-time metrics
  const [coachStyle, setCoachStyle] = useState('friendly_bro');
  const [wearable, setWearable] = useState<WearableData | null>(null);
  const [chatLog, setChatLog] = useState<string[]>([]);
  const [coachSpeaking, setCoachSpeaking] = useState(false);

  const currentExercise = routine[exerciseIndex] || routine[0] || DEFAULT_ROUTINE[0];

  // ── 0. Parse router state parameters for auto-population ──
  useEffect(() => {
    const initializeSession = async () => {
      if (location.state?.workout) {
        const w = location.state.workout;
        setSelectedWorkoutId(w.id);
        setLoadingExercises(true);
        try {
          const { data: rows } = await supabase
            .from('workout_exercises')
            .select('*')
            .eq('workout_id', w.id);
          
          if (rows && rows.length > 0) {
            const mapped = rows.map((row: any) => {
              const ex = exercises.find(e => e.id === row.exercise_id);
              return {
                exercise_id: row.exercise_id,
                name: ex?.name || 'Unknown Exercise',
                muscle_group: ex?.muscle_group || 'Other',
                secondary_muscles: ex?.secondary_muscles || [],
                sets: row.sets || 3,
                reps: parseInt(row.reps) || 10,
                weightKg: 20
              };
            });
            setRoutine(mapped);
          } else {
            // Split fallback
            const splitLower = (w.split_type || '').toLowerCase();
            let fallbackNames: string[] = [];
            if (splitLower.includes('legs')) fallbackNames = ['Barbell Back Squat', 'Standing Calf Raise', 'Plank'];
            else if (splitLower.includes('push')) fallbackNames = ['Flat Barbell Bench Press', 'Push-Ups', 'Cable Tricep Pushdown'];
            else if (splitLower.includes('pull')) fallbackNames = ['Wide-Grip Lat Pulldown', 'Bodyweight Pull-Ups', 'Barbell Bicep Curl'];
            else fallbackNames = ['Flat Barbell Bench Press', 'Barbell Back Squat', 'Plank'];
            
            const mapped = fallbackNames.map(name => {
              const ex = exercises.find(e => e.name === name);
              return {
                exercise_id: ex?.id || crypto.randomUUID(),
                name: name,
                muscle_group: ex?.muscle_group || 'Other',
                secondary_muscles: ex?.secondary_muscles || [],
                sets: 3,
                reps: 10,
                weightKg: 20
              };
            });
            setRoutine(mapped);
          }
        } catch (err) {
          console.error('Failed to resolve routine exercises:', err);
        } finally {
          setLoadingExercises(false);
        }
      } else if (location.state?.quickExerciseName) {
        const exName = location.state.quickExerciseName;
        const ex = exercises.find(e => e.name.toLowerCase() === exName.toLowerCase() || e.name.toLowerCase().includes(exName.toLowerCase()));
        if (ex) {
          setSelectedWorkoutId('live_session_workout');
          setRoutine([{
            exercise_id: ex.id,
            name: ex.name,
            muscle_group: ex.muscle_group,
            secondary_muscles: ex.secondary_muscles || [],
            sets: 3,
            reps: 10,
            weightKg: 20
          }]);
        }
      }
    };

    if (exercises.length > 0) {
      initializeSession();
    }
  }, [location.state, exercises]);

  // ── 1. Initialize & Sync wearable ──
  useEffect(() => {
    const savedCoach = localStorage.getItem('forgefit_gym_buddy_coach');
    if (savedCoach) setCoachStyle(savedCoach);

    const syncMetrics = async () => {
      const wData = await fetchWearableData();
      setWearable(wData);
    };
    syncMetrics();
  }, []);

  // Workout Session Timer
  useEffect(() => {
    let interval: any;
    if (sessionStarted && !workoutFinished) {
      interval = setInterval(() => {
        setTotalDuration((d) => d + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [sessionStarted, workoutFinished]);

  // ── 2. Handle Coach speech dynamically ──
  useEffect(() => {
    if (!sessionStarted || !currentExercise) return;
    triggerCoachLine('welcome');
  }, [exerciseIndex, sessionStarted]);

  // ── 3. Rest Timer logic ──
  useEffect(() => {
    let t: any;
    if (timerActive && timeLeft > 0) {
      t = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0) {
      setTimerActive(false);
      setTimeLeft(90);
      triggerCoachLine('timer_finished');
    }
    return () => clearTimeout(t);
  }, [timerActive, timeLeft]);

  const triggerCoachLine = (triggerType: 'welcome' | 'set_complete' | 'timer_finished' | 'finished') => {
    setCoachSpeaking(true);
    let line = '';

    const eName = currentExercise?.name;

    if (coachStyle === 'friendly_bro') {
      switch (triggerType) {
        case 'welcome':
          line = `Let's crush some ${eName}s bro! Focus on that squeeze! 💪`;
          break;
        case 'set_complete':
          line = `Monster set right there! Get some water and rest up! 🔥`;
          break;
        case 'timer_finished':
          line = `Rest is over, let's get back to the grind! 👊`;
          break;
        case 'finished':
          line = `We did it! Absolute legend, great workout! Let's get that post-workout shake! 🏆`;
          break;
      }
    } else if (coachStyle === 'strict_coach') {
      switch (triggerType) {
        case 'welcome':
          line = `Next exercise: ${eName}. Correct posture, lock your joints. Let's go.`;
          break;
        case 'set_complete':
          line = `Set recorded. Keep breathing. Rest timer started, don't sit down.`;
          break;
        case 'timer_finished':
          line = `Time is up. Hands off your knees. Next set, push hard.`;
          break;
        case 'finished':
          line = `Workout finished. Routine complete. Solid effort, do not skip stretching.`;
          break;
      }
    } else {
      // Science Coach
      switch (triggerType) {
        case 'welcome':
          line = `Initiating ${eName}. Target muscle groups are highlighted on your activation chart. Focus on tempo.`;
          break;
        case 'set_complete':
          line = `Set registered. Heart rate tracking at ${wearable?.heartRate || 120} bpm. Beginning 90-second glycogen recovery window.`;
          break;
        case 'timer_finished':
          line = `Glycogen replenishment phase finished. Resume work set.`;
          break;
        case 'finished':
          line = `Volume target achieved. Hypertrophic stimulus satisfied. Record loaded.`;
          break;
      }
    }

    setChatLog((prev) => [...prev, line]);
    setTimeout(() => setCoachSpeaking(false), 2000);
  };

  const handleCompleteSet = () => {
    confetti({ particleCount: 15, spread: 30, origin: { y: 0.8 } });
    
    // Save telemetry log for this set
    const newLoggedSet = {
      exercise_id: currentExercise.exercise_id || 'ex-default',
      name: currentExercise.name,
      weight: currentExercise.weightKg,
      reps: currentExercise.reps,
      completed: true,
      rpe: coachStyle === 'strict_coach' ? 9 : 8
    };
    setCompletedSetsTracker((prev) => [...prev, newLoggedSet]);

    if (currentSet < currentExercise.sets) {
      setCurrentSet((s) => s + 1);
      setTimerActive(true);
      setTimeLeft(90);
      triggerCoachLine('set_complete');
    } else {
      // Move to next exercise
      if (exerciseIndex < routine.length - 1) {
        setExerciseIndex((i) => i + 1);
        setCurrentSet(1);
        setTimerActive(false);
      } else {
        // Workout fully complete!
        handleFinishWorkout();
      }
    }
  };

  const handleFinishWorkout = async () => {
    setWorkoutFinished(true);
    triggerCoachLine('finished');
    confetti({ particleCount: 150, spread: 80, origin: { y: 0.5 } });

    // Save workout split to database
    try {
      const durationMin = Math.round(totalDuration / 60) || 45;

      let finalSets = [...completedSetsTracker];
      if (finalSets.length === 0) {
        // Auto-populate all routine sets as completed
        routine.forEach((ex) => {
          for (let i = 0; i < ex.sets; i++) {
            finalSets.push({
              exercise_id: ex.exercise_id || 'ex-default',
              name: ex.name,
              weight: ex.weightKg,
              reps: ex.reps,
              completed: true,
              rpe: 8
            });
          }
        });
      }

      await logWorkoutSession(
        selectedWorkoutId,
        durationMin,
        7, // RPE
        `Session completed with AI Coach (${coachStyle})`,
        finalSets
      );
    } catch (err) {
      console.error('Failed to log workout session:', err);
    }
  };

  // Selection/Customizer Actions
  const handleSelectSavedWorkout = async (workout: any) => {
    setSelectedWorkoutId(workout.id);
    setLoadingExercises(true);
    try {
      const { data: rows } = await supabase
        .from('workout_exercises')
        .select('*')
        .eq('workout_id', workout.id);
      
      if (rows && rows.length > 0) {
        const mapped = rows.map((row: any) => {
          const ex = exercises.find(e => e.id === row.exercise_id);
          return {
            exercise_id: row.exercise_id,
            name: ex?.name || 'Unknown Exercise',
            muscle_group: ex?.muscle_group || 'Other',
            secondary_muscles: ex?.secondary_muscles || [],
            sets: row.sets || 3,
            reps: parseInt(row.reps) || 10,
            weightKg: 20
          };
        });
        setRoutine(mapped);
      } else {
        const splitLower = (workout.split_type || '').toLowerCase();
        let fallbackNames: string[] = [];
        if (splitLower.includes('legs')) fallbackNames = ['Barbell Back Squat', 'Standing Calf Raise', 'Plank'];
        else if (splitLower.includes('push')) fallbackNames = ['Flat Barbell Bench Press', 'Push-Ups', 'Cable Tricep Pushdown'];
        else if (splitLower.includes('pull')) fallbackNames = ['Wide-Grip Lat Pulldown', 'Bodyweight Pull-Ups', 'Barbell Bicep Curl'];
        else fallbackNames = ['Flat Barbell Bench Press', 'Barbell Back Squat', 'Plank'];
        
        const mapped = fallbackNames.map(name => {
          const ex = exercises.find(e => e.name === name);
          return {
            exercise_id: ex?.id || crypto.randomUUID(),
            name: name,
            muscle_group: ex?.muscle_group || 'Other',
            secondary_muscles: ex?.secondary_muscles || [],
            sets: 3,
            reps: 10,
            weightKg: 20
          };
        });
        setRoutine(mapped);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingExercises(false);
    }
  };

  const handleSelectPreset = (presetName: keyof typeof PRESET_SPLITS) => {
    setSelectedWorkoutId('live_session_workout');
    const presetExercises = PRESET_SPLITS[presetName];
    const mapped = presetExercises.map(pe => {
      const dbEx = exercises.find(e => e.name.toLowerCase().includes(pe.name.toLowerCase()) || pe.name.toLowerCase().includes(e.name.toLowerCase()));
      return {
        exercise_id: dbEx?.id || crypto.randomUUID(),
        name: dbEx?.name || pe.name,
        muscle_group: dbEx?.muscle_group || pe.muscle_group,
        secondary_muscles: dbEx?.secondary_muscles || pe.secondary_muscles,
        sets: pe.sets,
        reps: pe.reps,
        weightKg: pe.weightKg
      };
    });
    setRoutine(mapped);
  };

  const handleAddExerciseToRoutine = (ex: any) => {
    const newItem = {
      exercise_id: ex.id,
      name: ex.name,
      muscle_group: ex.muscle_group,
      secondary_muscles: ex.secondary_muscles || [],
      sets: 3,
      reps: 10,
      weightKg: 20
    };
    setRoutine(prev => [...prev, newItem]);
    setSearchQuery('');
  };

  const handleUpdateRoutineItem = (index: number, field: 'sets' | 'reps' | 'weightKg', value: number) => {
    const updated = [...routine];
    updated[index] = { ...updated[index], [field]: value };
    setRoutine(updated);
  };

  const handleRemoveRoutineItem = (index: number) => {
    setRoutine(prev => prev.filter((_, i) => i !== index));
    if (exerciseIndex >= routine.length - 1 && exerciseIndex > 0) {
      setExerciseIndex(prev => prev - 1);
    }
  };

  const handleMoveItem = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === routine.length - 1) return;
    const updated = [...routine];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setRoutine(updated);
  };

  if (!profile) return null;

  // Real-time readiness calculation based on smart wearable sync or manual logs
  const lastRecoveryLog = recoveryLogs[0] || { sleep_hours: 7.5, soreness_score: 3 };
  const hrMetric = metricValidator.getMetric<number>('heartrate');
  const sleepMetric = metricValidator.getMetric<number>('sleep');
  const recoveryMetric = metricValidator.getMetric<number>('recovery');

  const recoveryScoreVal = recoveryMetric ? recoveryMetric.value : (lastRecoveryLog.sleep_hours * 11 + 10);
  const sleepHoursVal = sleepMetric ? sleepMetric.value : (lastRecoveryLog.sleep_hours || 7.5);
  const heartRateVal = hrMetric ? hrMetric.value : 68;

  const readiness = calculateRealtimeReadiness(
    sleepHoursVal,
    Math.min(recoveryScoreVal, 100),
    lastRecoveryLog.soreness_score || 3,
    profile.streak || 0,
    heartRateVal
  );

  // Hydration status reminder
  const waterToday = nutritionLogs.find(n => new Date(n.logged_at).toISOString().split('T')[0] === new Date().toISOString().split('T')[0])?.water_ml || 0;
  const isDehydrated = waterToday < 1500;

  // Filter exercises for selector search
  const filteredExercises = exercises.filter(ex => 
    ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ex.muscle_group.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in pb-12" role="region" aria-label="Live Workout Session Terminal">
      
      {!sessionStarted ? (
        // ── WORKOUT SETUP SCREEN ──
        <div className="space-y-6">
          <GlassCard className="p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-white/5" glowColor="#8B5CF6">
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs text-brand-cyan font-bold uppercase tracking-wider">
                <Cpu className="w-4 h-4" /> Live AI Coach Room Setup
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white">Configure Your Workout</h1>
              <p className="text-xs text-slate-500 max-w-xl">
                Select a routine, modify sets/reps/weights, or add specific exercises. Your AI Coach will guide your pacing and biomechanics.
              </p>
            </div>
            <div className="shrink-0 flex gap-2">
              <button
                onClick={() => navigate('/gym-buddy')}
                className="glass-btn-secondary text-xs py-2.5 px-4 font-bold"
              >
                Back to Gym Buddy
              </button>
            </div>
          </GlassCard>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Preset and saved selection options */}
            <div className="lg:col-span-5 space-y-4">
              
              {/* Saved Workout Splits */}
              <GlassCard className="p-5 rounded-2xl border border-white/5 space-y-4" glowColor="#8B5CF6">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Dumbbell className="w-4 h-4 text-brand-purple" /> Your Saved Splits
                </h3>
                <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                  {workouts.map((w) => (
                    <div key={w.id} className="flex justify-between items-center p-2.5 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                      <div>
                        <span className="text-[9px] bg-brand-purple/15 text-brand-purple px-2.5 py-0.5 rounded-full font-black uppercase tracking-wide">{w.split_type}</span>
                        <h4 className="text-xs font-extrabold text-white mt-1.5">{w.name}</h4>
                      </div>
                      <button
                        onClick={() => handleSelectSavedWorkout(w)}
                        className="text-[10px] bg-brand-cyan/20 border border-brand-cyan/30 text-brand-cyan font-bold py-1 px-3 rounded-lg hover:bg-brand-cyan hover:text-black transition-all"
                      >
                        Select
                      </button>
                    </div>
                  ))}
                  {workouts.length === 0 && (
                    <p className="text-xs text-slate-500 italic py-2">No custom splits saved yet. Use presets below!</p>
                  )}
                </div>
              </GlassCard>

              {/* Preset splits */}
              <GlassCard className="p-5 rounded-2xl border border-white/5 space-y-4" glowColor="#22D3EE">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-brand-cyan" /> Quick-Start Presets
                </h3>
                <div className="grid grid-cols-2 gap-2 text-[10px] font-bold">
                  {Object.keys(PRESET_SPLITS).map((presetName) => (
                    <button
                      key={presetName}
                      onClick={() => handleSelectPreset(presetName as any)}
                      className="p-3 bg-white/5 rounded-xl border border-white/5 hover:border-brand-cyan/35 text-slate-300 hover:text-white text-left transition-colors"
                    >
                      {presetName}
                    </button>
                  ))}
                </div>
              </GlassCard>

              {/* Individual exercise search */}
              <GlassCard className="p-5 rounded-2xl border border-white/5 space-y-3" glowColor="#8B5CF6">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Search & Add Exercises</h3>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search Chest, Legs, Squat..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="glass-input pl-8 py-1.5 text-xs"
                  />
                </div>
                <div className="space-y-1 max-h-[160px] overflow-y-auto pr-1">
                  {filteredExercises.slice(0, 8).map((ex) => (
                    <button
                      key={ex.id}
                      onClick={() => handleAddExerciseToRoutine(ex)}
                      className="w-full flex justify-between items-center p-2 rounded-lg bg-white/[0.02] hover:bg-white/5 text-left text-xs font-bold transition-all group"
                    >
                      <div>
                        <span className="text-white group-hover:text-brand-cyan transition-colors">{ex.name}</span>
                        <span className="block text-[8px] text-slate-500 uppercase mt-0.5">{ex.muscle_group}</span>
                      </div>
                      <Plus className="w-3.5 h-3.5 text-slate-500 group-hover:text-brand-cyan" />
                    </button>
                  ))}
                </div>
              </GlassCard>
            </div>

            {/* Right Column: Active sequence & Builder list */}
            <div className="lg:col-span-7">
              <GlassCard className="p-5 rounded-2xl border border-white/5 space-y-4 flex flex-col justify-between min-h-[450px]" glowColor="#22D3EE">
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Routine Sequence ({routine.length} exercises)</h3>
                    {routine.length > 0 && (
                      <button
                        onClick={() => setRoutine([])}
                        className="text-[10px] font-bold text-brand-rose hover:underline"
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  {loadingExercises ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-500">
                      <div className="w-6 h-6 border-2 border-brand-cyan border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs">Loading routine exercises...</span>
                    </div>
                  ) : routine.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-500 text-center">
                      <Dumbbell className="w-10 h-10 text-slate-600 animate-pulse" />
                      <div className="space-y-1">
                        <h4 className="font-bold text-xs text-white">Your Routine is Empty</h4>
                        <p className="text-[10px] text-slate-500 max-w-[240px] leading-relaxed mt-1">
                          Click on a saved split, choose a preset, or search and add individual movements to design your session sequence.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1 text-xs">
                      {routine.map((ex, idx) => (
                        <div key={idx} className="p-3 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between gap-3 hover:border-white/10 transition-colors">
                          
                          {/* Order buttons */}
                          <div className="flex flex-col gap-0.5 shrink-0">
                            <button
                              disabled={idx === 0}
                              onClick={() => handleMoveItem(idx, 'up')}
                              className={`p-0.5 rounded hover:bg-white/5 ${idx === 0 ? 'text-slate-700' : 'text-slate-400 hover:text-white'}`}
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              disabled={idx === routine.length - 1}
                              onClick={() => handleMoveItem(idx, 'down')}
                              className={`p-0.5 rounded hover:bg-white/5 ${idx === routine.length - 1 ? 'text-slate-700' : 'text-slate-400 hover:text-white'}`}
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Exercise Details */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-white text-xs truncate">{ex.name}</h4>
                            <span className="inline-block text-[8px] bg-brand-cyan/10 text-brand-cyan px-1.5 py-0.5 rounded uppercase font-black mt-1">{ex.muscle_group}</span>
                          </div>

                          {/* Parameters Edit Inputs */}
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="w-14 text-center">
                              <span className="text-[8px] text-slate-500 uppercase block font-bold">Sets</span>
                              <input
                                type="number"
                                min="1"
                                max="10"
                                value={ex.sets}
                                onChange={(e) => handleUpdateRoutineItem(idx, 'sets', Math.max(1, parseInt(e.target.value) || 3))}
                                className="w-full glass-input text-center text-xs py-0.5 font-bold mt-0.5"
                              />
                            </div>
                            <div className="w-14 text-center">
                              <span className="text-[8px] text-slate-500 uppercase block font-bold">Reps</span>
                              <input
                                type="number"
                                min="1"
                                max="100"
                                value={ex.reps}
                                onChange={(e) => handleUpdateRoutineItem(idx, 'reps', Math.max(1, parseInt(e.target.value) || 10))}
                                className="w-full glass-input text-center text-xs py-0.5 font-bold mt-0.5"
                              />
                            </div>
                            <div className="w-16 text-center">
                              <span className="text-[8px] text-slate-500 uppercase block font-bold">Weight (kg)</span>
                              <input
                                type="number"
                                min="0"
                                max="500"
                                value={ex.weightKg}
                                onChange={(e) => handleUpdateRoutineItem(idx, 'weightKg', Math.max(0, parseFloat(e.target.value) || 0))}
                                className="w-full glass-input text-center text-xs py-0.5 font-bold mt-0.5"
                              />
                            </div>
                          </div>

                          {/* Delete button */}
                          <button
                            onClick={() => handleRemoveRoutineItem(idx)}
                            className="p-1.5 rounded-lg border border-white/5 hover:border-brand-rose/40 text-slate-500 hover:text-brand-rose transition-colors shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-white/5">
                  <button
                    disabled={routine.length === 0}
                    onClick={() => {
                      setSessionStarted(true);
                      triggerCoachLine('welcome');
                    }}
                    className="w-full glass-btn-primary py-3.5 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Zap className="w-4 h-4 fill-white animate-pulse" /> Start Live AI Coach Session
                  </button>
                </div>
              </GlassCard>
            </div>
          </div>
        </div>
      ) : (
        // ── ACTIVE SESSION SCREEN ──
        <>
          {/* Top Session Progress bar */}
          <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden relative z-10">
            <div
              className="progress-fill-cyan h-full transition-all duration-700"
              style={{ width: `${((exerciseIndex + (currentSet - 1) / currentExercise?.sets) / routine.length) * 100}%` }}
            />
          </div>

          {workoutFinished ? (
            <div className="max-w-md mx-auto text-center space-y-6 py-12 animate-scale-in relative z-10">
              <div className="w-20 h-20 rounded-3xl bg-brand-emerald/10 border border-brand-emerald/20 flex items-center justify-center text-4xl mx-auto shadow-glow-cyan animate-bounce">
                🏆
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-black text-white">Workout Complete!</h1>
                <p className="text-sm text-slate-400">You earned +50 XP and finished in {Math.round(totalDuration / 60)} minutes.</p>
              </div>

              <GlassCard className="p-5 text-left space-y-3">
                <h3 className="font-bold text-white text-sm">Session Summary</h3>
                <div className="divide-y divide-white/5 text-xs">
                  {routine.map((ex, i) => (
                    <div key={i} className="flex justify-between py-2 text-slate-300">
                      <span>{ex.name}</span>
                      <span className="font-bold text-brand-cyan">{ex.sets} sets x {ex.reps} reps ({ex.weightKg}kg)</span>
                    </div>
                  ))}
                </div>
              </GlassCard>

              <MotionButton onClick={() => navigate('/gym-buddy')} variant="primary" fullWidth size="lg">
                Back to Buddy Hub
              </MotionButton>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
              
              {/* ── Left Column: 3D Coach Avatar ── */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Coach Demo Screen</h3>
                  <span className="text-[10px] font-black uppercase text-brand-cyan px-2 py-0.5 rounded bg-brand-cyan/10 border border-brand-cyan/20">
                    Live Rendering
                  </span>
                </div>
                
                <ExerciseAvatar exerciseName={currentExercise.name} />

                {/* In-workout statistics cards */}
                <GlassCard className="p-5 rounded-2xl grid grid-cols-2 gap-4" glowColor="#8B5CF6">
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase font-bold text-slate-500">Timer</span>
                    <div className="text-lg font-black text-white">
                      {Math.floor(totalDuration / 60)}:{(totalDuration % 60).toString().padStart(2, '0')}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase font-bold text-slate-500">Heart Rate</span>
                    <div className={`text-lg font-black flex items-center gap-1.5 ${hrMetric ? 'text-brand-rose' : 'text-slate-600'}`}>
                      <Heart className={`w-4 h-4 ${hrMetric ? 'fill-brand-rose animate-pulse' : 'text-slate-600'}`} />
                      <span>{hrMetric ? `${hrMetric.value} bpm` : 'No Live Data'}</span>
                    </div>
                  </div>
                </GlassCard>
              </div>

              {/* ── Center Column: Controls, Reps & Muscle Highlight ── */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Active Exercise</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Focus on completing sets</p>
                  </div>
                  <button
                    onClick={() => {
                      if (window.confirm("Are you sure you want to stop this workout session early?")) {
                        handleFinishWorkout();
                      }
                    }}
                    className="text-[10px] font-bold text-brand-rose hover:underline"
                  >
                    Finish Session Early
                  </button>
                </div>

                <GlassCard className="p-6 rounded-2xl text-center space-y-6" glowColor="#22D3EE">
                  <div>
                    <h1 className="text-2xl font-black text-white">{currentExercise.name}</h1>
                    <p className="text-xs text-slate-500 mt-1">Target: {currentExercise.weightKg} kg</p>
                  </div>

                  {/* Set Counter display */}
                  <div className="flex items-center justify-center gap-6 py-2">
                    <div>
                      <div className="text-slate-500 text-[10px] uppercase font-bold">Set</div>
                      <div className="text-4xl font-black text-white mt-1">
                        {currentSet} <span className="text-lg text-slate-600">/ {currentExercise.sets}</span>
                      </div>
                    </div>
                    <div className="w-px h-10 bg-white/10" />
                    <div>
                      <div className="text-slate-500 text-[10px] uppercase font-bold">Reps Target</div>
                      <div className="text-4xl font-black text-brand-cyan mt-1">
                        {currentExercise.reps}
                      </div>
                    </div>
                  </div>

                  {/* Active Set Weight/Reps Adjuster */}
                  <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto py-2 border-t border-white/5">
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold text-slate-500 block">Logged Weight (kg)</label>
                      <input
                        type="number"
                        min="0"
                        max="500"
                        value={currentExercise.weightKg}
                        onChange={(e) => handleUpdateRoutineItem(exerciseIndex, 'weightKg', Math.max(0, parseFloat(e.target.value) || 0))}
                        className="w-full glass-input text-center font-bold py-1 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold text-slate-500 block">Logged Reps</label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={currentExercise.reps}
                        onChange={(e) => handleUpdateRoutineItem(exerciseIndex, 'reps', Math.max(1, parseInt(e.target.value) || 0))}
                        className="w-full glass-input text-center font-bold py-1 text-sm"
                      />
                    </div>
                  </div>

                  {/* Rest countdown or complete CTA */}
                  {timerActive ? (
                    <div className="bg-brand-purple/10 border border-brand-purple/20 p-4 rounded-xl space-y-2">
                      <div className="text-xs font-bold text-brand-purple uppercase tracking-wider animate-pulse">
                        Resting Phase
                      </div>
                      <div className="text-3xl font-black text-white">
                        {timeLeft} <span className="text-sm font-normal text-slate-500">seconds left</span>
                      </div>
                      <MotionButton onClick={() => setTimeLeft(0)} variant="secondary" size="sm">
                        Skip Rest
                      </MotionButton>
                    </div>
                  ) : (
                    <MotionButton onClick={handleCompleteSet} variant="primary" size="lg" fullWidth>
                      <CheckCircle className="w-5 h-5" /> Complete Set {currentSet}
                    </MotionButton>
                  )}
                </GlassCard>

                <MuscleActivation
                  exercise={{
                    id: 'active_session_ex',
                    name: currentExercise.name,
                    muscle_group: currentExercise.muscle_group,
                    secondary_muscles: currentExercise.secondary_muscles,
                    difficulty: 'Intermediate',
                    equipment: 'Dumbbell',
                    instructions: [],
                    common_mistakes: [],
                    coaching_tips: [],
                    created_at: '',
                  }}
                />
              </div>

              {/* ── Right Column: Coach Chat & Recommendations ── */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Coach Feed</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Real-time trainer adjustments & telemetry</p>
                </div>

                {/* Coach Speech Bubble Feed */}
                <GlassCard className="p-5 rounded-2xl flex flex-col justify-between h-[300px]" glowColor="#8B5CF6">
                  <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
                    {chatLog.map((line, i) => (
                      <div key={i} className="flex gap-2 items-start animate-fade-up">
                        <div className="w-6 h-6 rounded-lg bg-brand-purple/10 flex items-center justify-center shrink-0 font-black text-brand-purple text-[10px]">
                          Buddy
                        </div>
                        <div className="bubble-coach px-3 py-2 text-slate-300 leading-relaxed rounded-xl">
                          {line}
                        </div>
                      </div>
                    ))}
                  </div>

                  {coachSpeaking && (
                    <div className="flex gap-1 py-2 justify-center">
                      <div className="typing-dot" />
                      <div className="typing-dot" />
                      <div className="typing-dot" />
                    </div>
                  )}
                </GlassCard>

                {/* Biometric readiness telemetry */}
                {recoveryMetric ? (
                  <GlassCard className="p-5 rounded-2xl space-y-3 shadow-lg" glowColor="#EC4899">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-white">Biometric Readiness</span>
                      <span className="font-black text-brand-cyan">{readiness.readinessScore}/100</span>
                    </div>
                    <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                      <div className="progress-fill-cyan h-full" style={{ width: `${readiness.readinessScore}%` }} />
                    </div>
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      {readiness.recommendation} <strong>{readiness.workoutAdjustment}</strong>
                    </p>
                    <div className="text-[9px] text-slate-500 text-right">Source: {recoveryMetric.source}</div>
                  </GlassCard>
                ) : (
                  <WearableEmptyState metricName="Biometric Readiness" icon="🔋" />
                )}

                {/* Hydration warning card */}
                {isDehydrated && (
                  <GlassCard className="p-4 rounded-xl flex gap-3 items-start border-brand-rose bg-brand-rose/5" glowColor="#EF4444">
                    <Droplet className="w-5 h-5 text-brand-rose shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-white text-xs">Hydration Alert</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                        You have only logged {waterToday}ml of water today. Drink 350ml now to prevent muscle fatigue.
                      </p>
                    </div>
                  </GlassCard>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

