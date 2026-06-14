// ForgeFit AI - 9-Step Onboarding Wizard Page (v4.3)

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFitnessData } from '../context/FitnessDataContext';
import { trackEvent } from '../services/analytics';
import { generateWorkoutSplit } from '@ai/workout-planner';
import { calculateCaloricAndMacroTargets } from '@shared/fitness-models';
import { requestDevicePermission, checkCurrentPermissions } from '../services/permissions';
import { 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  Dumbbell, 
  Target, 
  Flame, 
  Droplet, 
  ShieldCheck, 
  Cpu, 
  Camera, 
  Mic, 
  Database, 
  Activity,
  Heart
} from 'lucide-react';

export default function Onboarding() {
  const { updateProfile, refreshProfile } = useAuth();
  const { exercises, createWorkout } = useFitnessData();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);

  // Onboarding data states
  const [profileData, setProfileData] = useState({
    name: '',
    age: 25,
    gender: 'Male',
    height: 175,
    weight: 70,
    goal: 'Build Muscle',
    activity_level: 'Moderately Active',
    experience_level: 'Intermediate',
    training_days: 4,
    available_equipment: ['Dumbbells', 'Bodyweight Only'],
    dietary_preference: 'Non Vegetarian',
  });

  const [permissionsStatus, setPermissionsStatus] = useState({
    notifications: false,
    camera: false,
    microphone: false,
    storage: false,
    health: false,
  });

  const [calibratedMacros, setCalibratedMacros] = useState<any>(null);
  const [generatingRoutine, setGeneratingRoutine] = useState(false);

  const handleNext = async () => {
    if (step === 1) {
      if (!profileData.name.trim()) return;
      setStep(2);
    } else if (step === 6) {
      // Step 6: Permission Center -> Step 7: Calibrate targets
      setStep(7);
      calibrateTargets();
    } else if (step === 7) {
      // Step 7: AI Calibration complete -> Step 8: Build routine
      setStep(8);
      await generateFirstWorkout();
    } else if (step === 8) {
      // Step 8: Workout saved -> Step 9: Launch
      setStep(9);
    } else {
      setStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setStep(prev => Math.max(prev - 1, 1));
  };

  const toggleEquipment = (eq: string) => {
    setProfileData(prev => {
      const current = [...prev.available_equipment];
      const idx = current.indexOf(eq);
      if (idx !== -1) {
        current.splice(idx, 1);
      } else {
        current.push(eq);
      }
      return { ...prev, available_equipment: current };
    });
  };

  const handleRequestPermission = async (key: keyof typeof permissionsStatus) => {
    const granted = await requestDevicePermission(key);
    setPermissionsStatus(prev => ({ ...prev, [key]: granted }));
  };

  const calibrateTargets = () => {
    const targets = calculateCaloricAndMacroTargets(
      profileData.weight,
      profileData.height,
      profileData.age,
      profileData.gender,
      profileData.activity_level,
      profileData.goal
    );
    setCalibratedMacros(targets);
  };

  const generateFirstWorkout = async () => {
    setGeneratingRoutine(true);
    try {
      // Calculate split type selection based on training frequency
      const splitType = profileData.training_days >= 4 ? 'Push Pull Legs' : 'Full Body';
      const generated = generateWorkoutSplit(
        exercises,
        profileData.goal,
        profileData.experience_level,
        profileData.available_equipment,
        splitType
      );

      // Save generated routine to workouts
      const success = await createWorkout(
        `${profileData.goal} Init Split`,
        splitType,
        generated.schedule[0]?.exercises || []
      );
      
      if (!success) {
        console.warn('Failed to insert first generated workout, continuing onboarding.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingRoutine(false);
    }
  };

  const handleFinish = async () => {
    // Save all profile state variables to DB
    const finalPayload = {
      ...profileData,
      permissions: permissionsStatus,
      xp: 150, // Initial onboarding reward
      level: 1,
      streak: 1,
    };

    const success = await updateProfile(finalPayload);
    if (success) {
      try {
        await trackEvent('Profile Completed', { goal: profileData.goal });
      } catch (e) {}
      await refreshProfile();
      navigate('/dashboard');
    }
  };

  const goals = [
    { name: 'Build Muscle', desc: 'Accelerate hypertrophy and density' },
    { name: 'Get Stronger', desc: 'Optimize neuromuscular power outputs' },
    { name: 'Lose Fat', desc: 'Create daily caloric safety envelopes' },
    { name: 'Recomposition', desc: 'Build lean tissue while shedding fat' },
    { name: 'Athletic Performance', desc: 'Enhance explosiveness and stamina' },
    { name: 'General Fitness', desc: 'Build baseline health and consistency' },
  ];

  const equipments = [
    'Full Gym',
    'Home Gym',
    'Dumbbells',
    'Bands',
    'Bodyweight Only'
  ];

  return (
    <div className="min-h-screen bg-[#090a0f] text-slate-100 flex items-center justify-center p-4 relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-brand-blue/5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-2xl glass-panel p-6 md:p-10 rounded-3xl border border-white/5 relative z-10">
        
        {/* Onboarding header steps indicators */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
          <span>Step {step} of 9</span>
          <div className="flex gap-1">
            {[...Array(9)].map((_, i) => (
              <div 
                key={i} 
                className={`w-4 h-1.5 rounded-full transition-all duration-300 ${
                  i + 1 <= step ? 'bg-brand-blue' : 'bg-white/10'
                }`}
              />
            ))}
          </div>
        </div>

        {/* STEP 1: WELCOME & NAME */}
        {step === 1 && (
          <div className="animate-fade-in space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-brand-blue/10 border border-brand-blue/20 flex items-center justify-center text-brand-blue mb-4">
                <Sparkles className="w-8 h-8" />
              </div>
              <h2 className="text-3xl font-extrabold text-white">Initialize ForgeFit AI</h2>
              <p className="text-slate-400 mt-2">Let\'s configure your personalized fitness engine.</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">What is your name?</label>
              <input 
                type="text" 
                placeholder="Enter your name"
                value={profileData.name}
                onChange={e => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                className="glass-input text-lg"
              />
            </div>
          </div>
        )}

        {/* STEP 2: PROFILE INFORMATION */}
        {step === 2 && (
          <div className="animate-fade-in space-y-6">
            <h3 className="text-2xl font-bold text-white mb-6">Physical Biometrics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">Age</label>
                <input 
                  type="number" 
                  value={profileData.age}
                  onChange={e => setProfileData(prev => ({ ...prev, age: parseInt(e.target.value) || 0 }))}
                  className="glass-input"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">Gender</label>
                <select 
                  value={profileData.gender}
                  onChange={e => setProfileData(prev => ({ ...prev, gender: e.target.value }))}
                  className="glass-input"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">Height (cm)</label>
                <input 
                  type="number" 
                  value={profileData.height}
                  onChange={e => setProfileData(prev => ({ ...prev, height: parseFloat(e.target.value) || 0 }))}
                  className="glass-input"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">Weight (kg)</label>
                <input 
                  type="number" 
                  value={profileData.weight}
                  onChange={e => setProfileData(prev => ({ ...prev, weight: parseFloat(e.target.value) || 0 }))}
                  className="glass-input"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">Activity Multiplier</label>
                <select 
                  value={profileData.activity_level}
                  onChange={e => setProfileData(prev => ({ ...prev, activity_level: e.target.value }))}
                  className="glass-input"
                >
                  <option value="Sedentary">Sedentary (desk job)</option>
                  <option value="Lightly Active">Lightly Active (1-3 days light exercise)</option>
                  <option value="Moderately Active">Moderately Active (3-5 days gym)</option>
                  <option value="Very Active">Very Active (6-7 days heavy lift)</option>
                  <option value="Extra Active">Extra Active (2x daily splits)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">Experience level</label>
                <select 
                  value={profileData.experience_level}
                  onChange={e => setProfileData(prev => ({ ...prev, experience_level: e.target.value }))}
                  className="glass-input"
                >
                  <option value="Beginner">Beginner (under 1 year)</option>
                  <option value="Intermediate">Intermediate (1-3 years)</option>
                  <option value="Advanced">Advanced (3+ years compound load)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: GOALS */}
        {step === 3 && (
          <div className="animate-fade-in space-y-6">
            <h3 className="text-2xl font-bold text-white mb-2">Select Your Primary Goal</h3>
            <p className="text-sm text-slate-400 mb-6">Our algorithms adjust calories and sets metrics based on goal choices.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {goals.map(g => (
                <button
                  key={g.name}
                  onClick={() => setProfileData(prev => ({ ...prev, goal: g.name }))}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    profileData.goal === g.name 
                      ? 'border-brand-blue bg-brand-blue/10 shadow-glow-blue' 
                      : 'border-white/5 hover:border-white/10 hover:bg-white/5'
                  }`}
                >
                  <div className="font-bold text-white text-base">{g.name}</div>
                  <div className="text-xs text-slate-400 mt-1">{g.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 4: EQUIPMENT FILTER */}
        {step === 4 && (
          <div className="animate-fade-in space-y-6">
            <h3 className="text-2xl font-bold text-white mb-2">Available Training Equipment</h3>
            <p className="text-sm text-slate-400 mb-6">Workout routines will never include exercises requiring missing equipment.</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {equipments.map(eq => {
                const selected = profileData.available_equipment.includes(eq);
                return (
                  <button
                    key={eq}
                    onClick={() => toggleEquipment(eq)}
                    className={`p-4 rounded-xl border text-center transition-all font-semibold text-sm ${
                      selected 
                        ? 'border-brand-blue bg-brand-blue/10' 
                        : 'border-white/5 hover:bg-white/5'
                    }`}
                  >
                    {eq}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 5: NUTRITION DIETARY PREFERENCE */}
        {step === 5 && (
          <div className="animate-fade-in space-y-6">
            <h3 className="text-2xl font-bold text-white mb-2">Dietary Preferences</h3>
            <p className="text-sm text-slate-400 mb-6">We custom map recipes and nutrition summaries to preference choices.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['Non Vegetarian', 'Vegetarian', 'Vegan'].map(diet => (
                <button
                  key={diet}
                  onClick={() => setProfileData(prev => ({ ...prev, dietary_preference: diet }))}
                  className={`p-5 rounded-2xl border text-center font-bold text-base transition-all ${
                    profileData.dietary_preference === diet 
                      ? 'border-brand-blue bg-brand-blue/10 shadow-glow-blue' 
                      : 'border-white/5 hover:bg-white/5'
                  }`}
                >
                  {diet}
                </button>
              ))}
            </div>
            
            <div className="pt-6">
              <label className="block text-xs font-semibold text-slate-400 mb-2">How many training days per week?</label>
              <input 
                type="range" 
                min="1" 
                max="7" 
                value={profileData.training_days}
                onChange={e => setProfileData(prev => ({ ...prev, training_days: parseInt(e.target.value) }))}
                className="w-full accent-brand-blue bg-white/10 h-2 rounded-lg"
              />
              <div className="flex justify-between text-xs text-slate-500 font-bold mt-2">
                <span>1 Day</span>
                <span className="text-brand-blue">{profileData.training_days} Days / Week</span>
                <span>7 Days</span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 6: PERMISSION CENTER */}
        {step === 6 && (
          <div className="animate-fade-in space-y-6">
            <div>
              <h3 className="text-2xl font-bold text-white mb-1">Permission Request Center</h3>
              <p className="text-sm text-slate-400">Enable services individually to enhance your local routine sync. No prompts triggered at once.</p>
            </div>

            <div className="space-y-3">
              {/* Notifications */}
              <div className="flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-blue/10 flex items-center justify-center text-brand-blue"><Flame className="w-5 h-5" /></div>
                  <div>
                    <h4 className="font-bold text-sm text-white">Browser Notifications</h4>
                    <p className="text-[11px] text-slate-500">Hydration alerts, streak checks, and achievement badges.</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleRequestPermission('notifications')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    permissionsStatus.notifications 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                      : 'bg-white/10 hover:bg-white/15 text-white'
                  }`}
                >
                  {permissionsStatus.notifications ? 'Granted' : 'Enable'}
                </button>
              </div>

              {/* Camera */}
              <div className="flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-purple/10 flex items-center justify-center text-brand-purple"><Camera className="w-5 h-5" /></div>
                  <div>
                    <h4 className="font-bold text-sm text-white">Camera Access</h4>
                    <p className="text-[11px] text-slate-500">Take and archive body transformation logs safely.</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleRequestPermission('camera')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    permissionsStatus.camera 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                      : 'bg-white/10 hover:bg-white/15 text-white'
                  }`}
                >
                  {permissionsStatus.camera ? 'Granted' : 'Enable'}
                </button>
              </div>

              {/* Storage */}
              <div className="flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-cyan/10 flex items-center justify-center text-brand-cyan"><Database className="w-5 h-5" /></div>
                  <div>
                    <h4 className="font-bold text-sm text-white">Storage Persistent Consent</h4>
                    <p className="text-[11px] text-slate-500">Keeps local state from clean sweeps when running offline.</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleRequestPermission('storage')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    permissionsStatus.storage 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                      : 'bg-white/10 hover:bg-white/15 text-white'
                  }`}
                >
                  {permissionsStatus.storage ? 'Granted' : 'Enable'}
                </button>
              </div>
              
              {/* Optional Health Data */}
              <div className="flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500"><Heart className="w-5 h-5" /></div>
                  <div>
                    <h4 className="font-bold text-sm text-white">Apple Health / Google Fit Consent</h4>
                    <p className="text-[11px] text-slate-500">Future sync mapping for steps, cardio, and heart rate.</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleRequestPermission('health')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    permissionsStatus.health 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                      : 'bg-white/10 hover:bg-white/15 text-white'
                  }`}
                >
                  {permissionsStatus.health ? 'Granted' : 'Enable'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 7: AI CALIBRATION TARGETS */}
        {step === 7 && calibratedMacros && (
          <div className="animate-fade-in space-y-6 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-brand-blue/10 flex items-center justify-center text-brand-blue animate-bounce">
              <Cpu className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">Biometrics Calibrated!</h3>
              <p className="text-xs text-slate-400 mt-1">Calculated via Mifflin-St Jeor TDEE algorithms</p>
            </div>

            <div className="grid grid-cols-3 gap-4 max-w-md mx-auto pt-4">
              <div className="glass-panel p-4 rounded-2xl border border-white/5">
                <div className="text-slate-500 text-[10px] uppercase font-bold">Maintenance</div>
                <div className="text-base font-extrabold text-white mt-1">{calibratedMacros.maintenance}</div>
                <span className="text-[9px] text-slate-400">kcal/day</span>
              </div>
              <div className="glass-panel p-4 rounded-2xl border border-brand-blue/30 bg-brand-blue/5">
                <div className="text-brand-blue text-[10px] uppercase font-bold">Target Calories</div>
                <div className="text-lg font-extrabold text-white mt-1">{calibratedMacros.target}</div>
                <span className="text-[9px] text-slate-400">kcal/day</span>
              </div>
              <div className="glass-panel p-4 rounded-2xl border border-white/5">
                <div className="text-slate-500 text-[10px] uppercase font-bold">Water Target</div>
                <div className="text-base font-extrabold text-white mt-1">{Math.round(profileData.weight * 35)}</div>
                <span className="text-[9px] text-slate-400">ml/day</span>
              </div>
            </div>

            <div className="p-4 max-w-sm mx-auto bg-white/5 border border-white/5 rounded-2xl text-xs flex justify-around">
              <div>
                <span className="text-slate-500 font-medium">Protein: </span>
                <span className="text-brand-blue font-bold">{calibratedMacros.macros.proteinG}g</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Carbs: </span>
                <span className="text-brand-purple font-bold">{calibratedMacros.macros.carbsG}g</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Fat: </span>
                <span className="text-brand-cyan font-bold">{calibratedMacros.macros.fatG}g</span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 8: WORKOUT ROUTINE GENERATED */}
        {step === 8 && (
          <div className="animate-fade-in space-y-6 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-brand-purple/10 flex items-center justify-center text-brand-purple">
              <Dumbbell className="w-7 h-7" />
            </div>
            
            <div>
              <h3 className="text-2xl font-bold text-white">Routine Split Generated</h3>
              <p className="text-xs text-slate-400 mt-1">Assigned split: {profileData.training_days >= 4 ? 'Push Pull Legs' : 'Full Body'}</p>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-white/5 text-left max-w-md mx-auto text-xs space-y-2">
              <h4 className="font-bold text-slate-300">Routine Breakdown:</h4>
              <p className="text-slate-400">• Includes 4 exercises per session targeting full fiber ranges.</p>
              <p className="text-slate-400">• Adapted target rep patterns based on your goal to **{profileData.goal}**.</p>
              <p className="text-slate-400">• Deload rules configured to prevent central fatigue accumulation.</p>
            </div>
          </div>
        )}

        {/* STEP 9: FINAL CONGRATULATIONS */}
        {step === 9 && (
          <div className="animate-fade-in space-y-6 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-8 h-8" />
            </div>
            
            <div>
              <h3 className="text-3xl font-extrabold text-white">Ecosystem Active!</h3>
              <p className="text-slate-400 mt-2">Your profile is fully calibrated and live. Onboarding reward +150 XP granted.</p>
            </div>

            <p className="text-slate-500 text-xs max-w-sm mx-auto">
              Launch into your dashboard to log meals, start your active training splits, or query the AI Coach.
            </p>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center justify-between border-t border-white/5 pt-6 mt-8">
          {step > 1 && step < 9 ? (
            <button 
              onClick={handleBack}
              className="glass-btn-secondary flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          ) : <div />}

          {step < 9 ? (
            <button 
              onClick={handleNext}
              className="glass-btn-primary flex items-center gap-2"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button 
              onClick={handleFinish}
              className="w-full py-3 bg-brand-blue hover:bg-blue-700 text-white font-bold rounded-xl text-center transition-all shadow-glow-blue"
            >
              Launch Dashboard Center
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
