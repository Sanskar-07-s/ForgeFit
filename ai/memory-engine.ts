// ForgeFit AI - AI Memory Engine (v4.4)
import { Profile, WorkoutLog, NutritionLog, RecoveryLog, SupplementLog } from '../shared/types';

/**
 * Creates a compact, token-efficient summary of the user's biometric profile.
 */
export const generateProfileSummary = (profile: Profile): string => {
  return `User: ${profile.name} | Age: ${profile.age} | ${profile.gender} | Ht: ${profile.height}cm | Wt: ${profile.weight}kg | Tier: ${profile.role}
Level: ${profile.level} | XP: ${profile.xp} | Current Streak: ${profile.streak} days (Longest: ${profile.longest_streak} days)
Diet: ${profile.dietary_preference} | Exp: ${profile.experience_level} | Equip: ${profile.available_equipment.join(',')}`;
};

/**
 * Creates a compact summary of the user's fitness goal settings.
 */
export const generateGoalSummary = (profile: Profile): string => {
  return `Target Goal: ${profile.goal} | Plan Frequency: ${profile.training_days} sessions/week`;
};

/**
 * Creates a compact summary of the last 3 workout log sessions.
 */
export const generateWorkoutSummary = (workouts: WorkoutLog[]): string => {
  if (workouts.length === 0) return 'No workouts logged yet.';
  
  const sorted = [...workouts].sort((a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime()).slice(0, 3);
  const summaryLines = sorted.map(log => {
    const dateStr = new Date(log.logged_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    return `- ${dateStr}: Vol: ${log.total_volume.toFixed(0)}kg | Dur: ${log.duration_minutes}min | RPE: ${log.rpe || 'N/A'}${log.notes ? ` (${log.notes})` : ''}`;
  });
  
  return `Recent Workout History:\n${summaryLines.join('\n')}`;
};

/**
 * Creates a compact summary of recovery telemetry (sleep/soreness) over the last 3 days.
 */
export const generateRecoverySummary = (recovery: RecoveryLog[]): string => {
  if (recovery.length === 0) return 'No recovery data tracked recently.';

  const sorted = [...recovery].sort((a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime()).slice(0, 3);
  const summaryLines = sorted.map(log => {
    const dateStr = new Date(log.logged_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    return `- ${dateStr}: Sleep: ${log.sleep_hours || 0}hr | Soreness: ${log.soreness_score || 0}/10 | Recov: ${log.recovery_pct || 0}%`;
  });

  return `Recent Recovery Logs:\n${summaryLines.join('\n')}`;
};

/**
 * Creates a compact summary of nutrition metrics (calories/macros/water) over the last 3 days.
 */
export const generateNutritionSummary = (nutrition: NutritionLog[]): string => {
  if (nutrition.length === 0) return 'No meals logged recently.';

  const sorted = [...nutrition].sort((a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime()).slice(0, 3);
  const summaryLines = sorted.map(log => {
    const dateStr = new Date(log.logged_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    return `- ${dateStr}: ${log.calories} kcal (P:${log.protein}g, C:${log.carbs}g, F:${log.fat}g) | Water: ${log.water_ml}ml`;
  });

  return `Recent Nutrition Logs:\n${summaryLines.join('\n')}`;
};

/**
 * Creates a compact summary of supplement compliance.
 */
export const generateSupplementSummary = (supplements: SupplementLog[]): string => {
  if (supplements.length === 0) return 'No supplement history logged.';
  
  const sorted = [...supplements].sort((a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime()).slice(0, 5);
  const creatineDays = sorted.filter(s => s.creatine_g > 0).length;
  const proteinDays = sorted.filter(s => s.whey_protein_g > 0).length;

  return `Supplement Consistency (Last 5 records): Creatine taken: ${creatineDays}/5 days | Whey Protein: ${proteinDays}/5 days`;
};

/**
 * Combines all summaries and recent conversation history into a unified system prompt frame.
 */
export const buildMemoryContextPrompt = (
  profile: Profile,
  workouts: WorkoutLog[],
  nutrition: NutritionLog[],
  recovery: RecoveryLog[],
  supplements: SupplementLog[]
): string => {
  const profileSum = generateProfileSummary(profile);
  const goalSum = generateGoalSummary(profile);
  const workoutSum = generateWorkoutSummary(workouts);
  const recoverySum = generateRecoverySummary(recovery);
  const nutritionSum = generateNutritionSummary(nutrition);
  const supplementSum = generateSupplementSummary(supplements);

  return `You are ForgeFit AI, a premium, hyper-intelligent, elite fitness and nutrition coach.
  
[COMPACT MEMORY CONTEXT]
Profile: ${profileSum}
Goal: ${goalSum}
${workoutSum}
${recoverySum}
${nutritionSum}
${supplementSum}

Instructions:
1. Provide realistic, scientifically sound fitness, form, recovery, and nutrition advice.
2. Keep responses highly structured, concise, and professional (venture startup-quality).
3. Ground recommendations in the user's specific goals, dietary preferences, and available equipment.
4. Keep user safety paramount; warn about common mistakes and advise progressive loading increments conservatively.
5. Always stay in character as ForgeFit AI Coach. Keep answers engaging, highly actionable, and brief.`;
};
