// ForgeFit AI - Analytics Engine (v4.3)

import { WorkoutLog, WorkoutLogSet, NutritionLog, SupplementLog, Measurement, RecoveryLog } from '../shared/types';

export interface VolumeTrendPoint {
  date: string;
  volume: number;
  setsCount: number;
}

export interface StrengthTrendPoint {
  date: string;
  weight: number;
  estimated1RM: number;
}

export interface NutritionCompliancePoint {
  date: string;
  targetCalories: number;
  loggedCalories: number;
  proteinLogged: number;
  proteinTarget: number;
  waterLoggedMl: number;
}

export interface SupplementCompliancePoint {
  date: string;
  creatineTaken: number; // 1 or 0 for plotting
  wheyTaken: number;
}

export interface RecoveryTrendPoint {
  date: string;
  sleepHours: number;
  readinessScore: number;
  soreness: number;
}

/**
 * Computes weekly and monthly workout volume trends.
 */
export const generateVolumeAnalytics = (
  workoutLogs: WorkoutLog[]
): VolumeTrendPoint[] => {
  // Sort logs by date ascending
  const sorted = [...workoutLogs].sort(
    (a, b) => new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime()
  );

  return sorted.slice(-14).map((log) => {
    const d = new Date(log.logged_at);
    return {
      date: `${d.getMonth() + 1}/${d.getDate()}`,
      volume: Number(log.total_volume.toFixed(0)),
      setsCount: log.duration_minutes > 0 ? Math.round(log.duration_minutes / 12) * 3 : 9, // estimated
    };
  });
};

/**
 * Calculates Estimated One-Rep Max (1RM) using Epley Formula: Weight * (1 + Reps/30).
 */
export const calculate1RM = (weight: number, reps: number): number => {
  if (reps === 1) return weight;
  if (reps === 0) return 0;
  return Number((weight * (1 + reps / 30)).toFixed(1));
};

/**
 * Extracts strength progress curve for a specific exercise over time.
 */
export const generateStrengthProgress = (
  logSets: WorkoutLogSet[],
  workoutLogs: WorkoutLog[],
  targetExerciseId: string
): StrengthTrendPoint[] => {
  // Filter sets for the target exercise
  const exerciseSets = logSets.filter((s) => s.exercise_id === targetExerciseId && s.completed);

  // Group by log_id to find the max lift per log date
  const bestLiftsByDate: Record<string, { weight: number; reps: number; loggedAt: string }> = {};

  exerciseSets.forEach((set) => {
    const parentLog = workoutLogs.find((l) => l.id === set.log_id);
    if (!parentLog) return;

    const dateKey = new Date(parentLog.logged_at).toDateString();
    const est1RM = calculate1RM(set.weight, set.reps);

    const currentBest = bestLiftsByDate[dateKey];
    const newBestVal = calculate1RM(set.weight, set.reps);

    if (!currentBest || newBestVal > calculate1RM(currentBest.weight, currentBest.reps)) {
      bestLiftsByDate[dateKey] = {
        weight: set.weight,
        reps: set.reps,
        loggedAt: parentLog.logged_at,
      };
    }
  });

  return Object.values(bestLiftsByDate)
    .sort((a, b) => new Date(a.loggedAt).getTime() - new Date(b.loggedAt).getTime())
    .map((item) => {
      const d = new Date(item.loggedAt);
      return {
        date: `${d.getMonth() + 1}/${d.getDate()}`,
        weight: item.weight,
        estimated1RM: calculate1RM(item.weight, item.reps),
      };
    });
};

/**
 * Aggregates daily nutrition compliance data.
 */
export const generateNutritionCompliance = (
  nutritionLogs: NutritionLog[],
  targetCalories: number,
  targetProteinG: number
): NutritionCompliancePoint[] => {
  const sorted = [...nutritionLogs].sort(
    (a, b) => new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime()
  );

  return sorted.slice(-10).map((log) => {
    const d = new Date(log.logged_at);
    return {
      date: `${d.getMonth() + 1}/${d.getDate()}`,
      targetCalories,
      loggedCalories: log.calories,
      proteinLogged: Number(log.protein),
      proteinTarget: targetProteinG,
      waterLoggedMl: log.water_ml,
    };
  });
};

/**
 * Aggregates daily recovery and sleep index trends.
 */
export const generateRecoveryTrends = (
  recoveryLogs: RecoveryLog[],
  readinessHistory: { date: string; score: number }[]
): RecoveryTrendPoint[] => {
  const sortedLogs = [...recoveryLogs].sort(
    (a, b) => new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime()
  );

  return sortedLogs.slice(-10).map((log) => {
    const d = new Date(log.logged_at);
    const dateStr = d.toDateString();
    const matchingReadiness = readinessHistory.find((r) => new Date(r.date).toDateString() === dateStr);
    
    return {
      date: `${d.getMonth() + 1}/${d.getDate()}`,
      sleepHours: Number(log.sleep_hours || 0),
      readinessScore: matchingReadiness ? matchingReadiness.score : (log.recovery_pct || 70),
      soreness: log.soreness_score || 3,
    };
  });
};

/**
 * Aggregates supplement compliance logs.
 */
export const generateSupplementCompliance = (
  supplementLogs: SupplementLog[]
): SupplementCompliancePoint[] => {
  const sorted = [...supplementLogs].sort(
    (a, b) => new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime()
  );

  // Group by date to count daily checks
  const days: Record<string, { creatine: number; whey: number; date: string }> = {};

  sorted.forEach((log) => {
    const key = new Date(log.logged_at).toDateString();
    if (!days[key]) {
      days[key] = { creatine: 0, whey: 0, date: log.logged_at };
    }
    if (log.creatine_g > 0) days[key].creatine = 1;
    if (log.whey_protein_g > 0) days[key].whey = 1;
  });

  return Object.values(days)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-14)
    .map((d) => {
      const parsedDate = new Date(d.date);
      return {
        date: `${parsedDate.getMonth() + 1}/${parsedDate.getDate()}`,
        creatineTaken: d.creatine,
        wheyTaken: d.whey,
      };
    });
};
