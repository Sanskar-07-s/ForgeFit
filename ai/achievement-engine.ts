// ForgeFit AI - Achievement and Gamification Engine (v4.3)

import { Achievement, UserAchievement, WorkoutLog, SupplementLog, NutritionLog } from '../shared/types';
import { XP_REWARDS, LEVEL_UP_XP_FACTOR } from '../shared/constants';

export interface GamificationState {
  currentXp: number;
  currentLevel: number;
  xpNeededForNextLevel: number;
  progressToNextLevel: number; // percentage
}

/**
 * Calculates current level and progression parameters from total accumulated XP.
 */
export const calculateGamificationState = (totalXp: number): GamificationState => {
  let level = 1;
  let xp = totalXp;

  while (true) {
    const xpRequired = level * LEVEL_UP_XP_FACTOR;
    if (xp >= xpRequired) {
      xp -= xpRequired;
      level += 1;
    } else {
      break;
    }
  }

  const xpNeededForNextLevel = level * LEVEL_UP_XP_FACTOR;
  const progressToNextLevel = Math.round((xp / xpNeededForNextLevel) * 100);

  return {
    currentXp: xp,
    currentLevel: level,
    xpNeededForNextLevel,
    progressToNextLevel,
  };
};

/**
 * Evaluates user activity logs to detect newly unlocked achievements.
 * Returns array of achievement codes to unlock.
 */
export const evaluateAchievements = (
  workoutLogs: WorkoutLog[],
  supplementLogs: SupplementLog[],
  nutritionLogs: NutritionLog[],
  currentStreak: number,
  hasPr: boolean,
  unlockedAchievements: UserAchievement[],
  allAchievements: Achievement[]
): Achievement[] => {
  const unlockedCodes = new Set(
    unlockedAchievements.map(ua => {
      const match = allAchievements.find(a => a.id === ua.achievement_id);
      return match ? match.code : '';
    })
  );

  const newUnlocks: Achievement[] = [];

  const checkAndAdd = (code: string) => {
    if (unlockedCodes.has(code)) return;
    const achievement = allAchievements.find(a => a.code === code);
    if (achievement) {
      newUnlocks.push(achievement);
    }
  };

  // 1. First Workout
  if (workoutLogs.length >= 1) {
    checkAndAdd('FIRST_WORKOUT');
  }

  // 2. Streaks
  if (currentStreak >= 7) {
    checkAndAdd('SEVEN_DAY_WARRIOR');
  }
  if (currentStreak >= 30) {
    checkAndAdd('THIRTY_DAY_DISCIPLINE');
  }

  // 3. First PR
  if (hasPr) {
    checkAndAdd('FIRST_PR');
  }

  // 4. Centurion Lifter (100 workouts)
  if (workoutLogs.length >= 100) {
    checkAndAdd('ONE_HUNDRED_WORKOUTS');
  }

  // 5. Hydration Hero (met target 7 days)
  // Let's count days where water >= 2500 ml
  const hydrationDays = nutritionLogs.filter(n => n.water_ml >= 2500).length;
  if (hydrationDays >= 7) {
    checkAndAdd('HYDRATION_HERO');
  }

  // 6. Supplement consistency
  const creatineDays = supplementLogs.filter(s => s.creatine_g >= 3.0).length;
  if (creatineDays >= 100) {
    checkAndAdd('IRON_HABIT_MASTER');
  }

  return newUnlocks;
};
