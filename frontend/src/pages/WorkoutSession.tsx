// ForgeFit AI - Live Workout Session Screen (v5.0)

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  AlertTriangle
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ExerciseSession {
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

export default function WorkoutSession() {
  const { profile } = useAuth();
  const { workoutLogs, nutritionLogs, recoveryLogs, logWorkoutSession } = useFitnessData();
  const navigate = useNavigate();

  const [routine, setRoutine] = useState<ExerciseSession[]>(DEFAULT_ROUTINE);
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [workoutFinished, setWorkoutFinished] = useState(false);

  // Timer state
  const [timerActive, setTimerActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(90);
  const [totalDuration, setTotalDuration] = useState(0); // in seconds

  // Real-time metrics
  const [coachStyle, setCoachStyle] = useState('friendly_bro');
  const [wearable, setWearable] = useState<WearableData | null>(null);
  const [chatLog, setChatLog] = useState<string[]>([]);
  const [coachSpeaking, setCoachSpeaking] = useState(false);

  const currentExercise = routine[exerciseIndex];

  // ── 1. Initialize & Sync wearable ──
  useEffect(() => {
    const savedCoach = localStorage.getItem('forgefit_gym_buddy_coach');
    if (savedCoach) setCoachStyle(savedCoach);

    const syncMetrics = async () => {
      const wData = await fetchWearableData();
      setWearable(wData);
    };
    syncMetrics();

    // Increment overall workout timer
    const interval = setInterval(() => {
      setTotalDuration((d) => d + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // ── 2. Handle Coach speech dynamically ──
  useEffect(() => {
    if (!currentExercise) return;
    triggerCoachLine('welcome');
  }, [exerciseIndex]);

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
      await logWorkoutSession(
        'default_workout_session',
        durationMin,
        7, // RPE
        `Session completed with AI Coach (${coachStyle})`,
        routine.map((r) => ({
          name: r.name,
          sets: r.sets,
          reps: r.reps,
          weight_kg: r.weightKg,
        }))
      );
    } catch (err) {
      console.error('Failed to log workout session:', err);
    }
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

  return (
    <div className="space-y-6" role="region" aria-label="Live Workout Session Terminal">
      
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
              {routine.map((ex) => (
                <div key={ex.name} className="flex justify-between py-2 text-slate-300">
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
            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Active Exercise</h3>
              <p className="text-xs text-slate-500 mt-0.5">Focus on completing sets</p>
            </div>

            <GlassCard className="p-6 rounded-2xl text-center space-y-6" glowColor="#22D3EE">
              <div>
                <h1 className="text-2xl font-black text-white">{currentExercise.name}</h1>
                <p className="text-xs text-slate-500 mt-1">Recommended: {currentExercise.weightKg} kg</p>
              </div>

              {/* Set Counter display */}
              <div className="flex items-center justify-center gap-6 py-4">
                <div>
                  <div className="text-slate-500 text-[10px] uppercase font-bold">Set</div>
                  <div className="text-4xl font-black text-white mt-1">
                    {currentSet} <span className="text-lg text-slate-600">/ {currentExercise.sets}</span>
                  </div>
                </div>
                <div className="w-px h-10 bg-white/10" />
                <div>
                  <div className="text-slate-500 text-[10px] uppercase font-bold">Reps</div>
                  <div className="text-4xl font-black text-brand-cyan mt-1">
                    {currentExercise.reps}
                  </div>
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
    </div>
  );
}
