// ForgeFit AI - Fitness Readiness Score Engine (v4.3)

import { ReadinessStatus } from '../shared/enums';

export interface ReadinessReport {
  score: number; // 0-100
  status: ReadinessStatus;
  color: string; // Tailwind color class matching state
  description: string;
}

/**
 * Computes a combined fitness readiness score.
 */
export const calculateReadinessScore = (
  sleepHours: number,
  recoveryPct: number,
  sorenessScore: number, // 1 to 10
  consecutiveDays: number,
  workoutVolume: number = 0
): ReadinessReport => {
  // We weight:
  // Recovery Percentage: 45%
  // Sleep Hours: 25%
  // Soreness (reversed): 20%
  // Consecutive Days penalty: 10%

  const sleepWeight = Math.min((sleepHours / 8) * 100, 100) * 0.25;
  const recoveryWeight = recoveryPct * 0.45;
  
  const reversedSoreness = 10 - sorenessScore;
  const sorenessWeight = (reversedSoreness / 9) * 100 * 0.20;

  // Consecutive days penalty: 0 days = 100, 1 day = 90, 2 days = 70, 3+ days = 40
  let consecutiveWeightVal = 100;
  if (consecutiveDays === 1) consecutiveWeightVal = 90;
  else if (consecutiveDays === 2) consecutiveWeightVal = 70;
  else if (consecutiveDays >= 3) consecutiveWeightVal = 30;
  const frequencyWeight = consecutiveWeightVal * 0.10;

  // Add volume penalty if volume is extremely high
  let volumePenalty = 0;
  if (workoutVolume > 12000) volumePenalty = 8;
  else if (workoutVolume > 8000) volumePenalty = 4;

  const score = Math.max(
    Math.min(
      Math.round(sleepWeight + recoveryWeight + sorenessWeight + frequencyWeight - volumePenalty),
      100
    ),
    0
  );

  let status: ReadinessStatus = ReadinessStatus.MODERATE;
  let color = 'text-cyan-400 border-cyan-500/30 bg-cyan-950/20';
  let description = '';

  if (score >= 85) {
    status = ReadinessStatus.EXCELLENT;
    color = 'text-emerald-400 border-emerald-500/30 bg-emerald-950/20';
    description = 'Primed for high performance. Your body is ready for maximum workload.';
  } else if (score >= 65) {
    status = ReadinessStatus.GOOD;
    color = 'text-blue-400 border-blue-500/30 bg-blue-950/20';
    description = 'Solid readiness. You can perform standard routines without restrictions.';
  } else if (score >= 45) {
    status = ReadinessStatus.MODERATE;
    color = 'text-purple-400 border-purple-500/30 bg-purple-950/20';
    description = 'Moderate fatigue. Consider reducing compound set volume or focusing on technique.';
  } else {
    status = ReadinessStatus.POOR;
    color = 'text-red-400 border-red-500/30 bg-red-950/20';
    description = 'High fatigue index. Focus on sleep, light mobility, and active stretching.';
  }

  return {
    score,
    status,
    color,
    description,
  };
};
