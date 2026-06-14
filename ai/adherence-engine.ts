// ForgeFit AI - Adherence Evaluation Engine (v4.3)

import { Profile, WorkoutLog, NutritionLog, SupplementLog, RecoveryLog } from '../shared/types';

export interface AdherenceReport {
  workoutAdherencePct: number; // 0-100
  nutritionAdherencePct: number;
  supplementAdherencePct: number;
  recoveryAdherencePct: number;
  combinedAdherenceScore: number;
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  feedback: string;
}

/**
 * Computes adherence percentages over the past 7 days against target plans.
 */
export const calculateAdherenceReport = (
  profile: Profile,
  workoutLogs: WorkoutLog[],
  nutritionLogs: NutritionLog[],
  supplementLogs: SupplementLog[],
  recoveryLogs: RecoveryLog[],
  currentDateString?: string
): AdherenceReport => {
  const now = currentDateString ? new Date(currentDateString) : new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(now.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  // Filter logs for the past 7 days
  const recentWorkouts = workoutLogs.filter(l => new Date(l.logged_at).getTime() >= sevenDaysAgo.getTime());
  const recentNutrition = nutritionLogs.filter(l => new Date(l.logged_at).getTime() >= sevenDaysAgo.getTime());
  const recentSupplements = supplementLogs.filter(l => new Date(l.logged_at).getTime() >= sevenDaysAgo.getTime());
  const recentRecovery = recoveryLogs.filter(l => new Date(l.logged_at).getTime() >= sevenDaysAgo.getTime());

  // 1. Workout Adherence (Target vs Actual)
  // Target: profile.training_days (sessions per week)
  const targetWorkouts = profile.training_days || 3;
  const actualWorkouts = recentWorkouts.length;
  const workoutAdherencePct = Math.min(Math.round((actualWorkouts / targetWorkouts) * 100), 100);

  // 2. Nutrition Adherence (Calories within +/- 200 kcal limit, water targets met)
  const daysLogged = recentNutrition.length;
  let correctNutritionDays = 0;
  
  recentNutrition.forEach((log) => {
    // Basic target estimated
    const waterTarget = profile.weight * 35;
    const waterMet = log.water_ml >= waterTarget * 0.8;
    const caloriesMet = log.calories > 1200; // simple sanity check
    if (waterMet && caloriesMet) {
      correctNutritionDays += 1;
    }
  });

  const nutritionAdherencePct = daysLogged > 0 ? Math.round((correctNutritionDays / 7) * 100) : 0;

  // 3. Supplement Adherence
  const uniqueSupplementDays = new Set(
    recentSupplements.map(l => new Date(l.logged_at).toISOString().split('T')[0])
  ).size;
  const supplementAdherencePct = Math.round((uniqueSupplementDays / 7) * 100);

  // 4. Recovery Adherence (Sleep logged and >= 7 hours)
  let goodSleepDays = 0;
  recentRecovery.forEach((log) => {
    if (log.sleep_hours && log.sleep_hours >= 7.0) {
      goodSleepDays += 1;
    }
  });
  const recoveryAdherencePct = Math.round((goodSleepDays / 7) * 100);

  // Combined Adherence
  const combinedAdherenceScore = Math.round(
    (workoutAdherencePct * 0.40) +
    (nutritionAdherencePct * 0.25) +
    (supplementAdherencePct * 0.20) +
    (recoveryAdherencePct * 0.15)
  );

  let grade: AdherenceReport['grade'] = 'F';
  let feedback = '';

  if (combinedAdherenceScore >= 90) {
    grade = 'A+';
    feedback = 'Outstanding discipline. You are executing the programs with elite consistency.';
  } else if (combinedAdherenceScore >= 80) {
    grade = 'A';
    feedback = 'Great alignment. Your training and recovery schedules are highly consistent.';
  } else if (combinedAdherenceScore >= 70) {
    grade = 'B';
    feedback = 'Solid consistency, but minor gaps exist. Focus on hydration logs and recovery checks.';
  } else if (combinedAdherenceScore >= 60) {
    grade = 'C';
    feedback = 'Moderate adherence. Aim to lock in training frequency and supplement intakes.';
  } else if (combinedAdherenceScore >= 50) {
    grade = 'D';
    feedback = 'Consistency is wavering. Plan your training days ahead to lower barriers.';
  } else {
    grade = 'F';
    feedback = 'Low adherence index. Let\'s simplify targets to help you re-establish consistency.';
  }

  return {
    workoutAdherencePct,
    nutritionAdherencePct,
    supplementAdherencePct,
    recoveryAdherencePct,
    combinedAdherenceScore,
    grade,
    feedback,
  };
};
