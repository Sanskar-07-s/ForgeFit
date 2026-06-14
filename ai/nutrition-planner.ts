// ForgeFit AI - Nutrition Planner Engine (v4.3)

import { DietaryPreference, FitnessGoal } from '../shared/enums';
import { calculateCaloricAndMacroTargets, CalorieTargets } from '../shared/fitness-models';

export interface MealSuggestion {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: string[];
}

export interface DailyNutritionPlan {
  caloricTargets: CalorieTargets;
  mealSuggestions: {
    breakfast: MealSuggestion;
    lunch: MealSuggestion;
    dinner: MealSuggestion;
    snack: MealSuggestion;
  };
}

/**
 * Returns customized meal templates based on dietary preferences and goal ranges.
 */
export const generateDailyMealPlan = (
  weightKg: number,
  heightCm: number,
  ageYears: number,
  gender: string,
  activity: string,
  goal: string,
  dietaryPreference: string
): DailyNutritionPlan => {
  const caloricTargets = calculateCaloricAndMacroTargets(weightKg, heightCm, ageYears, gender, activity, goal);
  const targetKcal = caloricTargets.target;

  // Fraction values for individual meals
  const bfkKcal = Math.round(targetKcal * 0.25);
  const lunchKcal = Math.round(targetKcal * 0.35);
  const dinnerKcal = Math.round(targetKcal * 0.30);
  const snackKcal = Math.round(targetKcal * 0.10);

  const buildMeal = (name: string, kcal: number, pRatio: number, cRatio: number, fRatio: number, ingredients: string[]): MealSuggestion => {
    const p = Math.round((kcal * pRatio) / 4);
    const c = Math.round((kcal * cRatio) / 4);
    const f = Math.round((kcal * fRatio) / 9);
    return { name, calories: kcal, protein: p, carbs: c, fat: f, ingredients };
  };

  let breakfast: MealSuggestion;
  let lunch: MealSuggestion;
  let dinner: MealSuggestion;
  let snack: MealSuggestion;

  if (dietaryPreference === DietaryPreference.VEGAN) {
    breakfast = buildMeal('Tofu Scramble & Avocado Toast', bfkKcal, 0.25, 0.50, 0.25, [
      '200g Firm Tofu seasoned with Turmeric',
      '2 slices Whole Wheat Sourdough bread',
      '1/2 medium Hass Avocado',
      '1 cup Spinach'
    ]);
    lunch = buildMeal('Tempeh Quinoa Buddha Bowl', lunchKcal, 0.28, 0.47, 0.25, [
      '150g Grilled Tempeh cubes',
      '1 cup Cooked Quinoa',
      '100g Steamed Broccoli',
      '2 tbsp Tahini Lemon Dressing'
    ]);
    dinner = buildMeal('High-Protein Lentil & Chickpea Curry', dinnerKcal, 0.26, 0.52, 0.22, [
      '1 cup Red Lentils (cooked)',
      '1/2 cup Chickpeas',
      '1 cup Coconut milk base',
      '1/2 cup Brown Jasmine Rice'
    ]);
    snack = buildMeal('Peanut Butter & Vegan Protein Shake', snackKcal, 0.40, 0.35, 0.25, [
      '1 scoop Pea Protein isolate',
      '1 tbsp Organic Peanut Butter',
      '250ml Unsweetened Almond Milk'
    ]);
  } else if (dietaryPreference === DietaryPreference.VEGETARIAN) {
    breakfast = buildMeal('Greek Yogurt & Berry Granola bowl', bfkKcal, 0.30, 0.45, 0.25, [
      '250g Non-Fat Greek Yogurt',
      '50g Organic Oats Granola',
      '1/2 cup Fresh Blueberries',
      '1 tbsp Raw Chia Seeds'
    ]);
    lunch = buildMeal('Paneer / Halloumi Quinoa Salad', lunchKcal, 0.28, 0.42, 0.30, [
      '120g Light Grilled Paneer cheese',
      '1 cup Tricolor Quinoa',
      'Mixed Green Bell Peppers',
      '1 tbsp Olive Oil dressing'
    ]);
    dinner = buildMeal('Black Bean & Cottage Cheese Wrap', dinnerKcal, 0.25, 0.50, 0.25, [
      '2 High-Fiber Tortillas',
      '1/2 cup Black Beans',
      '100g Low-Fat Cottage Cheese',
      'Salsa and Cilantro'
    ]);
    snack = buildMeal('Boiled Eggs & Almonds', snackKcal, 0.35, 0.15, 0.50, [
      '2 Large Hard-Boiled Eggs',
      '15 Whole Raw Almonds'
    ]);
  } else {
    // Non-Vegetarian
    breakfast = buildMeal('Oatmeal with Egg White Omelet', bfkKcal, 0.32, 0.48, 0.20, [
      '3 Egg Whites + 1 Whole Egg',
      '60g Rolled Oats cooked in water',
      '1 tbsp Honey',
      '1 scoop Whey Protein stirred into oats'
    ]);
    lunch = buildMeal('Grilled Chicken & Brown Rice Bowl', lunchKcal, 0.40, 0.40, 0.20, [
      '180g Skinless Grilled Chicken Breast',
      '1.5 cups Cooked Brown Rice',
      '150g Sauteed Asparagus',
      '1 tbsp Sesame Seeds'
    ]);
    dinner = buildMeal('Baked Salmon & Sweet Potato Mash', dinnerKcal, 0.30, 0.40, 0.30, [
      '150g Wild-Caught Salmon fillet',
      '200g Baked Sweet Potato',
      '100g Roasted Brussels Sprouts',
      '1 tsp Lemon Garlic butter'
    ]);
    snack = buildMeal('Whey Protein & Rice Cakes', snackKcal, 0.55, 0.35, 0.10, [
      '1.5 scoops Whey Protein Isolate',
      '3 Brown Rice Cakes',
      '100g Strawberries'
    ]);
  }

  return {
    caloricTargets,
    mealSuggestions: {
      breakfast,
      lunch,
      dinner,
      snack,
    },
  };
};
