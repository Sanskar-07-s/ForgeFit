// ForgeFit AI - Onboarding Wizard (v5.0) — Simple Mode: 4 steps < 60 seconds

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useFitnessData } from '../context/FitnessDataContext';
import { trackEvent } from '../services/analytics';
import { generateWorkoutSplit } from '@ai/workout-planner';
import { MotionButton } from '../components/MotionButton';
import { calculateCaloricAndMacroTargets } from '@shared/fitness-models';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Dumbbell,
  Target,
  Flame,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Zap,
} from 'lucide-react';

const TOTAL_STEPS = 4;

const slideVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 40 : -40 }),
  center:               ({ opacity: 1, x: 0 }),
  exit:  (dir: number) => ({ opacity: 0, x: dir > 0 ? -40 : 40 }),
};

const goals = [
  { name: 'Build Muscle',          icon: '💪', desc: 'Hypertrophy & size gains' },
  { name: 'Lose Fat',              icon: '🔥', desc: 'Caloric deficit & cardio' },
  { name: 'Get Stronger',          icon: '🏋️', desc: 'Strength & power output' },
  { name: 'Recomposition',         icon: '⚡', desc: 'Lose fat, build muscle simultaneously' },
  { name: 'Athletic Performance',  icon: '🏃', desc: 'Speed, endurance & explosiveness' },
  { name: 'General Fitness',       icon: '🌟', desc: 'Balanced health & consistency' },
];

const equipments = [
  { id: 'Full Gym',       icon: '🏢', desc: 'Full access gym' },
  { id: 'Home Gym',       icon: '🏠', desc: 'Rack, barbell & plates' },
  { id: 'Dumbbells',      icon: '💪', desc: 'Dumbbells only' },
  { id: 'Bands',          icon: '🔗', desc: 'Resistance bands' },
  { id: 'Bodyweight Only',icon: '🤸', desc: 'No equipment needed' },
];

export default function Onboarding() {
  const { updateProfile, refreshProfile } = useAuth();
  const { exercises, createWorkout } = useFitnessData();
  const navigate = useNavigate();

  const [step, setStep]   = useState(1);
  const [dir,  setDir]    = useState(1);
  const [showMore, setShowMore] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [planReady,  setPlanReady]  = useState(false);
  const [calibrated, setCalibrated] = useState<any>(null);

  const [data, setData] = useState({
    name:                '',
    goal:                'Build Muscle',
    weight:              70,
    height:              175,
    age:                 25,
    gender:              'Male',
    activity_level:      'Moderately Active',
    experience_level:    'Intermediate',
    training_days:       4,
    dietary_preference:  'Non Vegetarian',
    available_equipment: ['Dumbbells'],
  });

  const toggleEquipment = (id: string) => {
    setData(prev => {
      const eq = [...prev.available_equipment];
      const idx = eq.indexOf(id);
      if (idx !== -1) eq.splice(idx, 1); else eq.push(id);
      return { ...prev, available_equipment: eq };
    });
  };

  const goNext = async () => {
    if (step === 3) {
      // Step 3 → 4: generate plan
      setDir(1);
      setStep(4);
      await generatePlan();
    } else if (step < TOTAL_STEPS) {
      setDir(1);
      setStep(p => p + 1);
    }
  };

  const goBack = () => {
    if (step > 1) { setDir(-1); setStep(p => p - 1); }
  };

  const canGoNext = () => {
    if (step === 1) return !!data.goal;
    if (step === 2) return data.weight > 0;
    if (step === 3) return data.available_equipment.length > 0;
    return false;
  };

  const generatePlan = async () => {
    setGenerating(true);
    try {
      const macros = calculateCaloricAndMacroTargets(
        data.weight, data.height, data.age, data.gender,
        data.activity_level, data.goal
      );
      setCalibrated(macros);

      const splitType = data.training_days >= 4 ? 'Push Pull Legs' : 'Full Body';
      const generated = generateWorkoutSplit(
        exercises, data.goal, data.experience_level,
        data.available_equipment, splitType
      );

      await createWorkout(
        `${data.goal} Init Split`, splitType,
        generated.schedule[0]?.exercises || []
      );

      setPlanReady(true);
    } catch (err) {
      console.error(err);
      setPlanReady(true); // Continue anyway
    } finally {
      setGenerating(false);
    }
  };

  const handleFinish = async () => {
    const success = await updateProfile({
      ...data,
      xp: 150,
      level: 1,
      streak: 1,
    });

    if (success) {
      try { await trackEvent('Profile Completed', { goal: data.goal }); } catch (_) {}
      await refreshProfile();
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: '#0B1020' }}>

      {/* Ambient blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-[120px] pointer-events-none" style={{ background: 'rgba(34,211,238,0.04)' }} />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-[120px] pointer-events-none" style={{ background: 'rgba(139,92,246,0.04)' }} />

      <div className="w-full max-w-lg relative z-10">

        {/* ── Progress dots ── */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i + 1 <= step
                  ? 'bg-brand-cyan w-8'
                  : 'bg-white/10 w-4'
              }`}
            />
          ))}
        </div>

        {/* ── Card ── */}
        <div className="glass-panel p-8 rounded-3xl overflow-hidden">

          {/* ── Step counter ── */}
          <div className="flex items-center justify-between mb-6">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">
              Step {step} / {TOTAL_STEPS}
            </span>
            {step < 4 && (
              <button
                onClick={() => { setDir(1); setStep(TOTAL_STEPS); generatePlan(); }}
                className="text-xs text-slate-600 hover:text-brand-cyan transition-colors"
              >
                Skip setup →
              </button>
            )}
          </div>

          <AnimatePresence custom={dir} mode="wait">
            <motion.div
              key={step}
              custom={dir}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >

              {/* ────── STEP 1: GOAL ────── */}
              {step === 1 && (
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <div className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center text-2xl mb-4"
                      style={{ background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.2)' }}>
                      🎯
                    </div>
                    <h1 className="text-2xl font-extrabold text-white">What's your goal?</h1>
                    <p className="text-sm text-slate-500">Your workout plan will be built around this.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {goals.map(g => (
                      <button
                        key={g.name}
                        onClick={() => setData(p => ({ ...p, goal: g.name }))}
                        className={`p-4 rounded-2xl text-left transition-all duration-200 glass-panel-hover ${
                          data.goal === g.name
                            ? 'card-glow-cyan'
                            : ''
                        }`}
                        style={{
                          background: data.goal === g.name ? 'rgba(34,211,238,0.08)' : 'rgba(255,255,255,0.04)',
                          border: `1px solid ${data.goal === g.name ? 'rgba(34,211,238,0.3)' : 'rgba(255,255,255,0.08)'}`,
                        }}
                      >
                        <div className="text-xl mb-2">{g.icon}</div>
                        <div className="font-bold text-sm text-white">{g.name}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{g.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ────── STEP 2: WEIGHT ────── */}
              {step === 2 && (
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <div className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center text-2xl mb-4"
                      style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
                      ⚖️
                    </div>
                    <h1 className="text-2xl font-extrabold text-white">What's your weight?</h1>
                    <p className="text-sm text-slate-500">Used to calculate your calorie and macro targets.</p>
                  </div>

                  {/* Name */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Your name</label>
                    <input
                      type="text"
                      placeholder="e.g. Alex"
                      value={data.name}
                      onChange={e => setData(p => ({ ...p, name: e.target.value }))}
                      className="glass-input"
                    />
                  </div>

                  {/* Weight big input */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Current weight (kg)</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={data.weight}
                        onChange={e => setData(p => ({ ...p, weight: parseFloat(e.target.value) || 0 }))}
                        className="glass-input text-2xl font-extrabold pr-12 text-white"
                        style={{ height: '64px' }}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">kg</span>
                    </div>
                  </div>

                  {/* Customize More toggle */}
                  <button
                    onClick={() => setShowMore(p => !p)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm text-slate-400 hover:text-slate-200 transition-colors"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    <span className="font-semibold">Customize More <span className="text-xs text-slate-600">(optional)</span></span>
                    {showMore ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {/* Expanded optional fields */}
                  <AnimatePresence>
                    {showMore && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-4 overflow-hidden"
                      >
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-2">Height (cm)</label>
                            <input type="number" value={data.height}
                              onChange={e => setData(p => ({ ...p, height: parseInt(e.target.value) || 0 }))}
                              className="glass-input" />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-2">Age</label>
                            <input type="number" value={data.age}
                              onChange={e => setData(p => ({ ...p, age: parseInt(e.target.value) || 0 }))}
                              className="glass-input" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-2">Gender</label>
                          <select value={data.gender} onChange={e => setData(p => ({ ...p, gender: e.target.value }))} className="glass-input">
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-2">Activity Level</label>
                          <select value={data.activity_level} onChange={e => setData(p => ({ ...p, activity_level: e.target.value }))} className="glass-input">
                            <option value="Sedentary">Sedentary (desk job)</option>
                            <option value="Lightly Active">Lightly Active (1-3 days/wk)</option>
                            <option value="Moderately Active">Moderately Active (3-5 days/wk)</option>
                            <option value="Very Active">Very Active (6-7 days/wk)</option>
                            <option value="Extra Active">Extra Active (2x daily)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-2">Experience Level</label>
                          <select value={data.experience_level} onChange={e => setData(p => ({ ...p, experience_level: e.target.value }))} className="glass-input">
                            <option value="Beginner">Beginner (&lt; 1 year)</option>
                            <option value="Intermediate">Intermediate (1-3 years)</option>
                            <option value="Advanced">Advanced (3+ years)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-2">Training days per week: <strong className="text-brand-cyan">{data.training_days}</strong></label>
                          <input type="range" min="1" max="7" value={data.training_days}
                            onChange={e => setData(p => ({ ...p, training_days: parseInt(e.target.value) }))}
                            className="w-full h-2 rounded-full accent-brand-cyan" style={{ background: 'rgba(255,255,255,0.1)' }} />
                          <div className="flex justify-between text-xs text-slate-600 mt-1"><span>1</span><span>7</span></div>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-2">Diet Preference</label>
                          <div className="grid grid-cols-3 gap-2">
                            {['Non Vegetarian','Vegetarian','Vegan'].map(d => (
                              <button key={d} onClick={() => setData(p => ({ ...p, dietary_preference: d }))}
                                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                                  data.dietary_preference === d
                                    ? 'text-brand-cyan'
                                    : 'text-slate-500'
                                }`}
                                style={{
                                  background: data.dietary_preference === d ? 'rgba(34,211,238,0.1)' : 'rgba(255,255,255,0.04)',
                                  border: `1px solid ${data.dietary_preference === d ? 'rgba(34,211,238,0.3)' : 'rgba(255,255,255,0.08)'}`,
                                }}
                              >{d}</button>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* ────── STEP 3: EQUIPMENT ────── */}
              {step === 3 && (
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <div className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center text-2xl mb-4"
                      style={{ background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.2)' }}>
                      🏋️
                    </div>
                    <h1 className="text-2xl font-extrabold text-white">What equipment do you have?</h1>
                    <p className="text-sm text-slate-500">We'll only include exercises you can actually do.</p>
                  </div>

                  <div className="space-y-3">
                    {equipments.map(eq => {
                      const selected = data.available_equipment.includes(eq.id);
                      return (
                        <button
                          key={eq.id}
                          onClick={() => toggleEquipment(eq.id)}
                          className={`w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all duration-200 ${selected ? 'card-glow-cyan' : 'glass-panel-hover'}`}
                          style={{
                            background: selected ? 'rgba(34,211,238,0.08)' : 'rgba(255,255,255,0.04)',
                            border: `1px solid ${selected ? 'rgba(34,211,238,0.3)' : 'rgba(255,255,255,0.08)'}`,
                          }}
                        >
                          <span className="text-2xl">{eq.icon}</span>
                          <div className="flex-1">
                            <div className="font-bold text-sm text-white">{eq.id}</div>
                            <div className="text-xs text-slate-500">{eq.desc}</div>
                          </div>
                          {selected && <CheckCircle className="w-5 h-5 text-brand-cyan shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ────── STEP 4: GENERATING PLAN ────── */}
              {step === 4 && (
                <div className="space-y-6 text-center">
                  {generating ? (
                    <>
                      <div className="w-20 h-20 mx-auto rounded-3xl flex items-center justify-center text-3xl animate-pulse"
                        style={{ background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.2)' }}>
                        ⚡
                      </div>
                      <div>
                        <h1 className="text-2xl font-extrabold text-white">Building your plan…</h1>
                        <p className="text-sm text-slate-500 mt-2">Calibrating macros & generating workout split</p>
                      </div>
                      <div className="flex justify-center gap-2 mt-4">
                        <div className="w-3 h-3 rounded-full bg-brand-cyan animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-3 h-3 rounded-full bg-brand-cyan animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-3 h-3 rounded-full bg-brand-cyan animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-20 h-20 mx-auto rounded-3xl flex items-center justify-center text-3xl"
                        style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)' }}>
                        ✅
                      </div>
                      <div>
                        <h1 className="text-2xl font-extrabold text-white">Your plan is ready!</h1>
                        <p className="text-sm text-slate-500 mt-2">Personalized to your goal: <strong className="text-brand-cyan">{data.goal}</strong></p>
                      </div>

                      {calibrated && (
                        <div className="grid grid-cols-3 gap-3 text-center mt-2">
                          {[
                            { label: 'Daily Calories', value: `${calibrated.target}`, unit: 'kcal', color: '#22D3EE' },
                            { label: 'Protein',         value: `${calibrated.macros.proteinG}g`, unit: '/day', color: '#8B5CF6' },
                            { label: 'Water Target',    value: `${Math.round(data.weight * 35)}`, unit: 'ml', color: '#10B981' },
                          ].map(item => (
                            <div key={item.label} className="glass-panel p-4 rounded-2xl">
                              <div className="text-xl font-black" style={{ color: item.color }}>{item.value}</div>
                              <div className="text-xs text-slate-500 mt-0.5">{item.unit}</div>
                              <div className="text-[10px] text-slate-600 mt-1">{item.label}</div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="glass-panel p-4 rounded-2xl text-left space-y-2 text-xs mt-2">
                        <div className="flex items-center gap-2 text-brand-emerald font-semibold">
                          <CheckCircle className="w-4 h-4" /> Workout Split Generated
                        </div>
                        <div className="flex items-center gap-2 text-brand-emerald font-semibold">
                          <CheckCircle className="w-4 h-4" /> Caloric Targets Calibrated
                        </div>
                        <div className="flex items-center gap-2 text-brand-emerald font-semibold">
                          <CheckCircle className="w-4 h-4" /> Profile Ready (+150 XP)
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

            </motion.div>
          </AnimatePresence>

          {/* ── Navigation controls ── */}
          <div className={`flex items-center mt-8 pt-6 border-t border-dark-border/30 ${step > 1 ? 'justify-between' : 'justify-end'}`}>
            {step > 1 && step < 4 && (
              <MotionButton onClick={goBack} variant="secondary">
                <ArrowLeft className="w-4 h-4" /> Back
              </MotionButton>
            )}

            {step < 4 && (
              <MotionButton
                onClick={goNext}
                disabled={!canGoNext()}
                variant="primary"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </MotionButton>
            )}

            {step === 4 && planReady && (
              <MotionButton
                onClick={handleFinish}
                variant="primary"
                size="lg"
                fullWidth
              >
                <Zap className="w-5 h-5" /> Launch ForgeFit AI
              </MotionButton>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-700 mt-6">
          No credit card required · Cancel anytime
        </p>
      </div>
    </div>
  );
}
