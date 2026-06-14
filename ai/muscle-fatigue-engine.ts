// ForgeFit AI - Muscle Fatigue Engine (v4.3)

import { WorkoutLog, WorkoutLogSet, MuscleFatigueLog } from '../shared/types';

export interface MuscleFatigueAssessment {
  muscleGroup: string;
  fatiguePct: number; // 0 - 100
  recoveryPct: number; // 0 - 100
  recommendation: string;
}

/**
 * Calculates current fatigue levels across Chest, Back, Shoulders, Arms, and Legs.
 * Analyzes sets logged over the past 7 days.
 */
export const calculateMuscleFatigue = (
  workoutLogs: WorkoutLog[],
  logSets: WorkoutLogSet[],
  allExercises: any[], // To look up muscle group mapping
  lastFatigueLog?: MuscleFatigueLog
): MuscleFatigueAssessment[] => {
  // Muscle groups we track
  const trackedGroups = ['Chest', 'Back', 'Shoulders', 'Arms', 'Legs'];

  // Initialize fatigue map
  const fatigueMap: Record<string, number> = {
    Chest: lastFatigueLog?.chest_fatigue || 0,
    Back: lastFatigueLog?.back_fatigue || 0,
    Shoulders: lastFatigueLog?.shoulders_fatigue || 0,
    Arms: lastFatigueLog?.arms_fatigue || 0,
    Legs: lastFatigueLog?.legs_fatigue || 0,
  };

  // Filter logs in the last 4 days (high fatigue impact window)
  const now = new Date();
  const fourDaysAgo = new Date();
  fourDaysAgo.setDate(now.getDate() - 4);

  const recentLogs = workoutLogs.filter(
    (l) => new Date(l.logged_at).getTime() >= fourDaysAgo.getTime()
  );
  const recentLogIds = recentLogs.map((l) => l.id);

  // Group sets by log and exercise
  const recentSets = logSets.filter((s) => recentLogIds.includes(s.log_id));

  // Count sets per muscle group in the past 4 days
  const setCounts: Record<string, number> = { Chest: 0, Back: 0, Shoulders: 0, Arms: 0, Legs: 0 };

  recentSets.forEach((set) => {
    const exercise = allExercises.find((e) => e.id === set.exercise_id);
    if (!exercise) return;

    const group = exercise.muscle_group.toLowerCase();

    if (group.includes('chest')) {
      setCounts.Chest += 1;
    } else if (group.includes('lat') || group.includes('back') || group.includes('rhomboid')) {
      setCounts.Back += 1;
    } else if (group.includes('delt') || group.includes('shoulder') || group.includes('trap')) {
      setCounts.Shoulders += 1;
    } else if (group.includes('bicep') || group.includes('tricep') || group.includes('arm') || group.includes('forearm')) {
      setCounts.Arms += 1;
    } else if (group.includes('quad') || group.includes('hamstring') || group.includes('glute') || group.includes('calf') || group.includes('leg')) {
      setCounts.Legs += 1;
    }
  });

  // Calculate fatigue percentage
  // We assume:
  // - 10 working sets in 4 days causes 50% fatigue
  // - 20+ working sets causes 100% fatigue
  // We decay fatigue linearly by 25% per day since the last logged workout
  const millisecondsInDay = 1000 * 60 * 60 * 24;
  let decayFactor = 1.0;

  if (recentLogs.length > 0) {
    const latestLog = [...recentLogs].sort(
      (a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime()
    )[0];
    const daysSinceLastWorkout = (now.getTime() - new Date(latestLog.logged_at).getTime()) / millisecondsInDay;
    decayFactor = Math.max(1.0 - (daysSinceLastWorkout * 0.25), 0);
  } else {
    decayFactor = 0; // No workouts recently, fatigue decays fully to zero
  }

  return trackedGroups.map((group) => {
    const sets = setCounts[group] || 0;
    const computedFatigue = Math.min((sets / 20) * 100, 100);
    
    // Apply fatigue carrying from previous states decaying
    const activeFatigue = Math.round(Math.max(computedFatigue, fatigueMap[group] * decayFactor));
    const recoveryPct = 100 - activeFatigue;

    let recommendation = 'Ready for training.';
    if (activeFatigue >= 75) {
      recommendation = 'Highly fatigued. Muscle needs 48 hours rest.';
    } else if (activeFatigue >= 40) {
      recommendation = 'Moderately fatigued. Limit sets to maintenance volume.';
    }

    return {
      muscleGroup: group,
      fatiguePct: activeFatigue,
      recoveryPct,
      recommendation,
    };
  });
};
