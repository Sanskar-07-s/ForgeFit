// ForgeFit AI - Progressive Overload Engine (v4.3)

import { WorkoutLogSet } from '../shared/types';

export interface ProgressionRecommendation {
  type: 'WEIGHT' | 'REPS' | 'SETS' | 'MAINTAIN' | 'DELOAD';
  value: string;
  explanation: string;
}

/**
 * Analyzes previous exercise sets to determine progressive overload steps.
 */
export const calculateProgressiveOverload = (
  previousSets: WorkoutLogSet[],
  targetReps: string = '8-12'
): ProgressionRecommendation => {
  if (!previousSets || previousSets.length === 0) {
    return {
      type: 'MAINTAIN',
      value: 'No change',
      explanation: 'Establish a baseline during this workout session.',
    };
  }

  // Parse rep boundaries
  const repLimits = targetReps.split('-').map(Number);
  const minReps = repLimits[0] || 8;
  const maxReps = repLimits[1] || minReps;

  const completedSets = previousSets.filter(s => s.completed);
  if (completedSets.length === 0) {
    return {
      type: 'MAINTAIN',
      value: 'No change',
      explanation: 'Log at least one completed set to evaluate progress.',
    };
  }

  // Check if all sets hit the maximum target rep boundary
  const allMaxedOut = completedSets.every(s => s.reps >= maxReps);
  
  // Calculate average RPE
  const rpes = completedSets.map(s => s.rpe || 8);
  const avgRpe = rpes.reduce((a, b) => a + b, 0) / rpes.length;

  // Deload condition: consistent high RPE (e.g. 9.5-10) with failure to hit reps
  const tooFatigued = avgRpe >= 9.5 && completedSets.some(s => s.reps < minReps);

  if (tooFatigued) {
    return {
      type: 'DELOAD',
      value: '-10% to -20% weight',
      explanation: 'Average RPE is extremely high while failing target rep limits. Lower the weight to reduce central nervous fatigue.',
    };
  }

  if (allMaxedOut) {
    // If user hit the max target reps across all sets, increase weight
    if (avgRpe <= 8.5) {
      return {
        type: 'WEIGHT',
        value: '+2.5 kg',
        explanation: 'All sets hit the rep target limit with manageable difficulty (RPE <= 8.5). Increase resistance by 2.5 kg.',
      };
    } else {
      // Slower weight increase recommendation
      return {
        type: 'WEIGHT',
        value: '+1.0 kg',
        explanation: 'All sets hit the rep targets, but RPE was high. Make a minor 1 kg adjustment or focus on execution speed.',
      };
    }
  }

  // If user hasn't maxed out reps yet, recommend increasing reps or sets
  const lowestRepsSet = [...completedSets].sort((a, b) => a.reps - b.reps)[0];
  if (lowestRepsSet.reps < minReps) {
    return {
      type: 'REPS',
      value: `Aim for ${minReps} reps`,
      explanation: 'Some sets fell below the target rep boundaries. Focus on reaching the minimum rep target before increasing load.',
    };
  }

  // If they are in the range but not maxed out
  return {
    type: 'REPS',
    value: '+1 rep',
    explanation: 'You are within the target rep range. Attempt to add 1 additional repetition to your first or second set.',
  };
};
