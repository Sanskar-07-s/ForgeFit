// ForgeFit AI - Exercise Recommender & Replacement Engine (v4.3)

import { REPLACEMENT_MAP } from '../shared/constants';
import { Exercise } from '../shared/types';
import { filterExercisesByEquipment } from './workout-planner';

export interface ExerciseSubstitution {
  targetExerciseId: string;
  replacementExercises: Exercise[];
}

/**
 * Recommends alternative exercises based on equipment boundaries and targeted muscle groups.
 */
export const getExerciseReplacements = (
  exerciseName: string,
  allExercises: Exercise[],
  userEquipment: string[]
): Exercise[] => {
  // Get possible replacement names from the mapped constants
  const alternativeNames = REPLACEMENT_MAP[exerciseName] || [];
  
  // Filter all database exercises matching those names and matching user equipment
  const matchingAlternatives = allExercises.filter(ex => 
    alternativeNames.includes(ex.name)
  );

  const equipmentFiltered = filterExercisesByEquipment(matchingAlternatives, userEquipment);

  if (equipmentFiltered.length > 0) {
    return equipmentFiltered;
  }

  // Fallback: If no direct matches in the map, find exercises targeting the exact same muscle group and compatible with equipment
  const sourceExercise = allExercises.find(ex => ex.name === exerciseName);
  if (!sourceExercise) return [];

  const muscleGroupMatches = allExercises.filter(ex => 
    ex.name !== exerciseName &&
    ex.muscle_group === sourceExercise.muscle_group
  );

  return filterExercisesByEquipment(muscleGroupMatches, userEquipment);
};
