// ForgeFit AI - Supplement Consistency Engine (v4.3)

import { SupplementLog } from '../shared/types';

export interface SupplementReport {
  dailyStatus: {
    creatineTaken: boolean;
    wheyTaken: boolean;
  };
  weeklyConsistencyPct: number; // 0-100
  monthlyConsistencyPct: number; // 0-100
  creatineStreakDays: number;
  unlockedBadgeCodes: string[];
}

/**
 * Evaluates supplement intake logs to calculate streaks and compliance statistics.
 */
export const calculateSupplementConsistency = (
  supplementLogs: SupplementLog[],
  targetDaysCount: number = 30
): SupplementReport => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  // Check today's logs
  const todayStr = now.toISOString().split('T')[0];
  const todayLogs = supplementLogs.filter(
    (l) => new Date(l.logged_at).toISOString().split('T')[0] === todayStr
  );

  const creatineTakenToday = todayLogs.some(l => l.creatine_g > 0);
  const wheyTakenToday = todayLogs.some(l => l.whey_protein_g > 0);

  // 1. Weekly Consistency (past 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(now.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const weeklyLogs = supplementLogs.filter(
    (l) => new Date(l.logged_at).getTime() >= sevenDaysAgo.getTime()
  );

  // Get unique days logged in the past week
  const uniqueWeeklyDays = new Set(
    weeklyLogs.map(l => new Date(l.logged_at).toISOString().split('T')[0])
  );
  const weeklyConsistencyPct = Math.round((uniqueWeeklyDays.size / 7) * 100);

  // 2. Monthly Consistency (past 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(now.getDate() - 30);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const monthlyLogs = supplementLogs.filter(
    (l) => new Date(l.logged_at).getTime() >= thirtyDaysAgo.getTime()
  );

  const uniqueMonthlyDays = new Set(
    monthlyLogs.map(l => new Date(l.logged_at).toISOString().split('T')[0])
  );
  const monthlyConsistencyPct = Math.round((uniqueMonthlyDays.size / 30) * 100);

  // 3. Creatine Streak (consecutive days of taking creatine, counting backwards)
  let creatineStreakDays = 0;
  let checkDate = new Date(now);
  
  // Sort logs by date descending
  const sortedLogs = [...supplementLogs]
    .filter(l => l.creatine_g > 0)
    .sort((a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime());

  // Create set of unique date strings where creatine was taken
  const creatineDates = new Set(
    sortedLogs.map(l => new Date(l.logged_at).toISOString().split('T')[0])
  );

  // Check if today was taken. If not, check if yesterday was taken to allow continuing yesterday's streak.
  const todayStrCheck = checkDate.toISOString().split('T')[0];
  let hasTakenToday = creatineDates.has(todayStrCheck);
  
  if (!hasTakenToday) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (true) {
    const checkStr = checkDate.toISOString().split('T')[0];
    if (creatineDates.has(checkStr)) {
      creatineStreakDays += 1;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  // 4. Badge checks
  const unlockedBadgeCodes: string[] = [];
  if (creatineStreakDays >= 7) {
    unlockedBadgeCodes.push('FIRST_CREATINE_WEEK');
  }
  if (creatineStreakDays >= 30) {
    unlockedBadgeCodes.push('THIRTY_DAY_CREATINE_STREAK');
  }
  if (creatineStreakDays >= 100) {
    unlockedBadgeCodes.push('IRON_HABIT_MASTER');
  }

  return {
    dailyStatus: {
      creatineTaken: creatineTakenToday,
      wheyTaken: wheyTakenToday,
    },
    weeklyConsistencyPct,
    monthlyConsistencyPct,
    creatineStreakDays,
    unlockedBadgeCodes,
  };
};
