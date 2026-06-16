// ForgeFit AI - AI Gym Buddy Hub & 3D Mannequin Trainer (v5.1)

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFitnessData } from '../context/FitnessDataContext';
import { metricValidator } from '../services/metric-validator';
import { deviceManager } from '../services/device-manager';
import { StreakMilestones } from '../components/streak/StreakMilestones';
import { AchievementsBoard } from '../components/streak/AchievementsBoard';
import { FitnessAvatar3D } from '../components/FitnessAvatar3D';
import { MuscleHeatmap } from '../components/MuscleHeatmap';
import { GlassCard } from '../components/GlassCard';
import { MotionButton } from '../components/MotionButton';
import { checkCameraAnalysisStatus } from '@ai/camera-analysis-engine';
import {
  Sparkles,
  Flame,
  Award,
  Zap,
  Cpu,
  Smartphone,
  Play,
  RotateCw,
  Camera,
  Info,
  Clock,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CoachPersonality {
  id: string;
  name: string;
  avatar: string;
  description: string;
  quote: string;
  color: string;
}

const COACHES: CoachPersonality[] = [
  { id: 'friendly_bro', name: 'Friendly Bro', avatar: '👊', description: 'Energetic, supportive, and loves hyper-motivation.', quote: "Great set! Let's hit one more reps. You're doing awesome!", color: '#22D3EE' },
  { id: 'strict_coach', name: 'Strict Coach', avatar: '⚡', description: 'No-nonsense discipline. Keeps you focused and moving.', quote: "Focus. Back straight. Two reps left. No excuses.", color: '#EF4444' },
  { id: 'science_coach', name: 'Science Coach', avatar: '🔬', description: 'Data-driven biomechanics and RPE optimization.', quote: "RPE increasing. Rest 90 seconds. Maintain form quality.", color: '#8B5CF6' },
];

const EXERCISES = [
  { name: 'Squat', description: 'Compound lower body movement targeting quadriceps, glutes, and core. Keep hips back and chest elevated.' },
  { name: 'Bench Press', description: 'Horizontal pressing compound exercise targeting pectorals, anterior deltoids, and triceps.' },
  { name: 'Deadlift', description: 'Posterior chain compound lift targeting hamstrings, gluteals, spinal erectors, and grip strength.' },
  { name: 'Pull Up', description: 'Vertical pulling bodyweight exercise focusing on latissimus dorsi, rhomboids, and biceps.' },
  { name: 'Push Up', description: 'Calisthenics compound press isolating pectorals, triceps, and core stabilization.' },
  { name: 'Shoulder Press', description: 'Vertical press compound exercise targeting the deltoids, upper pectorals, and triceps.' },
  { name: 'Bicep Curl', description: 'Isolation pull movement focusing on biceps brachii contraction and forearm stabilizer loads.' },
  { name: 'Tricep Pushdown', description: 'Cable isolation press targeting the lateral and medial heads of the triceps.' },
  { name: 'Leg Press', description: 'Machine-based incline leg press focusing on quad extension and glute load transfer.' }
];

export default function GymBuddy() {
  const { profile } = useAuth();
  const { workoutLogs, nutritionLogs, recoveryLogs } = useFitnessData();
  const navigate = useNavigate();

  const [activeCoach, setActiveCoach] = useState('friendly_bro');
  const [selectedExercise, setSelectedExercise] = useState(EXERCISES[0]);
  const [sessionMode, setSessionMode] = useState<'demo' | 'workout' | 'coaching'>('demo');
  const [cameraStatus, setCameraStatus] = useState<string>('Initializing');
  const [syncTrigger, setSyncTrigger] = useState(0);

  useEffect(() => {
    // Load coach preference
    const saved = localStorage.getItem('forgefit_gym_buddy_coach');
    if (saved) setActiveCoach(saved);

    // Initial camera status checks
    checkCameraAnalysisStatus().then(res => {
      setCameraStatus(res.statusMessage);
    });

    const handleSyncUpdate = () => {
      setSyncTrigger(prev => prev + 1);
    };
    window.addEventListener('forgefit_manual_log_updated', handleSyncUpdate);
    return () => {
      window.removeEventListener('forgefit_manual_log_updated', handleSyncUpdate);
    };
  }, []);

  const handleSelectCoach = (id: string) => {
    setActiveCoach(id);
    localStorage.setItem('forgefit_gym_buddy_coach', id);
    confetti({ particleCount: 30, spread: 40, colors: [COACHES.find(c => c.id === id)?.color || '#fff'] });
  };

  if (!profile) return null;

  // Retrieve validated biometrics from Metric Trust Layer
  const hrMetric = metricValidator.getMetric<number>('heartrate');
  const sleepMetric = metricValidator.getMetric<number>('sleep');
  const stepsMetric = metricValidator.getMetric<number>('steps');
  const caloriesMetric = metricValidator.getMetric<number>('calories');

  // Compute metrics for achievements board
  const workoutCount = workoutLogs.length;
  const streak = profile.streak || 0;
  const sleepDays = recoveryLogs.filter(r => r.sleep_hours >= 8).length;
  const proteinDays = nutritionLogs.filter(n => n.protein >= 130).length;

  const selectedCoachObj = COACHES.find(c => c.id === activeCoach) || COACHES[0];

  return (
    <div className="space-y-6 animate-fade-in" role="region" aria-label="Gym Buddy Hub">
      {/* Welcome Header Banner */}
      <GlassCard className="p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-6" glowColor="#8B5CF6">
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs text-brand-purple font-bold uppercase tracking-wider">
            <Cpu className="w-4 h-4" /> ForgeFit AI Gym Buddy Hub v1
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">Your 3D Interactive Coach</h1>
          <p className="text-xs text-slate-500 max-w-xl">
            Select exercises, toggle trainer modes, track biomechanical pacing guides, and sync wearables to monitor biometric readiness logs.
          </p>
        </div>
        <div className="shrink-0 flex gap-2">
          <MotionButton onClick={() => navigate('/devices')} variant="secondary" size="md">
            <Smartphone className="w-4 h-4" /> Devices Hub
          </MotionButton>
          <MotionButton onClick={() => navigate('/coach-session')} variant="primary" size="md">
            <Zap className="w-4 h-4 animate-bounce" /> Start Live Workout
          </MotionButton>
        </div>
      </GlassCard>

      {/* Main 3D Rig & Explanations Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: Exercise Selection & 3D Rig */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Trainer Mannequin</h3>
              <p className="text-xs text-slate-500 mt-0.5">Real-time biomechanical demonstration loops</p>
            </div>
            {/* Mode Selector */}
            <div className="flex bg-white/5 border border-white/5 rounded-xl p-1 gap-1 text-[10px] font-bold text-slate-400">
              {(['demo', 'workout', 'coaching'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setSessionMode(m)}
                  className={`px-3 py-1 rounded-lg capitalize transition-all ${
                    sessionMode === m ? 'bg-brand-cyan/20 text-white border border-brand-cyan/25' : 'hover:text-white'
                  }`}
                >
                  {m} Mode
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Left selector sidebar */}
            <GlassCard className="p-3 rounded-2xl flex flex-col gap-1 max-h-[350px] overflow-y-auto" glowColor="#8B5CF6">
              <span className="text-[9px] uppercase font-bold text-slate-500 px-2.5 py-1 mb-1">Select Exercise</span>
              {EXERCISES.map(ex => {
                const active = ex.name === selectedExercise.name;
                return (
                  <button
                    key={ex.name}
                    onClick={() => setSelectedExercise(ex)}
                    className={`w-full text-left text-xs font-semibold px-3 py-2 rounded-xl transition-all ${
                      active
                        ? 'bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan'
                        : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'
                    }`}
                  >
                    {ex.name}
                  </button>
                );
              })}
            </GlassCard>

            {/* Center 3D Mannequin canvas */}
            <FitnessAvatar3D
              exerciseName={selectedExercise.name}
              mode={sessionMode}
              className="md:col-span-2 rounded-2xl"
            />
          </div>

          {/* Exercise Details Card */}
          <GlassCard className="p-5 rounded-2xl flex gap-3 items-start" glowColor="#22D3EE">
            <Info className="w-5 h-5 text-brand-cyan shrink-0 mt-0.5" />
            <div>
              <h4 className="font-extrabold text-white text-sm">{selectedExercise.name} Instructions</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">{selectedExercise.description}</p>
            </div>
          </GlassCard>

          {/* Muscle Heatmap system */}
          <MuscleHeatmap exerciseName={selectedExercise.name} />
        </div>

        {/* Column 2: Trainer setup, Biometrics, and Camera placeholders */}
        <div className="space-y-6">
          {/* Trainer Personality */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Choose Your Trainer</h3>
            <div className="flex flex-col gap-3">
              {COACHES.map(coach => {
                const active = coach.id === activeCoach;
                return (
                  <GlassCard
                    key={coach.id}
                    onClick={() => handleSelectCoach(coach.id)}
                    className={`p-4 rounded-xl cursor-pointer border transition-all ${
                      active ? 'border-brand-cyan bg-brand-cyan/[0.02]' : 'border-white/5'
                    }`}
                    glowColor={coach.color}
                  >
                    <div className="flex gap-3 items-center">
                      <div className="text-2xl">{coach.avatar}</div>
                      <div>
                        <h4 className="font-bold text-white text-xs">{coach.name}</h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">{coach.description}</p>
                      </div>
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          </div>

          {/* Device Biometrics Monitor */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Trusted Biometrics</h3>
            <GlassCard className="p-5 rounded-2xl space-y-3.5" glowColor="#22D3EE">
              {hrMetric || sleepMetric || stepsMetric || caloriesMetric ? (
                <div className="space-y-2.5 text-xs">
                  {hrMetric && (
                    <div className="flex justify-between items-center py-1 border-b border-white/5">
                      <span className="text-slate-400">Heart Rate:</span>
                      <span className="font-bold text-white">{hrMetric.value} bpm <span className="text-[9px] text-brand-rose">LIVE</span></span>
                    </div>
                  )}
                  {sleepMetric && (
                    <div className="flex justify-between items-center py-1 border-b border-white/5">
                      <span className="text-slate-400">Sleep:</span>
                      <span className="font-bold text-white">{sleepMetric.value} hrs <span className="text-[9px] text-slate-500">({sleepMetric.source})</span></span>
                    </div>
                  )}
                  {stepsMetric && (
                    <div className="flex justify-between items-center py-1 border-b border-white/5">
                      <span className="text-slate-400">Steps:</span>
                      <span className="font-bold text-white">{stepsMetric.value.toLocaleString()} <span className="text-[9px] text-slate-500">({stepsMetric.source})</span></span>
                    </div>
                  )}
                  {caloriesMetric && (
                    <div className="flex justify-between items-center py-1">
                      <span className="text-slate-400">Active Calories:</span>
                      <span className="font-bold text-white">{caloriesMetric.value} kcal <span className="text-[9px] text-slate-500">({caloriesMetric.source})</span></span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-3 space-y-2">
                  <Smartphone className="w-8 h-8 text-slate-600 mx-auto animate-pulse" />
                  <div className="space-y-1">
                    <h4 className="font-bold text-white text-xs">No Wearable Connected</h4>
                    <p className="text-[10px] text-slate-500 max-w-[180px] mx-auto leading-relaxed">
                      Link integrations in the Devices Hub to display trusted biometric stats.
                    </p>
                  </div>
                </div>
              )}
            </GlassCard>
          </div>

          {/* Camera Coaching Coming Soon placeholder */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Camera Coaching</h3>
            <GlassCard className="p-5 rounded-2xl text-center space-y-4 border border-brand-rose/20 bg-brand-rose/[0.01]" glowColor="#EF4444">
              <Camera className="w-8 h-8 text-brand-rose mx-auto animate-pulse" />
              <div className="space-y-1">
                <h4 className="font-extrabold text-white text-xs">{cameraStatus}</h4>
                <p className="text-[10px] text-slate-500 max-w-[180px] mx-auto leading-relaxed">
                  Future computer vision integrations are ready. Standby for posture evaluation weights download.
                </p>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>

      {/* Streak milestones & achievements boards */}
      <StreakMilestones currentStreak={streak} />
      <AchievementsBoard
        workoutCount={workoutCount}
        streak={streak}
        sleepDays={sleepDays}
        proteinDays={proteinDays}
      />
    </div>
  );
}
