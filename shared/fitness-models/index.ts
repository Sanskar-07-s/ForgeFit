// ForgeFit AI - Shared Fitness Models and Wearable Adapters (v4.3)

import { ActivityLevel, FitnessGoal, Gender } from '../enums';
import { DEFAULT_NUTRITION_RATIOS, PROTEIN_BASE_G_PER_KG } from '../constants';

/**
 * Calculates Body Mass Index (BMI).
 * @param weightKg Weight in Kilograms
 * @param heightCm Height in Centimeters
 */
export const calculateBMI = (weightKg: number, heightCm: number): number => {
  if (heightCm <= 0) return 0;
  const heightM = heightCm / 100;
  return Number((weightKg / (heightM * heightM)).toFixed(1));
};

/**
 * Calculates Basal Metabolic Rate (BMR) using Mifflin-St Jeor equation.
 */
export const calculateBMR = (
  weightKg: number,
  heightCm: number,
  ageYears: number,
  gender: string
): number => {
  let bmr = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
  if (gender === Gender.MALE) {
    bmr += 5;
  } else {
    bmr -= 161;
  }
  return Math.round(bmr);
};

/**
 * Maps Activity Levels to physical activity multipliers.
 */
export const getActivityMultiplier = (level: string): number => {
  switch (level) {
    case ActivityLevel.SEDENTARY:
      return 1.2;
    case ActivityLevel.LIGHTLY_ACTIVE:
      return 1.375;
    case ActivityLevel.MODERATELY_ACTIVE:
      return 1.55;
    case ActivityLevel.VERY_ACTIVE:
      return 1.725;
    case ActivityLevel.EXTRA_ACTIVE:
      return 1.9;
    default:
      return 1.2;
  }
};

/**
 * Calculates Total Daily Energy Expenditure (TDEE).
 */
export const calculateTDEE = (
  weightKg: number,
  heightCm: number,
  ageYears: number,
  gender: string,
  activity: string
): number => {
  const bmr = calculateBMR(weightKg, heightCm, ageYears, gender);
  const multiplier = getActivityMultiplier(activity);
  return Math.round(bmr * multiplier);
};

export interface CalorieTargets {
  maintenance: number;
  bulk: number;
  cut: number;
  target: number;
  macros: {
    proteinG: number;
    carbsG: number;
    fatG: number;
  };
}

/**
 * Calculates daily caloric target and macronutrient splits based on goals.
 */
export const calculateCaloricAndMacroTargets = (
  weightKg: number,
  heightCm: number,
  ageYears: number,
  gender: string,
  activity: string,
  goal: string
): CalorieTargets => {
  const tdee = calculateTDEE(weightKg, heightCm, ageYears, gender, activity);
  const maintenance = tdee;
  const bulk = tdee + 400; // standard bulk surplus
  const cut = Math.max(tdee - 500, 1200); // safety cap at 1200 kcal

  let target = maintenance;
  if (goal === FitnessGoal.BUILD_MUSCLE || goal === FitnessGoal.GET_STRONGER) {
    target = bulk;
  } else if (goal === FitnessGoal.LOSE_FAT) {
    target = cut;
  } else if (goal === FitnessGoal.RECOMPOSITION) {
    target = Math.round(tdee - 100);
  }

  // Retrieve macros percentages
  const ratios = DEFAULT_NUTRITION_RATIOS[goal as FitnessGoal] || { carbs: 45, protein: 30, fat: 25 };

  // Calculate Protein based on weight (standard sports nutrition threshold)
  const proteinMultiplier = PROTEIN_BASE_G_PER_KG[goal as FitnessGoal] || 1.8;
  const proteinG = Math.round(weightKg * proteinMultiplier);
  const proteinKcal = proteinG * 4;

  // Distribute remaining calories to fats and carbs based on ratio percentages
  const remainingKcal = target - proteinKcal;
  const fatRatioFraction = ratios.fat / (ratios.fat + ratios.carbs);
  
  const fatKcal = remainingKcal * fatRatioFraction;
  const fatG = Math.round(Math.max(fatKcal / 9, 30)); // at least 30g fat for hormone health
  
  const carbsKcal = remainingKcal - (fatG * 9);
  const carbsG = Math.round(Math.max(carbsKcal / 4, 50));

  return {
    maintenance,
    bulk,
    cut,
    target,
    macros: {
      proteinG,
      carbsG,
      fatG,
    },
  };
};

// ============================================================================
// Future Wearable Integration Adapters (Stubs & Interfaces)
// ============================================================================

export interface WearableDataPayload {
  stepsCount?: number;
  caloriesBurned?: number;
  activeMinutes?: number;
  heartRateAverage?: number;
  sleepMinutes?: number;
  timestamp: string;
  source: 'google_fit' | 'apple_health' | 'garmin' | 'fitbit' | 'wearos';
}

export interface IWearableAdapter {
  isAvailable(): Promise<boolean>;
  requestPermission(): Promise<boolean>;
  fetchDailySummary(dateString: string): Promise<WearableDataPayload>;
}

export class GoogleFitAdapter implements IWearableAdapter {
  async isAvailable() { return true; }
  async requestPermission() { return true; }
  async fetchDailySummary(dateString: string): Promise<WearableDataPayload> {
    return {
      stepsCount: 8500,
      caloriesBurned: 450,
      activeMinutes: 45,
      heartRateAverage: 72,
      sleepMinutes: 420,
      timestamp: dateString,
      source: 'google_fit'
    };
  }
}

export class AppleHealthAdapter implements IWearableAdapter {
  async isAvailable() { return true; }
  async requestPermission() { return true; }
  async fetchDailySummary(dateString: string): Promise<WearableDataPayload> {
    return {
      stepsCount: 9200,
      caloriesBurned: 510,
      activeMinutes: 60,
      heartRateAverage: 75,
      sleepMinutes: 460,
      timestamp: dateString,
      source: 'apple_health'
    };
  }
}

export class GarminAdapter implements IWearableAdapter {
  async isAvailable() { return true; }
  async requestPermission() { return true; }
  async fetchDailySummary(dateString: string): Promise<WearableDataPayload> {
    return {
      stepsCount: 11000,
      caloriesBurned: 620,
      activeMinutes: 75,
      heartRateAverage: 65,
      sleepMinutes: 480,
      timestamp: dateString,
      source: 'garmin'
    };
  }
}

export class FitbitAdapter implements IWearableAdapter {
  async isAvailable() { return true; }
  async requestPermission() { return true; }
  async fetchDailySummary(dateString: string): Promise<WearableDataPayload> {
    return {
      stepsCount: 8800,
      caloriesBurned: 380,
      activeMinutes: 40,
      heartRateAverage: 70,
      sleepMinutes: 400,
      timestamp: dateString,
      source: 'fitbit'
    };
  }
}

export class WearOsAdapter implements IWearableAdapter {
  async isAvailable() { return true; }
  async requestPermission() { return true; }
  async fetchDailySummary(dateString: string): Promise<WearableDataPayload> {
    return {
      stepsCount: 7500,
      caloriesBurned: 320,
      activeMinutes: 30,
      heartRateAverage: 73,
      sleepMinutes: 410,
      timestamp: dateString,
      source: 'wearos'
    };
  }
}
