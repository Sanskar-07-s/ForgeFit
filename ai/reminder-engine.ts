// ForgeFit AI - Reminder Engine (v4.3)

import { Profile, WorkoutLog, NutritionLog, SupplementLog, RecoveryLog } from '../shared/types';
import { NotificationCategory } from '../shared/enums';

export interface GeneratedReminder {
  title: string;
  message: string;
  category: NotificationCategory;
}

/**
 * Reviews user profiles and active logs to auto-generate customized fitness notifications.
 */
export const generateDailyReminders = (
  profile: Profile,
  workoutLogs: WorkoutLog[],
  nutritionLogs: NutritionLog[],
  supplementLogs: SupplementLog[],
  recoveryLogs: RecoveryLog[],
  currentDateString?: string
): GeneratedReminder[] => {
  const reminders: GeneratedReminder[] = [];
  const todayStr = (currentDateString ? new Date(currentDateString) : new Date()).toISOString().split('T')[0];

  // Enable/Disable checks based on permissions
  if (!profile.permissions.notifications) {
    return [];
  }

  const todayNutrition = nutritionLogs.find(n => new Date(n.logged_at).toISOString().split('T')[0] === todayStr);
  const todaySupplement = supplementLogs.find(s => new Date(s.logged_at).toISOString().split('T')[0] === todayStr);
  const todayRecovery = recoveryLogs.find(r => new Date(r.logged_at).toISOString().split('T')[0] === todayStr);

  // 1. Hydration Reminder (Water Goal)
  const targetWater = Math.round(profile.weight * 35); // base calculation
  const currentWater = todayNutrition ? todayNutrition.water_ml : 0;
  if (currentWater < targetWater * 0.7) {
    reminders.push({
      title: 'Hydration Check-in 💧',
      message: `You are currently at ${currentWater}ml of water. Aim for ${targetWater}ml to sustain muscle pumps and cell recovery.`,
      category: NotificationCategory.HYDRATION,
    });
  }

  // 2. Creatine Supplement Reminder
  const creatineLogged = todaySupplement ? todaySupplement.creatine_g > 0 : false;
  if (!creatineLogged && profile.goal === 'Build Muscle') {
    reminders.push({
      title: 'Fuel Your Strength ⚡',
      message: 'Don\'t forget your 5g of Creatine Monohydrate today to maximize cellular ATP stores.',
      category: NotificationCategory.SUPPLEMENT,
    });
  }

  // 3. Workout Reminder (Streak Protection)
  const lastWorkout = profile.last_workout_date;
  if (lastWorkout) {
    const lastDate = new Date(lastWorkout);
    const today = currentDateString ? new Date(currentDateString) : new Date();
    const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      reminders.push({
        title: 'Streak Protection Alert! 🔥',
        message: 'Your active workout streak is currently vulnerable! Log a session today to keep your streak burning.',
        category: NotificationCategory.WORKOUT,
      });
    } else if (diffDays > 3) {
      reminders.push({
        title: 'Missed Workout Warning 🏋️',
        message: `It has been ${diffDays} days since your last training session. Re-activate your routine with a quick full body split.`,
        category: NotificationCategory.WORKOUT,
      });
    }
  }

  // 4. Sleep Reminder (Recovery)
  const yesterdaySleep = todayRecovery ? todayRecovery.sleep_hours : 8;
  if (yesterdaySleep && yesterdaySleep < 7.0) {
    reminders.push({
      title: 'Prioritize Recovery Sleep 😴',
      message: `You logged ${yesterdaySleep} hours of sleep last night. Target 8 hours tonight to support central nervous system growth.`,
      category: NotificationCategory.RECOVERY,
    });
  }

  // 5. Protein Reminder
  const currentProtein = todayNutrition ? todayNutrition.protein : 0;
  const targetProtein = Math.round(profile.weight * 2.0); // estimated
  if (currentProtein < targetProtein * 0.5) {
    reminders.push({
      title: 'Anabolic Protein Target 🍗',
      message: `Currently logged ${currentProtein}g of protein. Push closer to your ${targetProtein}g threshold to optimize synthesis.`,
      category: NotificationCategory.NUTRITION,
    });
  }

  return reminders;
};
