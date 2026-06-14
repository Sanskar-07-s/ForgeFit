// ForgeFit AI - Goal Progress Tracking Engine (v4.3)

import { Profile, Measurement, WorkoutLogSet } from '../shared/types';
import { FitnessGoal } from '../shared/enums';
import { calculate1RM } from './analytics-engine';

export interface GoalProgressReport {
  currentStatus: string;
  progressPct: number; // 0-100
  targetValue: string;
  currentValue: string;
  milestonesReached: string[];
}

/**
 * Calculates current progress towards user goals based on measurements and log histories.
 */
export const calculateGoalProgress = (
  profile: Profile,
  measurements: Measurement[],
  logSets: WorkoutLogSet[]
): GoalProgressReport => {
  const goal = profile.goal;
  
  if (measurements.length === 0) {
    return {
      currentStatus: 'Awaiting first measurement entry to begin tracking.',
      progressPct: 0,
      targetValue: 'N/A',
      currentValue: 'N/A',
      milestonesReached: [],
    };
  }

  // Sort measurements by date
  const sorted = [...measurements].sort(
    (a, b) => new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime()
  );

  const initial = sorted[0];
  const latest = sorted[sorted.length - 1];

  const initialWeight = initial.weight || profile.weight;
  const latestWeight = latest.weight || profile.weight;

  let progressPct = 0;
  let currentStatus = 'Consistency is key. Keep logging metrics to track trends.';
  let targetValue = '';
  let currentValue = '';
  const milestonesReached: string[] = [];

  if (goal === FitnessGoal.LOSE_FAT) {
    // Goal: lose 5% to 10% weight safely
    const targetLoss = initialWeight * 0.08;
    const actualLoss = initialWeight - latestWeight;
    targetValue = `-${targetLoss.toFixed(1)} kg`;
    currentValue = `${actualLoss > 0 ? '-' : '+'}${Math.abs(actualLoss).toFixed(1)} kg`;

    progressPct = targetLoss > 0 ? Math.max(Math.min(Math.round((actualLoss / targetLoss) * 100), 100), 0) : 0;
    
    if (actualLoss >= targetLoss) {
      currentStatus = 'Goal Achieved! You met your target fat-loss envelope.';
      milestonesReached.push('8% Weight Loss Target Achieved');
    } else if (actualLoss > 0) {
      currentStatus = 'Weight is trending downward. You are on track!';
      milestonesReached.push('Fat-Loss Journey Commenced');
    }
  } else if (goal === FitnessGoal.BUILD_MUSCLE) {
    // Goal: Increase waist-to-shoulder ratio or chest measurements
    const initialChest = initial.chest || 90;
    const latestChest = latest.chest || 90;
    const actualGain = latestChest - initialChest;
    targetValue = '+2.0 cm (Chest)';
    currentValue = `${actualGain >= 0 ? '+' : ''}${actualGain.toFixed(1)} cm`;

    progressPct = Math.max(Math.min(Math.round((actualGain / 2.0) * 100), 100), 0);

    if (actualGain >= 2.0) {
      currentStatus = 'Excellent upper body hypertrophy progress!';
      milestonesReached.push('Chest size +2cm reached');
    } else if (actualGain > 0) {
      currentStatus = 'Hypertrophy indicator is positive.';
      milestonesReached.push('Initial upper back mass gains detected');
    }
  } else if (goal === FitnessGoal.GET_STRONGER) {
    // Goal: Increase 1RM estimates on compound exercises (we look at max weight recorded in logSets)
    const weights = logSets.filter(s => s.completed).map(s => calculate1RM(s.weight, s.reps));
    const maxEst1RM = weights.length > 0 ? Math.max(...weights) : 0;

    targetValue = '+15% 1RM Increase';
    // Assume baseline is average of first few sets
    const baseline = weights.length > 0 ? weights[0] : 0;
    const liftDiff = maxEst1RM - baseline;

    const liftPctGain = baseline > 0 ? (liftDiff / baseline) * 100 : 0;
    progressPct = Math.max(Math.min(Math.round((liftPctGain / 15) * 100), 100), 0);
    
    currentValue = `+${liftPctGain.toFixed(1)}% 1RM`;

    if (liftPctGain >= 15) {
      currentStatus = 'Maximum strength goals completed successfully!';
      milestonesReached.push('15% Strength Increase unlocked');
    } else if (liftPctGain > 0) {
      currentStatus = 'Power capacities are climbing steadily.';
    }
  } else {
    // General fitness (log-based consistency)
    progressPct = Math.min(Math.round((sorted.length / 10) * 100), 100);
    targetValue = '10 Log entries';
    currentValue = `${sorted.length} entries`;
    
    if (sorted.length >= 10) {
      currentStatus = 'Active logging status maintained.';
      milestonesReached.push('Consistent Metric Logger');
    }
  }

  return {
    currentStatus,
    progressPct,
    targetValue,
    currentValue,
    milestonesReached,
  };
};
