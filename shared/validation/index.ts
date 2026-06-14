// ForgeFit AI - Shared Validation System (v4.3)

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export const validateProfile = (data: Record<string, any>): ValidationResult => {
  const errors: Record<string, string> = {};

  if (!data.name || typeof data.name !== 'string' || data.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters long.';
  }

  const age = Number(data.age);
  if (isNaN(age) || age < 13 || age > 120) {
    errors.age = 'Age must be between 13 and 120.';
  }

  const height = Number(data.height);
  if (isNaN(height) || height < 100 || height > 250) {
    errors.height = 'Height must be between 100 and 250 cm.';
  }

  const weight = Number(data.weight);
  if (isNaN(weight) || weight < 30 || weight > 250) {
    errors.weight = 'Weight must be between 30 and 250 kg.';
  }

  if (!data.goal) {
    errors.goal = 'Please select a fitness goal.';
  }

  if (!data.activity_level) {
    errors.activity_level = 'Please select your activity level.';
  }

  if (!data.experience_level) {
    errors.experience_level = 'Please select your experience level.';
  }

  const trainingDays = Number(data.training_days);
  if (isNaN(trainingDays) || trainingDays < 1 || trainingDays > 7) {
    errors.training_days = 'Training days must be between 1 and 7 days per week.';
  }

  if (!Array.isArray(data.available_equipment) || data.available_equipment.length === 0) {
    errors.available_equipment = 'Please select at least one available equipment.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validateNutritionLog = (data: Record<string, any>): ValidationResult => {
  const errors: Record<string, string> = {};

  const calories = Number(data.calories);
  if (isNaN(calories) || calories < 0 || calories > 10000) {
    errors.calories = 'Calories must be between 0 and 10,000 kcal.';
  }

  const protein = Number(data.protein);
  if (isNaN(protein) || protein < 0 || protein > 1000) {
    errors.protein = 'Protein must be between 0 and 1,000g.';
  }

  const carbs = Number(data.carbs);
  if (isNaN(carbs) || carbs < 0 || carbs > 1000) {
    errors.carbs = 'Carbohydrates must be between 0 and 1,000g.';
  }

  const fat = Number(data.fat);
  if (isNaN(fat) || fat < 0 || fat > 500) {
    errors.fat = 'Fat must be between 0 and 500g.';
  }

  const water = Number(data.water_ml);
  if (isNaN(water) || water < 0 || water > 20000) {
    errors.water_ml = 'Water intake must be between 0 and 20,000 ml.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validateWorkoutSet = (data: Record<string, any>): ValidationResult => {
  const errors: Record<string, string> = {};

  const reps = Number(data.reps);
  if (isNaN(reps) || reps < 0 || reps > 200) {
    errors.reps = 'Reps must be a positive integer.';
  }

  const weight = Number(data.weight);
  if (isNaN(weight) || weight < 0 || weight > 1000) {
    errors.weight = 'Weight must be a positive number.';
  }

  if (data.rpe !== undefined && data.rpe !== null) {
    const rpe = Number(data.rpe);
    if (isNaN(rpe) || rpe < 1 || rpe > 10) {
      errors.rpe = 'RPE must be between 1 and 10.';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
