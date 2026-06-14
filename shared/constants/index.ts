// ForgeFit AI - Shared Constants (v4.3)

import { SubscriptionTier } from '../enums';

export const XP_REWARDS = {
  LOG_WORKOUT: 200,
  COMPLETE_SET: 10,
  LOG_NUTRITION: 50,
  LOG_SUPPLEMENT: 30,
  LOG_RECOVERY: 40,
  UNLOCK_PR: 150,
  JOIN_CHALLENGE: 100,
};

export const LEVEL_UP_XP_FACTOR = 1000; // XP needed to level up is level * 1000

export const DEFAULT_NUTRITION_RATIOS = {
  // Goal: [Carbs %, Protein %, Fat %]
  'Build Muscle': { carbs: 50, protein: 30, fat: 20 },
  'Get Stronger': { carbs: 45, protein: 30, fat: 25 },
  'Lose Fat': { carbs: 35, protein: 40, fat: 25 },
  'Recomposition': { carbs: 40, protein: 35, fat: 25 },
  'Athletic Performance': { carbs: 55, protein: 25, fat: 20 },
  'General Fitness': { carbs: 45, protein: 30, fat: 25 },
};

export const WATER_BASE_ML_PER_KG = 35; // 35ml per kg of bodyweight
export const PROTEIN_BASE_G_PER_KG = {
  'Build Muscle': 2.0,
  'Get Stronger': 1.8,
  'Lose Fat': 2.2,
  'Recomposition': 2.0,
  'Athletic Performance': 1.7,
  'General Fitness': 1.5,
};

export const TIER_LIMITS = {
  [SubscriptionTier.FREE]: {
    aiRequestsPerDay: 5,
    customRoutinesCount: 3,
    advancedAnalytics: false,
    anatomy3d: true, // we keep basic anatomy active but filter options if required
  },
  [SubscriptionTier.PRO]: {
    aiRequestsPerDay: 99999,
    customRoutinesCount: 99999,
    advancedAnalytics: true,
    anatomy3d: true,
  },
  [SubscriptionTier.COACH]: {
    aiRequestsPerDay: 99999,
    customRoutinesCount: 99999,
    advancedAnalytics: true,
    anatomy3d: true,
  },
};

export const REPLACEMENT_MAP: Record<string, string[]> = {
  'Flat Barbell Bench Press': ['Incline Dumbbell Bench Press', 'Band Chest Press', 'Push-Ups'],
  'Incline Dumbbell Bench Press': ['Flat Barbell Bench Press', 'Band Chest Press', 'Push-Ups'],
  'Wide-Grip Lat Pulldown': ['Bodyweight Pull-Ups', 'Band Lat Pulldown', 'Single-Arm Dumbbell Row'],
  'Bodyweight Pull-Ups': ['Wide-Grip Lat Pulldown', 'Band Lat Pulldown', 'Single-Arm Dumbbell Row'],
  'Barbell Back Squat': ['Dumbbell Bulgarian Split Squat', 'Bodyweight Squat'],
  'Dumbbell Bulgarian Split Squat': ['Barbell Back Squat', 'Bodyweight Squat'],
  'Standing Calf Raise': ['Bodyweight Squat'],
  'Romanian Deadlift': ['Barbell Deadlift'],
};
