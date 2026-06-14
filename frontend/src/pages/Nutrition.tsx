// ForgeFit AI - Nutrition Tracker Page (v4.3)

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useFitnessData } from '../context/FitnessDataContext';
import { trackEvent } from '../services/analytics';
import { useNotifications } from '../context/NotificationContext';
import { calculateCaloricAndMacroTargets } from '@shared/fitness-models';
import { generateDailyMealPlan } from '@ai/nutrition-planner';
import { 
  Plus, 
  Utensils, 
  Droplet, 
  Sparkles, 
  Apple, 
  Flame, 
  Trash2,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function Nutrition() {
  const { profile } = useAuth();
  const { nutritionLogs, logNutrition } = useFitnessData();
  const { triggerHydrationReminder } = useNotifications();

  // State variables for nutrition form
  const [mealName, setMealName] = useState('');
  const [calories, setCalories] = useState(0);
  const [protein, setProtein] = useState(0);
  const [carbs, setCarbs] = useState(0);
  const [fat, setFat] = useState(0);
  const [waterMl, setWaterMl] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  if (!profile) return null;

  // Retrieve today's date key
  const todayStr = new Date().toISOString().split('T')[0];
  
  const todayNutrition = nutritionLogs.find(
    (n) => new Date(n.logged_at).toISOString().split('T')[0] === todayStr
  ) || { calories: 0, protein: 0, carbs: 0, fat: 0, water_ml: 0 };

  const targetCalAndMacros = calculateCaloricAndMacroTargets(
    profile.weight,
    profile.height,
    profile.age,
    profile.gender,
    profile.activity_level,
    profile.goal
  );

  const mealSuggestions = generateDailyMealPlan(
    profile.weight,
    profile.height,
    profile.age,
    profile.gender,
    profile.activity_level,
    profile.goal,
    profile.dietary_preference
  );

  const handleSubmitMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const newCalories = (todayNutrition.calories || 0) + calories;
    const newProtein = Number(todayNutrition.protein || 0) + protein;
    const newCarbs = Number(todayNutrition.carbs || 0) + carbs;
    const newFat = Number(todayNutrition.fat || 0) + fat;

    const success = await logNutrition(newCalories, newProtein, newCarbs, newFat, todayNutrition.water_ml || 0);
    if (success) {
      try {
        await trackEvent('Nutrition Logged', { type: 'meal', custom: true, calories, protein, carbs, fat });
      } catch (e) {}
      confetti({ particleCount: 30, spread: 60, colors: ['#10b981', '#34d399'] });
      // Reset form
      setMealName('');
      setCalories(0);
      setProtein(0);
      setCarbs(0);
      setFat(0);
    }
    setSubmitting(false);
  };

  const handleAddPrepopulatedMeal = async (meal: any) => {
    const newCalories = (todayNutrition.calories || 0) + meal.calories;
    const newProtein = Number(todayNutrition.protein || 0) + meal.protein;
    const newCarbs = Number(todayNutrition.carbs || 0) + meal.carbs;
    const newFat = Number(todayNutrition.fat || 0) + meal.fat;

    const success = await logNutrition(newCalories, newProtein, newCarbs, newFat, todayNutrition.water_ml || 0);
    if (success) {
      try {
        await trackEvent('Nutrition Logged', { type: 'meal', custom: false, calories: meal.calories, protein: meal.protein });
      } catch (e) {}
      confetti({ particleCount: 40, spread: 80, colors: ['#10b981', '#60a5fa'] });
    }
  };

  const handleAddWater = async (amountMl: number) => {
    const newWater = (todayNutrition.water_ml || 0) + amountMl;
    const success = await logNutrition(
      todayNutrition.calories || 0,
      Number(todayNutrition.protein || 0),
      Number(todayNutrition.carbs || 0),
      Number(todayNutrition.fat || 0),
      newWater
    );
    if (success) {
      try {
        await trackEvent('Nutrition Logged', { type: 'water', amountMl });
      } catch (e) {}
      confetti({ particleCount: 30, spread: 60, colors: ['#3b82f6', '#93c5fd'] });
      triggerHydrationReminder();
    }
  };

  // Calculations
  const targetCalories = targetCalAndMacros.target;
  const targetProtein = targetCalAndMacros.macros.proteinG;
  const targetCarbs = targetCalAndMacros.macros.carbsG;
  const targetFat = targetCalAndMacros.macros.fatG;

  const currentCalories = todayNutrition.calories || 0;
  const currentProtein = todayNutrition.protein || 0;
  const currentCarbs = todayNutrition.carbs || 0;
  const currentFat = todayNutrition.fat || 0;
  const currentWater = todayNutrition.water_ml || 0;

  const waterTargetMl = Math.round(profile.weight * 35);
  const waterProgress = Math.min(Math.round((currentWater / waterTargetMl) * 100), 100);

  return (
    <div className="space-y-6">
      
      {/* Dynamic intake rings row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Calories Card */}
        <div className="glass-panel p-5 rounded-3xl border border-white/5 text-center relative overflow-hidden">
          <div className="text-xs uppercase text-slate-500 font-bold tracking-wider">Calories Remaining</div>
          <div className="text-3xl font-extrabold mt-3 text-white">
            {Math.max(targetCalories - currentCalories, 0)} <span className="text-xs font-normal text-slate-400">/ {targetCalories} kcal</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">Logged today: {currentCalories} kcal</p>
        </div>

        {/* Protein Card */}
        <div className="glass-panel p-5 rounded-3xl border border-white/5 text-center">
          <div className="text-xs uppercase text-slate-500 font-bold tracking-wider">Protein Progress</div>
          <div className="text-3xl font-extrabold mt-3 text-brand-blue">
            {currentProtein}g <span className="text-xs font-normal text-slate-400">/ {targetProtein}g</span>
          </div>
          <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden mt-3">
            <div className="bg-brand-blue h-full rounded-full" style={{ width: `${Math.min((Number(currentProtein) / targetProtein) * 100, 100)}%` }} />
          </div>
        </div>

        {/* Carbs Card */}
        <div className="glass-panel p-5 rounded-3xl border border-white/5 text-center">
          <div className="text-xs uppercase text-slate-500 font-bold tracking-wider">Carbs Progress</div>
          <div className="text-3xl font-extrabold mt-3 text-brand-purple">
            {currentCarbs}g <span className="text-xs font-normal text-slate-400">/ {targetCarbs}g</span>
          </div>
          <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden mt-3">
            <div className="bg-brand-purple h-full rounded-full" style={{ width: `${Math.min((Number(currentCarbs) / targetCarbs) * 100, 100)}%` }} />
          </div>
        </div>

        {/* Fat Card */}
        <div className="glass-panel p-5 rounded-3xl border border-white/5 text-center">
          <div className="text-xs uppercase text-slate-500 font-bold tracking-wider">Fats Progress</div>
          <div className="text-3xl font-extrabold mt-3 text-brand-cyan">
            {currentFat}g <span className="text-xs font-normal text-slate-400">/ {targetFat}g</span>
          </div>
          <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden mt-3">
            <div className="bg-brand-cyan h-full rounded-full" style={{ width: `${Math.min((Number(currentFat) / targetFat) * 100, 100)}%` }} />
          </div>
        </div>
      </div>

      {/* Hydration Tracker Panel */}
      <div className="glass-panel p-6 rounded-3xl border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 flex-1">
          <h3 className="font-extrabold text-lg text-white flex items-center gap-1.5">
            <Droplet className="w-5 h-5 text-brand-blue fill-brand-blue/20" />
            Hydration Tracker
          </h3>
          <p className="text-xs text-slate-400">Target water intake calibrated at 35ml per kg of weight.</p>
          <div className="flex items-center gap-4 pt-2">
            <div className="text-3xl font-extrabold text-white">{currentWater} <span className="text-xs font-normal text-slate-400">/ {waterTargetMl} ml</span></div>
            <span className="text-xs font-bold text-brand-blue">{waterProgress}% Goal Met</span>
          </div>
          <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
            <div className="bg-brand-blue h-full rounded-full" style={{ width: `${waterProgress}%` }} />
          </div>
        </div>

        <div className="flex gap-2 shrink-0">
          <button 
            onClick={() => handleAddWater(250)}
            className="glass-btn-secondary flex items-center gap-1 py-3 text-xs border-brand-blue/25 text-brand-blue bg-brand-blue/5"
          >
            <Plus className="w-3.5 h-3.5" /> 250ml
          </button>
          <button 
            onClick={() => handleAddWater(500)}
            className="glass-btn-primary flex items-center gap-1 py-3 text-xs"
          >
            <Plus className="w-3.5 h-3.5" /> 500ml
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Meal Log Form */}
        <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-4">
          <h3 className="font-bold text-lg text-white flex items-center gap-2">
            <Utensils className="w-5 h-5 text-brand-blue" />
            Log Custom Food Meal
          </h3>
          
          <form onSubmit={handleSubmitMeal} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 font-semibold mb-2">Meal Description</label>
              <input 
                type="text" 
                placeholder="e.g. Scrambled Eggs with Avocado Toast"
                value={mealName}
                onChange={e => setMealName(e.target.value)}
                className="glass-input"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 font-semibold mb-2">Calories (kcal)</label>
                <input 
                  type="number" 
                  value={calories}
                  onChange={e => setCalories(parseInt(e.target.value) || 0)}
                  className="glass-input"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-2">Protein (g)</label>
                <input 
                  type="number" 
                  value={protein}
                  onChange={e => setProtein(parseInt(e.target.value) || 0)}
                  className="glass-input"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-2">Carbohydrates (g)</label>
                <input 
                  type="number" 
                  value={carbs}
                  onChange={e => setCarbs(parseInt(e.target.value) || 0)}
                  className="glass-input"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-2">Fats (g)</label>
                <input 
                  type="number" 
                  value={fat}
                  onChange={e => setFat(parseInt(e.target.value) || 0)}
                  className="glass-input"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={submitting}
              className="w-full glass-btn-primary py-3 rounded-xl font-bold mt-2 disabled:opacity-50"
            >
              {submitting ? 'Saving log...' : 'Save Meal Logs'}
            </button>
          </form>
        </div>

        {/* AI Suggested meal templates */}
        <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-4">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-5 h-5 text-brand-blue" />
            <h3 className="font-bold text-lg text-white">AI Suggested Meal Templates</h3>
          </div>

          <p className="text-xs text-slate-400">High-protein choices configured for {profile.dietary_preference} preferences.</p>

          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
            {Object.entries(mealSuggestions.mealSuggestions).map(([timeOfDay, meal]) => (
              <div key={timeOfDay} className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] bg-brand-blue/15 text-brand-blue border border-brand-blue/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">{timeOfDay}</span>
                    <span className="text-xs font-extrabold text-white">{meal.name}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">
                    Calories: {meal.calories} kcal | Protein: {meal.protein}g | Carbs: {meal.carbs}g | Fat: {meal.fat}g
                  </div>
                </div>

                <button 
                  onClick={() => handleAddPrepopulatedMeal(meal)}
                  className="p-2 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 text-brand-blue font-bold text-xs"
                >
                  Eat
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
