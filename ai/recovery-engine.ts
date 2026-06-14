// ForgeFit AI - Recovery Engine (v4.3)

export interface RecoveryReport {
  recoveryPercentage: number; // 0-100
  intensitySuggestion: 'High (Go Heavy)' | 'Moderate (Focus Form)' | 'Active Recovery' | 'Rest Day (Absolute)';
  suggestedRestDay: boolean;
  explanation: string;
}

/**
 * Calculates recovery metrics based on sleep, volume load, and soreness.
 */
export const calculateRecoveryReport = (
  sleepHours: number,
  sorenessScore: number, // 1 to 10 (10 being extremely sore)
  consecutiveDays: number,
  workoutVolume: number = 0,
  workoutDurationMin: number = 0
): RecoveryReport => {
  // Baseline recovery starting at 100%
  let score = 100;

  // 1. Sleep Deductions
  if (sleepHours < 7) {
    // Deduct 10% per hour short of 8 hours
    const debt = 8 - sleepHours;
    score -= debt * 12;
  } else if (sleepHours > 8.5) {
    score += 5; // slight surplus for optimal sleep
  }

  // 2. Soreness Deductions
  // Soreness of 1-3 is fine. 4-6 deducts moderate. 7-10 deducts heavily.
  if (sorenessScore > 3) {
    score -= (sorenessScore - 3) * 8;
  }

  // 3. Consecutive Training Days Deductions
  if (consecutiveDays >= 3) {
    score -= (consecutiveDays - 2) * 15;
  }

  // 4. Heavy Session Deductions
  if (workoutVolume > 8000 || workoutDurationMin > 75) {
    score -= 10;
  }

  // Clamping score between 0 and 100
  const recoveryPercentage = Math.max(Math.min(Math.round(score), 100), 0);

  // Determine intensity suggestions
  let intensitySuggestion: RecoveryReport['intensitySuggestion'] = 'High (Go Heavy)';
  let suggestedRestDay = false;
  let explanation = '';

  if (recoveryPercentage >= 85) {
    intensitySuggestion = 'High (Go Heavy)';
    explanation = 'Your body is fully primed for high intensity. Excellent time to attempt PRs or compound progressive loading.';
  } else if (recoveryPercentage >= 65) {
    intensitySuggestion = 'Moderate (Focus Form)';
    explanation = 'Good state. Support your muscles by focusing on contraction speed and strict form rather than pushing maximum weights.';
  } else if (recoveryPercentage >= 40) {
    intensitySuggestion = 'Active Recovery';
    explanation = 'Elevated central fatigue. Focus on light cardio, stretching, or mobility exercises to promote blood circulation.';
    suggestedRestDay = consecutiveDays >= 2;
  } else {
    intensitySuggestion = 'Rest Day (Absolute)';
    suggestedRestDay = true;
    explanation = 'Overtraining signals detected. Absolute rest, hydration, and 8+ hours of sleep are highly recommended to prevent injury.';
  }

  return {
    recoveryPercentage,
    intensitySuggestion,
    suggestedRestDay,
    explanation,
  };
};
