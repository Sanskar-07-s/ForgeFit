// ForgeFit AI - Streak Calculation Engine (v4.3)

export interface StreakUpdate {
  newStreak: number;
  streakExtended: boolean;
  streakReset: boolean;
  message: string;
}

/**
 * Checks and updates the active user streak based on current date and last activity date.
 * @param lastActivityDate ISO date string (YYYY-MM-DD)
 * @param currentStreak Current active streak number
 * @param currentDateString Optional custom current date (defaults to today)
 */
export const calculateUpdatedStreak = (
  lastActivityDate?: string,
  currentStreak: number = 0,
  currentDateString?: string
): StreakUpdate => {
  const today = currentDateString ? new Date(currentDateString) : new Date();
  today.setHours(0, 0, 0, 0);

  if (!lastActivityDate) {
    return {
      newStreak: 1,
      streakExtended: true,
      streakReset: false,
      message: 'First workout logged! Streak started at 1 day.',
    };
  }

  const lastDate = new Date(lastActivityDate);
  lastDate.setHours(0, 0, 0, 0);

  const diffTime = today.getTime() - lastDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    // Already logged something today, streak remains the same
    return {
      newStreak: currentStreak,
      streakExtended: false,
      streakReset: false,
      message: 'Keep going! You already logged an activity today.',
    };
  } else if (diffDays === 1) {
    // Logged yesterday, extend streak
    const nextStreak = currentStreak + 1;
    return {
      newStreak: nextStreak,
      streakExtended: true,
      streakReset: false,
      message: `Streak extended! You are on a ${nextStreak}-day streak.`,
    };
  } else {
    // Streak broken (more than 1 day missed)
    return {
      newStreak: 1,
      streakExtended: false,
      streakReset: true,
      message: `Streak reset. You missed ${diffDays - 1} days. Let's build it back up!`,
    };
  }
};
