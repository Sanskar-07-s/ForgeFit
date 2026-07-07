// ForgeFit AI - AI Gym Buddy Hub & 3D Studio Coach Redesign (v6.0)
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFitnessData } from '../context/FitnessDataContext';
import { metricValidator } from '../services/metric-validator';
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
  Zap,
  Cpu,
  Smartphone,
  Info,
  CheckCircle,
  AlertTriangle,
  Compass,
  Activity,
  Heart
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ExerciseDetail {
  name: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  equipment: string;
  caloriesBurned: string;
  description: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  stabilizers: string[];
  formTips: string[];
  commonMistakes: string[];
  romGuidelines: string;
  safetyWarning: string;
}

const EXERCISES_DATABASE: ExerciseDetail[] = [
  {
    name: 'Bench Press',
    difficulty: 'Intermediate',
    equipment: 'Barbell, Bench',
    caloriesBurned: '380 - 450 kcal/hr',
    description: 'Horizontal pressing compound exercise targeting pectorals, anterior deltoids, and triceps.',
    primaryMuscles: ['Chest (Pectoralis Major)', 'Triceps', 'Front Delts'],
    secondaryMuscles: ['Serratus Anterior', 'Latissimus Dorsi'],
    stabilizers: ['Forearms', 'Core'],
    formTips: ['Retract shoulders and squeeze scapulae flat on bench', 'Keep wrists stacked vertically under the barbell', 'Lower bar under control to mid-chest, do not bounce'],
    commonMistakes: ['Bouncing bar off chest to gain momentum', 'Flaring elbows outward at 90 degrees (keep them at 45-60 degrees)', 'Lifting hips off the bench during the press'],
    romGuidelines: 'Lower barbell to lightly touch lower chest, then press upward to a 95% elbow lockout.',
    safetyWarning: 'Always perform heavy bench presses with a spotter or inside a cage with set safety pins.'
  },
  {
    name: 'Squat',
    difficulty: 'Intermediate',
    equipment: 'Barbell, Squat Rack',
    caloriesBurned: '450 - 550 kcal/hr',
    description: 'Compound lower body movement targeting quadriceps, glutes, and core. Keep hips back and chest elevated.',
    primaryMuscles: ['Quadriceps', 'Glutes'],
    secondaryMuscles: ['Hamstrings', 'Calves'],
    stabilizers: ['Core', 'Spinal Erectors'],
    formTips: ['Keep chest up and look forward', 'Drive knees outward so they track in line with toes', 'Brace core before initiating descent'],
    commonMistakes: ['Valgus knee collapse (knees caving inward)', 'Heels lifting off the floor (pushes weight onto toes)', 'Rounding lower back at bottom (butt wink)'],
    romGuidelines: 'Descend until hip crease drops slightly below parallel (top of knees), then drive straight back up.',
    safetyWarning: 'Do not let your back round under load. Keep a neutral spine throughout the lift.'
  },
  {
    name: 'Deadlift',
    difficulty: 'Advanced',
    equipment: 'Barbell',
    caloriesBurned: '500 - 620 kcal/hr',
    description: 'Posterior chain compound lift targeting hamstrings, gluteals, spinal erectors, and grip strength.',
    primaryMuscles: ['Hamstrings', 'Glutes', 'Spinal Erectors'],
    secondaryMuscles: ['Trapezius', 'Forearms'],
    stabilizers: ['Core', 'Lats'],
    formTips: ['Keep bar paths close to shins throughout pull', 'Engage lats and pack shoulders before lifting', 'Push the floor away with your feet instead of pulling bar'],
    commonMistakes: ['Rounding the lumbar spine (cat-back)', 'Hyperextending spine at lockout (leaning back too far)', 'Letting bar drift forward away from body'],
    romGuidelines: 'Pull from floor to full hip and knee extension, squeezing glutes at lockout. Lower under control.',
    safetyWarning: 'If your lower back rounds, terminate the rep immediately. Keep core intra-abdominal pressure high.'
  },
  {
    name: 'Pull Up',
    difficulty: 'Intermediate',
    equipment: 'Pull-Up Bar',
    caloriesBurned: '350 - 420 kcal/hr',
    description: 'Vertical pulling bodyweight exercise focusing on latissimus dorsi, rhomboids, and biceps.',
    primaryMuscles: ['Lats (Latissimus Dorsi)', 'Biceps'],
    secondaryMuscles: ['Rhomboids', 'Traps'],
    stabilizers: ['Core', 'Forearms'],
    formTips: ['Initiate pull by depressing scapulae (shoulders down)', 'Lead with chest towards bar, not chin', 'Maintain active shoulder engagement at the bottom hang'],
    commonMistakes: ['Kipping or swinging legs for momentum', 'Failing to fully extend arms at bottom (half reps)', 'Rounding shoulders forward at top'],
    romGuidelines: 'Start from full dead hang extension and pull until collarbone or upper chest approaches bar.',
    safetyWarning: 'Avoid fast dropping into dead hangs to prevent shoulder joint and labrum microtrauma.'
  },
  {
    name: 'Push Up',
    difficulty: 'Beginner',
    equipment: 'Bodyweight',
    caloriesBurned: '280 - 330 kcal/hr',
    description: 'Calisthenics compound press isolating pectorals, triceps, and core stabilization.',
    primaryMuscles: ['Chest', 'Triceps'],
    secondaryMuscles: ['Front Delts'],
    stabilizers: ['Core', 'Glutes'],
    formTips: ['Keep body in a rigid plank line from head to heels', 'Position hands directly under shoulders', 'Tuck elbows at 45 degrees to body'],
    commonMistakes: ['Sagging hips or piking butt in air', 'Elbows flared wide to 90 degrees', 'Incomplete range of motion (head-nodding)'],
    romGuidelines: 'Lower chest until nose or breastbone is hovering 1 inch from floor, then push to full elbow extension.',
    safetyWarning: 'If lower back aches, stop and reset. Ensure core is fully engaged.'
  },
  {
    name: 'Shoulder Press',
    difficulty: 'Intermediate',
    equipment: 'Barbell / Dumbbells',
    caloriesBurned: '340 - 400 kcal/hr',
    description: 'Vertical press compound exercise targeting the deltoids, upper pectorals, and triceps.',
    primaryMuscles: ['Front Delts (Anterior Deltoid)', 'Triceps'],
    secondaryMuscles: ['Side Delts', 'Upper Chest'],
    stabilizers: ['Core', 'Glutes'],
    formTips: ['Keep core braced and squeeze glutes to secure spine', 'Press barbell in a straight vertical path, moving head back to clear bar', 'Keep elbows slightly tucked forward, not flared'],
    commonMistakes: ['Excessive arching of lower back (leaning back)', 'Rib cage flaring out under load', 'Resting bar on collarbone at bottom'],
    romGuidelines: 'Start at chin level and press bar vertically to full overhead arm extension, locking shoulders out.',
    safetyWarning: 'Be careful not to lean back excessively, which places hazardous hyperextension stress on lumbar vertebrae.'
  },
  {
    name: 'Bicep Curl',
    difficulty: 'Beginner',
    equipment: 'Dumbbells / Barbell',
    caloriesBurned: '220 - 260 kcal/hr',
    description: 'Isolation pull movement focusing on biceps brachii contraction and forearm stabilizer loads.',
    primaryMuscles: ['Biceps Brachii'],
    secondaryMuscles: ['Forearms'],
    stabilizers: ['Core'],
    formTips: ['Keep elbows pinned firmly to ribs', 'Control eccentric lowering phase (3 seconds)', 'Avoid swinging torso to lift weight'],
    commonMistakes: ['Swinging shoulders/back to swing weight', 'Elbows drifting forward during lift (uses front delts)', 'Failing to fully extend elbows at bottom'],
    romGuidelines: 'Curl from full arm extension up to peak bicep squeeze, without shifting elbow pivots forward.',
    safetyWarning: 'Do not curl weights that force you to rock or twist your spine.'
  },
  {
    name: 'Tricep Pushdown',
    difficulty: 'Beginner',
    equipment: 'Cable Machine',
    caloriesBurned: '200 - 240 kcal/hr',
    description: 'Cable isolation press targeting the lateral and medial heads of the triceps.',
    primaryMuscles: ['Triceps'],
    secondaryMuscles: ['Rear Delts'],
    stabilizers: ['Core'],
    formTips: ['Keep upper arms vertical and locked close to sides', 'Extend arms fully at bottom and spread rope/bar', 'Control eccentric return to 90 degrees'],
    commonMistakes: ['Allowing elbows to flare outward or drift forward', 'Leaning chest weight over handle to push down', 'Rounding shoulders forward at contraction'],
    romGuidelines: 'Move from 90 degrees elbow flexion to full extension, locking out triceps and holding peak squeeze.',
    safetyWarning: 'Keep wrists straight; do not let cable tension bend your wrists backwards.'
  },
  {
    name: 'Leg Press',
    difficulty: 'Beginner',
    equipment: 'Leg Press Machine',
    caloriesBurned: '400 - 480 kcal/hr',
    description: 'Machine-based incline leg press focusing on quad extension and glute load transfer.',
    primaryMuscles: ['Quads', 'Glutes'],
    secondaryMuscles: ['Hamstrings'],
    stabilizers: ['Calves', 'Core'],
    formTips: ['Press lower back flat against backrest', 'Place feet shoulder-width apart on plate', 'Control descent to 90 degrees knee bend'],
    commonMistakes: ['Locking knees fully at top (extremely dangerous)', 'Allowing glutes/tailbone to lift off seat at bottom', 'Knees collapse inward during press'],
    romGuidelines: 'Lower sled until knees are bent to 90 degrees, then press plate away to 95% extension.',
    safetyWarning: 'NEVER lock out knees at peak. Leaving a slight bend protects knee joint ligaments from overloading.'
  },
  {
    name: 'Lat Pulldown',
    difficulty: 'Beginner',
    equipment: 'Lat Pulldown Machine',
    caloriesBurned: '310 - 370 kcal/hr',
    description: 'Cable-based vertical pull targeting lats, rhomboids, and biceps.',
    primaryMuscles: ['Lats (Latissimus Dorsi)', 'Biceps'],
    secondaryMuscles: ['Rhomboids', 'Traps'],
    stabilizers: ['Forearms'],
    formTips: ['Pull bar down to upper chest, chest proud', 'Drive elbows down towards hips', 'Squeeze shoulder blades together at bottom'],
    commonMistakes: ['Pulling bar behind neck (strains shoulder joints)', 'Leaning back excessively to pull weight', 'Yanking handle using momentum'],
    romGuidelines: 'Pull bar from full overhead stretch down to collarbone level, pause, and release slowly.',
    safetyWarning: 'Control the upward eccentric phase. Do not let the stack slam or yank shoulders.'
  },
  {
    name: 'Seated Row',
    difficulty: 'Beginner',
    equipment: 'Seated Cable Row Machine',
    caloriesBurned: '320 - 380 kcal/hr',
    description: 'Horizontal cable row targeting upper back thickness, lats, and biceps.',
    primaryMuscles: ['Lats', 'Rhomboids'],
    secondaryMuscles: ['Traps', 'Biceps'],
    stabilizers: ['Forearms', 'Core'],
    formTips: ['Keep back tall and neutral, shoulders back', 'Drive elbows backward close to sides', 'Squeeze shoulder blades at peak contraction'],
    commonMistakes: ['Rounding lower back when stretching forward', 'Rocking torso backward and forward to pull', 'Shrugging shoulders upward during pull'],
    romGuidelines: 'Full arm extension with active shoulder stretch to handle touching lower abdomen, squeeze back.',
    safetyWarning: 'Hold core tight. Do not lean forward by hinging lumbar spine; hinge only at hips.'
  },
  {
    name: 'Leg Extension',
    difficulty: 'Beginner',
    equipment: 'Leg Extension Machine',
    caloriesBurned: '180 - 220 kcal/hr',
    description: 'Isolation machine movement targeting quadriceps muscle group development.',
    primaryMuscles: ['Quadriceps'],
    secondaryMuscles: [],
    stabilizers: ['Core'],
    formTips: ['Sit back and grip handles to hold hips flat', 'Align knees with machine rotational pivot point', 'Squeeze quads at top extension'],
    commonMistakes: ['Swinging weight pad using leg momentum', 'Allowing butt to lift off the seat pad', 'Too rapid descent'],
    romGuidelines: 'Move from 90 degrees knee flexion to full leg extension, locking out legs and squeezing quads.',
    safetyWarning: 'Avoid rapid snapping motion at top. Smoothly squeeze to full extension.'
  },
  {
    name: 'Leg Curl',
    difficulty: 'Beginner',
    equipment: 'Lying/Seated Leg Curl Machine',
    caloriesBurned: '180 - 220 kcal/hr',
    description: 'Isolation leg curl targeting hamstring hypertrophy.',
    primaryMuscles: ['Hamstrings'],
    secondaryMuscles: ['Glutes'],
    stabilizers: ['Calves'],
    formTips: ['Keep thighs and hips pressed flat against pad', 'Pull heels all the way to glutes', 'Release weight under control'],
    commonMistakes: ['Arching lower back to curl weight', 'Hips rising off pad during contraction', 'Using momentum'],
    romGuidelines: 'Full leg extension to maximum hamstring flexion, bringing roller pad close to tailbone.',
    safetyWarning: 'Keep hips down. If hips rise, weight is too heavy; reduce load to avoid lower back strain.'
  },
  {
    name: 'Calf Raise',
    difficulty: 'Beginner',
    equipment: 'Calf Block / Machine',
    caloriesBurned: '150 - 180 kcal/hr',
    description: 'Isolation calf raise targeting gastrocnemius load.',
    primaryMuscles: ['Calves'],
    secondaryMuscles: [],
    stabilizers: ['Core'],
    formTips: ['Get full deep stretch at bottom of rep', 'Press up through big toes', 'Pause at peak and at bottom stretch'],
    commonMistakes: ['Bouncing weight quickly (uses Achilles tendon bounce)', 'Failing to complete full range of motion', 'Knees bending during raise'],
    romGuidelines: 'Deep heel stretch below block level to peak elevation on tips of toes.',
    safetyWarning: 'Control the bottom stretch to avoid Achilles tendon micro-tears.'
  },
  {
    name: 'Plank',
    difficulty: 'Beginner',
    equipment: 'Bodyweight',
    caloriesBurned: '160 - 200 kcal/hr',
    description: 'Static core stability hold targeting isometric abdominal activation.',
    primaryMuscles: ['Core (Abs / Transverse)'],
    secondaryMuscles: ['Front Delts', 'Quads'],
    stabilizers: ['Glutes'],
    formTips: ['Keep elbows directly below shoulders', 'Brace core and squeeze glutes to flatten back', 'Breathe deeply and hold position'],
    commonMistakes: ['Sagging hips (strains lower back)', 'Hips raised high in air', 'Holding breath'],
    romGuidelines: 'Static isometric hold; maintain straight plank line for target duration.',
    safetyWarning: 'If lower back feels strained, stop. Do not compromise spine alignment.'
  }
];

export default function GymBuddy() {
  const { profile } = useAuth();
  const { workoutLogs, nutritionLogs, recoveryLogs } = useFitnessData();
  const navigate = useNavigate();

  const [selectedExerciseName, setSelectedExerciseName] = useState('Bench Press');
  const [sessionMode, setSessionMode] = useState<'demo' | 'workout' | 'coaching'>('demo');
  const [cameraStatus, setCameraStatus] = useState<string>('Initializing');
  const [syncTrigger, setSyncTrigger] = useState(0);

  useEffect(() => {
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

  const currentExercise = EXERCISES_DATABASE.find(ex => ex.name === selectedExerciseName) || EXERCISES_DATABASE[0];

  const handleSelectExercise = (name: string) => {
    setSelectedExerciseName(name);
    confetti({ particleCount: 20, spread: 35, colors: ['#22d3ee', '#8b5cf6'] });
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12" role="region" aria-label="Gym Buddy Hub">
      
      {/* Welcome Header Banner */}
      <GlassCard className="p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-white/5" glowColor="#8B5CF6">
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs text-brand-purple font-bold uppercase tracking-wider">
            <Cpu className="w-4 h-4" /> ForgeFit AI Gym Buddy Hub v3
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">Interactive studio Trainer</h1>
          <p className="text-xs text-slate-500 max-w-xl">
            Upgraded biomechanics studio. Select exercises, view detailed muscle heatmaps, inspect real-time tempos, and review coaching guides.
          </p>
        </div>
        <div className="shrink-0 flex gap-2">
          <MotionButton onClick={() => navigate('/devices')} variant="secondary" size="md">
            <Smartphone className="w-4 h-4" /> Devices Hub
          </MotionButton>
          <MotionButton onClick={() => navigate('/coach-session', { state: { quickExerciseName: selectedExerciseName } })} variant="primary" size="md">
            <Zap className="w-4 h-4 animate-bounce" /> Start Live Workout
          </MotionButton>
        </div>
      </GlassCard>

      {/* V3 REDESIGN: Three-Column Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Column 1: Exercise Selection Sidebar (width 3/12) */}
        <div className="lg:col-span-3 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Exercise List</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Select exercise to demonstration</p>
          </div>
          <GlassCard className="p-3 rounded-2xl flex flex-col gap-1 max-h-[440px] overflow-y-auto border border-white/5" glowColor="#8B5CF6">
            <span className="text-[9px] uppercase font-bold text-slate-500 px-2.5 py-1 mb-1">Compound & Isolation</span>
            {EXERCISES_DATABASE.map(ex => {
              const active = ex.name === selectedExerciseName;
              return (
                <button
                  key={ex.name}
                  onClick={() => handleSelectExercise(ex.name)}
                  className={`w-full text-left text-xs font-bold px-3 py-2.5 rounded-xl transition-all ${
                    active
                      ? 'bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan shadow-glow-cyan'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'
                  }`}
                >
                  {ex.name}
                </button>
              );
            })}
          </GlassCard>
        </div>

        {/* Column 2: 3D Trainer Canvas & Controls (width 5/12) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">3D Biomechanics Studio</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Physical geometry skeletal models</p>
            </div>
            {/* Mode Selector */}
            <div className="flex bg-white/5 border border-white/5 rounded-xl p-1 gap-1 text-[9px] font-bold text-slate-400">
              {(['demo', 'workout', 'coaching'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setSessionMode(m)}
                  className={`px-2.5 py-1 rounded-lg capitalize transition-all ${
                    sessionMode === m ? 'bg-brand-cyan/20 text-white border border-brand-cyan/25' : 'hover:text-white'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <FitnessAvatar3D
            exerciseName={selectedExerciseName}
            mode={sessionMode}
            className="rounded-3xl"
          />
        </div>

        {/* Column 3: Exercise Intelligence Panel (width 4/12) */}
        <div className="lg:col-span-4 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Exercise Intelligence</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Biomechanical specifications</p>
          </div>
          
          <GlassCard className="p-5 rounded-3xl space-y-4 border border-white/5" glowColor="#22D3EE">
            {/* Specs Header */}
            <div className="border-b border-white/5 pb-3">
              <h3 className="font-extrabold text-white text-base">{currentExercise.name}</h3>
              <p className="text-[10px] text-slate-400 mt-1">{currentExercise.description}</p>
            </div>

            {/* Quick Badges Grid */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white/5 border border-white/5 p-2 rounded-xl text-center">
                <span className="text-[8px] text-slate-500 uppercase font-black">Difficulty</span>
                <span className={`block text-[10px] font-black mt-0.5 ${
                  currentExercise.difficulty === 'Beginner' ? 'text-brand-emerald' :
                  currentExercise.difficulty === 'Intermediate' ? 'text-brand-cyan' : 'text-brand-rose'
                }`}>{currentExercise.difficulty}</span>
              </div>
              <div className="bg-white/5 border border-white/5 p-2 rounded-xl text-center">
                <span className="text-[8px] text-slate-500 uppercase font-black">Equipment</span>
                <span className="block text-[10px] font-black text-white mt-0.5 truncate" title={currentExercise.equipment}>{currentExercise.equipment}</span>
              </div>
              <div className="bg-white/5 border border-white/5 p-2 rounded-xl text-center">
                <span className="text-[8px] text-slate-500 uppercase font-black">Est. Burn</span>
                <span className="block text-[9px] font-black text-brand-purple mt-0.5 truncate">{currentExercise.caloriesBurned}</span>
              </div>
            </div>

            {/* ROM & Safety */}
            <div className="space-y-2.5 text-[11px] bg-white/[0.01] p-3 rounded-2xl border border-white/5">
              <div>
                <span className="font-extrabold text-white flex items-center gap-1">
                  <Compass className="w-3.5 h-3.5 text-brand-cyan" /> ROM Guidelines
                </span>
                <p className="text-slate-400 mt-0.5 text-[10px] leading-relaxed">{currentExercise.romGuidelines}</p>
              </div>
              <div className="border-t border-white/5 pt-2">
                <span className="font-extrabold text-brand-rose flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Safety Warning
                </span>
                <p className="text-slate-400 mt-0.5 text-[10px] leading-relaxed">{currentExercise.safetyWarning}</p>
              </div>
            </div>

            {/* Form Tips & Common Mistakes */}
            <div className="space-y-3.5 text-[11px] pt-1">
              <div>
                <span className="font-extrabold text-brand-cyan flex items-center gap-1 uppercase tracking-wider text-[9px]">✔ Form Execution Cues</span>
                <ul className="list-disc list-inside text-slate-400 mt-1 space-y-1 text-[10px] leading-relaxed">
                  {currentExercise.formTips.map((tip, idx) => (
                    <li key={idx}>{tip}</li>
                  ))}
                </ul>
              </div>
              <div>
                <span className="font-extrabold text-brand-rose flex items-center gap-1 uppercase tracking-wider text-[9px]">❌ Common Biomechanical Mistakes</span>
                <ul className="list-disc list-inside text-slate-400 mt-1 space-y-1 text-[10px] leading-relaxed">
                  {currentExercise.commonMistakes.map((mis, idx) => (
                    <li key={idx} className="hover:text-brand-rose transition-colors">{mis}</li>
                  ))}
                </ul>
              </div>
            </div>
          </GlassCard>
        </div>

      </div>

      {/* Heatmap Section */}
      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Anatomical Heatmap</h3>
          <p className="text-[10px] text-slate-500 mt-0.5">Primary, Secondary, and Stabilizer muscle loads</p>
        </div>
        <MuscleHeatmap exerciseName={selectedExerciseName} />
      </div>

      {/* Device Biometrics Monitor */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Trusted Biometrics</h3>
        <GlassCard className="p-5 rounded-3xl space-y-3.5 border border-white/5" glowColor="#22D3EE">
          {hrMetric || sleepMetric || stepsMetric || caloriesMetric ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              {hrMetric && (
                <div className="p-3 bg-white/5 rounded-2xl border border-white/5 flex flex-col justify-between">
                  <span className="text-[10px] text-slate-500 uppercase font-black flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5 text-brand-rose" /> Heart Rate
                  </span>
                  <span className="font-black text-white text-sm mt-1">{hrMetric.value} bpm <span className="text-[8px] text-brand-rose uppercase">Live</span></span>
                </div>
              )}
              {sleepMetric && (
                <div className="p-3 bg-white/5 rounded-2xl border border-white/5 flex flex-col justify-between">
                  <span className="text-[10px] text-slate-500 uppercase font-black">Sleep Duration</span>
                  <span className="font-black text-white text-sm mt-1">{sleepMetric.value} hrs <span className="text-[8px] text-slate-500">({sleepMetric.source})</span></span>
                </div>
              )}
              {stepsMetric && (
                <div className="p-3 bg-white/5 rounded-2xl border border-white/5 flex flex-col justify-between">
                  <span className="text-[10px] text-slate-500 uppercase font-black">Steps Walked</span>
                  <span className="font-black text-white text-sm mt-1">{stepsMetric.value.toLocaleString()} <span className="text-[8px] text-slate-500">({stepsMetric.source})</span></span>
                </div>
              )}
              {caloriesMetric && (
                <div className="p-3 bg-white/5 rounded-2xl border border-white/5 flex flex-col justify-between">
                  <span className="text-[10px] text-slate-500 uppercase font-black">Calories Burned</span>
                  <span className="font-black text-white text-sm mt-1">{caloriesMetric.value} kcal <span className="text-[8px] text-slate-500">({caloriesMetric.source})</span></span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4 space-y-2">
              <Smartphone className="w-8 h-8 text-slate-600 mx-auto animate-pulse" />
              <div className="space-y-1">
                <h4 className="font-bold text-white text-xs">No Wearable Connected</h4>
                <p className="text-[10px] text-slate-500 max-w-[220px] mx-auto leading-relaxed">
                  Link Fitbit, Google Fit, or Garmin integrations in the Devices Hub to display trusted biometric stats here.
                </p>
              </div>
            </div>
          )}
        </GlassCard>
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
