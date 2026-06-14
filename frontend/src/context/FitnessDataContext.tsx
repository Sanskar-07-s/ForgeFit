// ForgeFit AI - Central Fitness Data Provider Context (v4.3)

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../services/supabase';
import {
  Exercise,
  Workout,
  WorkoutLog,
  WorkoutLogSet,
  NutritionLog,
  SupplementLog,
  Measurement,
  RecoveryLog,
  MuscleFatigueLog,
  Challenge,
  Achievement
} from '@shared/types';
import { XP_REWARDS } from '@shared/constants';
import { calculateUpdatedStreak } from '@ai/streak-engine';
import { calculateMuscleFatigue } from '@ai/muscle-fatigue-engine';
import { notifications } from '../services/notifications';
import { errorMonitor } from '../services/error-monitor';

interface FitnessDataContextType {
  exercises: Exercise[];
  workouts: Workout[];
  workoutLogs: WorkoutLog[];
  nutritionLogs: NutritionLog[];
  supplementLogs: SupplementLog[];
  measurements: Measurement[];
  recoveryLogs: RecoveryLog[];
  fatigueLogs: MuscleFatigueLog[];
  challenges: Challenge[];
  achievements: Achievement[];
  loadingData: boolean;
  
  createWorkout: (name: string, split: string, exercisesList: any[]) => Promise<boolean>;
  logWorkoutSession: (workoutId: string, duration: number, rpe: number, notes: string, setsList: any[]) => Promise<boolean>;
  logNutrition: (calories: number, protein: number, carbs: number, fat: number, waterMl: number) => Promise<boolean>;
  logSupplement: (creatineG: number, wheyG: number, notes?: string) => Promise<boolean>;
  logRecovery: (sleep: number, soreness: number, volume?: number, duration?: number) => Promise<boolean>;
  logMeasurement: (metrics: Partial<Measurement>) => Promise<boolean>;
  loadAllData: () => Promise<void>;
}

const FitnessDataContext = createContext<FitnessDataContextType | undefined>(undefined);

export const FitnessDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, updateProfile } = useAuth();

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [nutritionLogs, setNutritionLogs] = useState<NutritionLog[]>([]);
  const [supplementLogs, setSupplementLogs] = useState<SupplementLog[]>([]);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [recoveryLogs, setRecoveryLogs] = useState<RecoveryLog[]>([]);
  const [fatigueLogs, setFatigueLogs] = useState<MuscleFatigueLog[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    if (user) {
      loadAllData();
    }
  }, [user]);

  const loadAllData = async () => {
    setLoadingData(true);
    try {
      // Parallel fetches for performance
      const [
        resEx,
        resWorkouts,
        resLogs,
        resNutrition,
        resSupps,
        resMeasurements,
        resRecovery,
        resFatigue,
        resChallenges,
        resAchievements
      ] = await Promise.all([
        supabase.from('exercises').select('*'),
        supabase.from('workouts').select('*').eq('user_id', user.id),
        supabase.from('workout_logs').select('*').eq('user_id', user.id),
        supabase.from('nutrition_logs').select('*').eq('user_id', user.id),
        supabase.from('supplement_logs').select('*').eq('user_id', user.id),
        supabase.from('measurements').select('*').eq('user_id', user.id),
        supabase.from('recovery_logs').select('*').eq('user_id', user.id),
        supabase.from('muscle_fatigue_logs').select('*').eq('user_id', user.id),
        supabase.from('challenges').select('*'),
        supabase.from('achievements').select('*'),
      ]);

      if (resEx.data) setExercises(resEx.data);
      if (resWorkouts.data) setWorkouts(resWorkouts.data);
      if (resLogs.data) setWorkoutLogs(resLogs.data);
      if (resNutrition.data) setNutritionLogs(resNutrition.data);
      if (resSupps.data) setSupplementLogs(resSupps.data);
      if (resMeasurements.data) setMeasurements(resMeasurements.data);
      if (resRecovery.data) setRecoveryLogs(resRecovery.data);
      if (resFatigue.data) setFatigueLogs(resFatigue.data);
      if (resChallenges.data) setChallenges(resChallenges.data);
      if (resAchievements.data) setAchievements(resAchievements.data);

    } catch (err: any) {
      errorMonitor.logError('api_failure', 'Telemetry load failure: ' + err.message, err.stack);
    } finally {
      setLoadingData(false);
    }
  };

  const grantXp = async (amount: number) => {
    if (!profile) return;
    const nextXp = profile.xp + amount;
    const levelUpThreshold = profile.level * 1000;
    let nextLevel = profile.level;
    let remainderXp = nextXp;

    if (remainderXp >= levelUpThreshold) {
      remainderXp -= levelUpThreshold;
      nextLevel += 1;
      // Trigger level-up notification
      notifications.sendNotification(
        user.id,
        `Level Up unlocked! 🚀`,
        `Congratulations! You reached Level ${nextLevel}. Keep pushing consistency!`,
        'system'
      );
    }

    await updateProfile({ xp: remainderXp, level: nextLevel });
  };

  const createWorkout = async (name: string, split: string, exercisesList: any[]): Promise<boolean> => {
    try {
      const workoutId = Math.random().toString(36).substring(2, 9);
      
      const { error: errorW } = await supabase.from('workouts').insert({
        id: workoutId,
        user_id: user.id,
        name,
        split_type: split,
      });
      if (errorW) throw errorW;

      const exercisesPayload = exercisesList.map((ex, idx) => ({
        id: Math.random().toString(36).substring(2, 9),
        workout_id: workoutId,
        exercise_id: ex.id,
        order_index: idx,
        sets: ex.sets || 3,
        reps: ex.reps || '10',
        rest_time_seconds: ex.rest_time || 90,
      }));

      const { error: errorE } = await supabase.from('workout_exercises').insert(exercisesPayload);
      if (errorE) throw errorE;

      await loadAllData();
      return true;
    } catch (err: any) {
      errorMonitor.logError('api_failure', 'Workout save failed: ' + err.message);
      return false;
    }
  };

  const logWorkoutSession = async (
    workoutId: string,
    duration: number,
    rpe: number,
    notes: string,
    setsList: any[]
  ): Promise<boolean> => {
    try {
      const logId = Math.random().toString(36).substring(2, 9);
      
      // Calculate total volume (sum weight * reps * completed sets)
      const completedSets = setsList.filter(s => s.completed);
      const totalVolume = completedSets.reduce((sum, s) => sum + (s.weight * s.reps), 0);

      const { error: errorL } = await supabase.from('workout_logs').insert({
        id: logId,
        user_id: user.id,
        workout_id: workoutId,
        duration_minutes: duration,
        total_volume: totalVolume,
        rpe,
        notes,
        logged_at: new Date().toISOString(),
      });
      if (errorL) throw errorL;

      const setsPayload = setsList.map((s, idx) => ({
        id: Math.random().toString(36).substring(2, 9),
        log_id: logId,
        exercise_id: s.exercise_id,
        set_number: idx + 1,
        weight: s.weight,
        reps: s.reps,
        completed: s.completed,
        rpe: s.rpe || rpe,
      }));

      const { error: errorS } = await supabase.from('workout_log_sets').insert(setsPayload);
      if (errorS) throw errorS;

      // Update streaks
      const streakReport = calculateUpdatedStreak(profile?.last_workout_date, profile?.streak || 0);
      const longest = Math.max(streakReport.newStreak, profile?.longest_streak || 0);
      await updateProfile({
        streak: streakReport.newStreak,
        longest_streak: longest,
        last_workout_date: new Date().toISOString().split('T')[0],
      });

      // Grant XP
      await grantXp(XP_REWARDS.LOG_WORKOUT + (completedSets.length * XP_REWARDS.COMPLETE_SET));

      // Check achievements triggers
      if (workoutLogs.length === 0) {
        // First Workout Unlock
        const ach = achievements.find(a => a.code === 'FIRST_WORKOUT');
        if (ach) {
          await supabase.from('user_achievements').insert({
            id: Math.random().toString(36).substring(2, 9),
            user_id: user.id,
            achievement_id: ach.id,
          });
          notifications.sendNotification(user.id, 'Achievement unlocked! 🏆', ach.name + ': ' + ach.description, 'challenge');
        }
      }

      await loadAllData();
      return true;
    } catch (err: any) {
      errorMonitor.logError('api_failure', 'Workout log save failed: ' + err.message);
      return false;
    }
  };

  const logNutrition = async (calories: number, protein: number, carbs: number, fat: number, waterMl: number): Promise<boolean> => {
    try {
      const { error } = await supabase.from('nutrition_logs').insert({
        id: Math.random().toString(36).substring(2, 9),
        user_id: user.id,
        calories,
        protein,
        carbs,
        fat,
        water_ml: waterMl,
        logged_at: new Date().toISOString(),
      });
      if (error) throw error;

      await grantXp(XP_REWARDS.LOG_NUTRITION);
      await loadAllData();
      return true;
    } catch (err: any) {
      errorMonitor.logError('api_failure', 'Nutrition log save failed: ' + err.message);
      return false;
    }
  };

  const logSupplement = async (creatineG: number, wheyG: number, notes?: string): Promise<boolean> => {
    try {
      const { error } = await supabase.from('supplement_logs').insert({
        id: Math.random().toString(36).substring(2, 9),
        user_id: user.id,
        creatine_g: creatineG,
        whey_protein_g: wheyG,
        notes,
        logged_at: new Date().toISOString(),
      });
      if (error) throw error;

      await grantXp(XP_REWARDS.LOG_SUPPLEMENT);
      await loadAllData();
      return true;
    } catch (err: any) {
      errorMonitor.logError('api_failure', 'Supplement log save failed: ' + err.message);
      return false;
    }
  };

  const logRecovery = async (sleep: number, soreness: number, volume?: number, duration?: number): Promise<boolean> => {
    try {
      const recoveryId = Math.random().toString(36).substring(2, 9);
      
      // Calculate recovery % based on sleep and soreness
      let recoveryPct = 100;
      if (sleep < 7) recoveryPct -= (7 - sleep) * 12;
      if (soreness > 3) recoveryPct -= (soreness - 3) * 8;
      recoveryPct = Math.max(Math.min(recoveryPct, 100), 0);

      const { error: errorR } = await supabase.from('recovery_logs').insert({
        id: recoveryId,
        user_id: user.id,
        sleep_hours: sleep,
        soreness_score: soreness,
        workout_volume: volume,
        workout_duration: duration,
        recovery_pct: recoveryPct,
        consecutive_days: profile?.streak || 0,
        logged_at: new Date().toISOString(),
      });
      if (errorR) throw errorR;

      // Re-evaluate muscle fatigue percentages based on active sets
      const fatigueReport = calculateMuscleFatigue(workoutLogs, [], exercises);
      
      const chestF = fatigueReport.find(f => f.muscleGroup === 'Chest')?.fatiguePct || 0;
      const backF = fatigueReport.find(f => f.muscleGroup === 'Back')?.fatiguePct || 0;
      const shoulderF = fatigueReport.find(f => f.muscleGroup === 'Shoulders')?.fatiguePct || 0;
      const armsF = fatigueReport.find(f => f.muscleGroup === 'Arms')?.fatiguePct || 0;
      const legsF = fatigueReport.find(f => f.muscleGroup === 'Legs')?.fatiguePct || 0;

      const { error: errorF } = await supabase.from('muscle_fatigue_logs').insert({
        id: Math.random().toString(36).substring(2, 9),
        user_id: user.id,
        chest_fatigue: chestF,
        back_fatigue: backF,
        shoulders_fatigue: shoulderF,
        arms_fatigue: armsF,
        legs_fatigue: legsF,
        logged_at: new Date().toISOString(),
      });
      if (errorF) throw errorF;

      await grantXp(XP_REWARDS.LOG_RECOVERY);
      await loadAllData();
      return true;
    } catch (err: any) {
      errorMonitor.logError('api_failure', 'Recovery log save failed: ' + err.message);
      return false;
    }
  };

  const logMeasurement = async (metrics: Partial<Measurement>): Promise<boolean> => {
    try {
      const { error } = await supabase.from('measurements').insert({
        id: Math.random().toString(36).substring(2, 9),
        user_id: user.id,
        weight: metrics.weight || profile?.weight,
        chest: metrics.chest,
        arms: metrics.arms,
        waist: metrics.waist,
        shoulders: metrics.shoulders,
        thighs: metrics.thighs,
        calves: metrics.calves,
        logged_at: new Date().toISOString(),
      });
      if (error) throw error;

      // If weight changes, update user profile as well
      if (metrics.weight) {
        await updateProfile({ weight: metrics.weight });
      }

      await loadAllData();
      return true;
    } catch (err: any) {
      errorMonitor.logError('api_failure', 'Measurements log save failed: ' + err.message);
      return false;
    }
  };

  return (
    <FitnessDataContext.Provider
      value={{
        exercises,
        workouts,
        workoutLogs,
        nutritionLogs,
        supplementLogs,
        measurements,
        recoveryLogs,
        fatigueLogs,
        challenges,
        achievements,
        loadingData,
        createWorkout,
        logWorkoutSession,
        logNutrition,
        logSupplement,
        logRecovery,
        logMeasurement,
        loadAllData,
      }}
    >
      {children}
    </FitnessDataContext.Provider>
  );
};

export const useFitnessData = () => {
  const context = useContext(FitnessDataContext);
  if (!context) {
    throw new Error('useFitnessData must be used within a FitnessDataProvider');
  }
  return context;
};
