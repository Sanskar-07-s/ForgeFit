// ForgeFit AI - Real-Time Fitness Readiness Score Engine (v5.0)

export interface RealtimeReadiness {
  readinessScore: number;
  recommendation: string;
  workoutAdjustment: string;
}

/**
 * Calculates real-time readiness combining sleep, recovery, fatigue, workout history, and heart rate.
 */
export const calculateRealtimeReadiness = (
  sleepHours: number,
  recoveryPct: number,       // 0 - 100
  fatigueScore: number,      // 1 - 10 (1 = fresh, 10 = exhausted)
  consecutiveDays: number,   // 0+ days
  heartRate: number          // current/resting bpm
): RealtimeReadiness => {
  // 1. Sleep Score (out of 100)
  const sleepScore = Math.min((sleepHours / 8) * 100, 100);

  // 2. Fatigue Score reversed (out of 100)
  const freshnessScore = Math.max(0, 100 - (fatigueScore * 10));

  // 3. Heart Rate Score
  // Baseline is 60-70 bpm. If heart rate is elevated (e.g. > 75), it indicates stress/fatigue.
  // If extremely low or high, penalize.
  let hrScore = 100;
  if (heartRate > 85) {
    hrScore = Math.max(30, 100 - (heartRate - 85) * 3);
  } else if (heartRate < 50) {
    hrScore = Math.max(50, 100 - (50 - heartRate) * 2);
  }

  // 4. Workout History Penalty
  // consecutiveDays = 0: 0 penalty, 1 day: -5, 2 days: -15, 3+ days: -35
  let historyPenalty = 0;
  if (consecutiveDays === 1) historyPenalty = 5;
  else if (consecutiveDays === 2) historyPenalty = 15;
  else if (consecutiveDays >= 3) historyPenalty = 35;

  // Weighted formula:
  // Recovery: 35%
  // Sleep: 25%
  // Freshness (Fatigue): 25%
  // Heart Rate: 15%
  const baseScore = (recoveryPct * 0.35) + (sleepScore * 0.25) + (freshnessScore * 0.25) + (hrScore * 0.15);
  const readinessScore = Math.max(0, Math.min(100, Math.round(baseScore - historyPenalty)));

  // Generate recommendation & adjustment
  let recommendation = '';
  let workoutAdjustment = '';

  if (readinessScore >= 85) {
    recommendation = 'Excellent recovery. Your nervous system is primed for peak performance.';
    workoutAdjustment = 'Train normally. Push for a PR or add 5% weight to your main lifts.';
  } else if (readinessScore >= 65) {
    recommendation = 'Solid recovery. Good energy levels.';
    workoutAdjustment = 'Train normally. Maintain target volume and intensity.';
  } else if (readinessScore >= 45) {
    recommendation = 'Moderate recovery. Accumulated fatigue detected.';
    workoutAdjustment = 'Reduce volume by 15-20%. Avoid failure sets.';
  } else {
    recommendation = 'Recovery low. High stress markers & fatigue index detected.';
    workoutAdjustment = 'Deload session. Reduce weight by 30% or focus entirely on active mobility/stretching.';
  }

  return {
    readinessScore,
    recommendation,
    workoutAdjustment
  };
};
