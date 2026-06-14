// ForgeFit AI - Central Recommendation Engine (v4.3)

import { Profile, Exercise } from '../shared/types';
import { calculateRecoveryReport } from './recovery-engine';
import { calculateCaloricAndMacroTargets } from '../shared/fitness-models';
import { getExerciseReplacements } from './exercise-recommender';

export interface UnifiedRecommendation {
  workoutSuggestion: {
    shouldTrain: boolean;
    recommendedSplit: string;
    focusAreas: string[];
    alternativeExercises: { original: string; substitutes: string[] }[];
  };
  nutritionSuggestion: {
    calorieTarget: number;
    macroTargetG: { protein: number; carbs: number; fat: number };
    hydrationTargetMl: number;
    focusMacro: string;
  };
  recoverySuggestion: {
    readinessRating: string;
    activityTip: string;
    recommendedSleepMin: number;
  };
}

/**
 * Generates unified daily recommendations by pooling user profile, logs, and recovery states.
 */
export const generateCentralRecommendations = (
  profile: Profile,
  allExercises: Exercise[],
  recentSoreness: number = 3,
  yesterdaySleep: number = 8,
  recentConsecDays: number = 0,
  completedWorkoutName: string = ''
): UnifiedRecommendation => {
  // 1. Recovery analysis
  const recoveryReport = calculateRecoveryReport(yesterdaySleep, recentSoreness, recentConsecDays);
  
  // 2. Nutrition calculations
  const nutritionTargets = calculateCaloricAndMacroTargets(
    profile.weight,
    profile.height,
    profile.age,
    profile.gender,
    profile.activity_level,
    profile.goal
  );

  // 3. Workout details
  const shouldTrain = !recoveryReport.suggestedRestDay;
  let recommendedSplit = profile.training_days >= 4 ? 'Push Pull Legs' : 'Full Body';
  
  if (recoveryReport.intensitySuggestion === 'Active Recovery') {
    recommendedSplit = 'Mobility & Conditioning';
  } else if (recoveryReport.intensitySuggestion === 'Rest Day (Absolute)') {
    recommendedSplit = 'Rest and Stretch';
  }

  // 4. Generate substitution recommendations if they completed a workout
  const alternatives: UnifiedRecommendation['workoutSuggestion']['alternativeExercises'] = [];
  if (completedWorkoutName) {
    const replacements = getExerciseReplacements(completedWorkoutName, allExercises, profile.available_equipment);
    if (replacements.length > 0) {
      alternatives.push({
        original: completedWorkoutName,
        substitutes: replacements.map(r => r.name),
      });
    }
  }

  // Determine focus macro
  let focusMacro = 'protein';
  if (profile.goal === 'Lose Fat') {
    focusMacro = 'protein'; // preserve lean mass
  } else if (profile.goal === 'Get Stronger' || profile.goal === 'Athletic Performance') {
    focusMacro = 'carbs'; // glycogen store loading
  }

  return {
    workoutSuggestion: {
      shouldTrain,
      recommendedSplit,
      focusAreas: shouldTrain ? ['Quads', 'Lats', 'Chest'] : ['Hamstrings stretching', 'Shoulder mobility'],
      alternativeExercises: alternatives,
    },
    nutritionSuggestion: {
      calorieTarget: nutritionTargets.target,
      macroTargetG: {
        protein: nutritionTargets.macros.proteinG,
        carbs: nutritionTargets.macros.carbsG,
        fat: nutritionTargets.macros.fatG,
      },
      hydrationTargetMl: Math.round(profile.weight * 35),
      focusMacro,
    },
    recoverySuggestion: {
      readinessRating: recoveryReport.intensitySuggestion,
      activityTip: recoveryReport.explanation,
      recommendedSleepMin: yesterdaySleep < 7.5 ? 510 : 480, // 8.5 vs 8 hours
    },
  };
};
