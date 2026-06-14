// ForgeFit AI - Workout Planner Engine (v4.3)

import { FitnessGoal, ExperienceLevel, EquipmentType } from '../shared/enums';
import { Exercise } from '../shared/types';

export interface GeneratedWorkoutExercise {
  exerciseId: string;
  name: string;
  muscleGroup: string;
  equipment: string;
  sets: number;
  reps: string;
  restTimeSeconds: number;
  progressiveOverloadNotes: string;
}

export interface GeneratedWorkoutDay {
  dayName: string; // e.g. "Push Day", "Upper Body"
  exercises: GeneratedWorkoutExercise[];
}

export interface GeneratedRoutine {
  splitType: string;
  schedule: GeneratedWorkoutDay[];
}

/**
 * Filter exercises by user equipment configuration.
 */
export const filterExercisesByEquipment = (
  exercises: Exercise[],
  userEquipment: string[]
): Exercise[] => {
  // If user has Full Gym, they can do everything.
  if (userEquipment.includes(EquipmentType.FULL_GYM)) {
    return exercises;
  }

  return exercises.filter((ex) => {
    // If exercise requires bodyweight, it's always allowed.
    if (ex.equipment === 'Bodyweight') return true;

    // Check if user has specific equipment.
    if (ex.equipment === 'Dumbbells' && userEquipment.includes(EquipmentType.DUMBBELLS)) return true;
    if (ex.equipment === 'Bands' && userEquipment.includes(EquipmentType.BANDS)) return true;
    
    // Home Gym covers dumbbells and bands.
    if (userEquipment.includes(EquipmentType.HOME_GYM)) {
      if (ex.equipment === 'Dumbbells' || ex.equipment === 'Bands' || ex.equipment === 'Bodyweight') {
        return true;
      }
    }

    return false;
  });
};

/**
 * Generates an individualized routine based on user criteria.
 */
export const generateWorkoutSplit = (
  allExercises: Exercise[],
  userGoal: string,
  userLevel: string,
  userEquipment: string[],
  splitPreference: string
): GeneratedRoutine => {
  const filtered = filterExercisesByEquipment(allExercises, userEquipment);

  // Fallback exercises in case database seeding is empty
  const chestEx = filtered.find(e => e.muscle_group === 'Chest' || e.muscle_group === 'Upper Chest') || { id: 'ex-bench', name: 'Standard Push-Up', muscle_group: 'Chest', equipment: 'Bodyweight' };
  const backEx = filtered.find(e => e.muscle_group === 'Lats' || e.muscle_group === 'Lower Back') || { id: 'ex-row', name: 'Bodyweight Pull-Up', muscle_group: 'Lats', equipment: 'Bodyweight' };
  const shoulderEx = filtered.find(e => e.muscle_group === 'Front Delts' || e.muscle_group === 'Side Delts') || { id: 'ex-raise', name: 'Dumbbell Lateral Raise', muscle_group: 'Side Delts', equipment: 'Dumbbells' };
  const legEx = filtered.find(e => e.muscle_group === 'Quads' || e.muscle_group === 'Hamstrings') || { id: 'ex-squat', name: 'Bodyweight Squat', muscle_group: 'Quads', equipment: 'Bodyweight' };
  const bicepEx = filtered.find(e => e.muscle_group === 'Biceps') || { id: 'ex-curl', name: 'Barbell Bicep Curl', muscle_group: 'Biceps', equipment: 'Full Gym' };
  const tricepEx = filtered.find(e => e.muscle_group === 'Triceps') || { id: 'ex-push', name: 'Cable Tricep Pushdown', muscle_group: 'Triceps', equipment: 'Full Gym' };
  const absEx = filtered.find(e => e.muscle_group === 'Abs') || { id: 'ex-plank', name: 'Plank', muscle_group: 'Abs', equipment: 'Bodyweight' };

  // Set-Rep configurations based on goals
  let sets = 3;
  let reps = '8-12';
  let restTime = 90;
  let overloadText = 'Focus on concentric speed and adding weight when hitting upper rep limits.';

  if (userGoal === FitnessGoal.GET_STRONGER) {
    sets = 4;
    reps = '4-6';
    restTime = 180;
    overloadText = 'Prioritize recovery. Attempt to add 2.5kg if previous session sets were completed at RPE 8.';
  } else if (userGoal === FitnessGoal.LOSE_FAT) {
    sets = 3;
    reps = '10-15';
    restTime = 60;
    overloadText = 'Keep heart rate elevated. Aim for cumulative volume growth.';
  }

  const routine: GeneratedRoutine = {
    splitType: splitPreference,
    schedule: [],
  };

  const getExerciseStruct = (ex: any, noteOverrides?: string): GeneratedWorkoutExercise => ({
    exerciseId: ex.id,
    name: ex.name,
    muscleGroup: ex.muscle_group,
    equipment: ex.equipment,
    sets,
    reps,
    restTimeSeconds: restTime,
    progressiveOverloadNotes: noteOverrides || overloadText,
  });

  if (splitPreference === 'Push Pull Legs') {
    routine.schedule.push({
      dayName: 'Push Day (Chest, Shoulders, Triceps)',
      exercises: [
        getExerciseStruct(chestEx, 'Primary compound chest driver.'),
        getExerciseStruct(shoulderEx, 'Targets lateral shoulder dimensions.'),
        getExerciseStruct(tricepEx, 'Isolates arm extension.'),
        getExerciseStruct(absEx, 'Core abdominal stabilization.'),
      ],
    });
    routine.schedule.push({
      dayName: 'Pull Day (Back, Rear Delts, Biceps)',
      exercises: [
        getExerciseStruct(backEx, 'Primary compound back loading.'),
        getExerciseStruct(bicepEx, 'Direct elbow flexion volume.'),
        getExerciseStruct(absEx, 'Hold plank with optimal core hollow hold.'),
      ],
    });
    routine.schedule.push({
      dayName: 'Legs Day (Quads, Hamstrings, Calves)',
      exercises: [
        getExerciseStruct(legEx, 'Lower body compound extension.'),
        getExerciseStruct(absEx, 'Core baseline training.'),
      ],
    });
  } else if (splitPreference === 'Upper Lower') {
    routine.schedule.push({
      dayName: 'Upper Body Focus',
      exercises: [
        getExerciseStruct(chestEx),
        getExerciseStruct(backEx),
        getExerciseStruct(shoulderEx),
        getExerciseStruct(bicepEx),
      ],
    });
    routine.schedule.push({
      dayName: 'Lower Body Focus',
      exercises: [
        getExerciseStruct(legEx),
        getExerciseStruct(absEx),
      ],
    });
  } else {
    // Default to Full Body Split
    routine.schedule.push({
      dayName: 'Full Body Routine',
      exercises: [
        getExerciseStruct(legEx, 'Compound leg builder.'),
        getExerciseStruct(chestEx, 'Horizontal press driver.'),
        getExerciseStruct(backEx, 'Vertical pulling movement.'),
        getExerciseStruct(shoulderEx, 'Shoulder overhead stabilizer.'),
        getExerciseStruct(absEx, 'Core brace training.'),
      ],
    });
  }

  return routine;
};
