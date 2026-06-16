// ForgeFit AI - Gemini 2.5 Flash Core Service (v4.4)
import { supabase, isSimulatorMode } from './supabase';
import { Profile, WorkoutLog, NutritionLog, RecoveryLog, SupplementLog } from '@shared/types';
import { generateLocalFallbackResponse } from '@ai/fitness-chatbot';
import { buildMemoryContextPrompt } from '@ai/memory-engine';
import { errorMonitor } from './error-monitor';
import { metricValidator } from './metric-validator';

const MODEL_NAME = 'gemini-2.5-flash';
const GEMINI_API_KEY = (import.meta as any).env.VITE_GEMINI_API_KEY || '';

export interface ChatMessage {
  role: 'user' | 'coach';
  content: string;
}

/**
 * Interface representing usage status for display in the UI.
 */
export interface UsageStatus {
  promptsUsed: number;
  limit: number;
  isExceeded: boolean;
  tier: string;
  resetPeriod: 'day' | 'hour' | 'unlimited';
}

/**
 * Checks usage logs and enforces daily (Free) and hourly (Pro) prompt limits.
 */
export async function getUsageStatus(user: { id: string; role: string }): Promise<UsageStatus> {
  const tier = user.role === 'admin' ? 'coach' : (user.role || 'free');

  if (tier === 'coach') {
    return { promptsUsed: 0, limit: Infinity, isExceeded: false, tier, resetPeriod: 'unlimited' };
  }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();

  let promptsUsed = 0;
  let limit = tier === 'pro' ? 60 : 5;
  const resetPeriod = tier === 'pro' ? 'hour' : 'day';

  if (isSimulatorMode) {
    // Read local storage logs
    const localLogsStr = localStorage.getItem('forgefit_sim_ai_usage_logs') || '[]';
    const localLogs = JSON.parse(localLogsStr) as Array<{ user_id: string; created_at: string }>;
    const userLogs = localLogs.filter(log => log.user_id === user.id);

    if (tier === 'pro') {
      promptsUsed = userLogs.filter(log => new Date(log.created_at).getTime() >= new Date(oneHourAgo).getTime()).length;
    } else {
      promptsUsed = userLogs.filter(log => new Date(log.created_at).getTime() >= new Date(todayStart).getTime()).length;
    }
  } else {
    // Query Supabase backend
    try {
      if (tier === 'pro') {
        const { count, error } = await supabase
          .from('ai_usage_logs')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', oneHourAgo);
        if (error) throw error;
        promptsUsed = count || 0;
      } else {
        const { count, error } = await supabase
          .from('ai_usage_logs')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', todayStart);
        if (error) throw error;
        promptsUsed = count || 0;
      }
    } catch (err: any) {
      errorMonitor.logError('api_failure', `Usage log check failed: ${err.message}`);
      // Fallback local checking if remote fails
      promptsUsed = 0;
    }
  }

  return {
    promptsUsed,
    limit,
    isExceeded: promptsUsed >= limit,
    tier,
    resetPeriod
  };
}

/**
 * Inserts a new record into target usage logs.
 */
async function logUsageEvent(userId: string, tier: string, tokens: number, feature: string) {
  const usageRecord = {
    id: Math.random().toString(36).substring(2, 9),
    user_id: userId,
    prompt_count: 1,
    log_date: new Date().toISOString().split('T')[0],
    tier,
    tokens_estimated: tokens,
    feature_used: feature,
    created_at: new Date().toISOString()
  };

  if (isSimulatorMode) {
    const localLogsStr = localStorage.getItem('forgefit_sim_ai_usage_logs') || '[]';
    const localLogs = JSON.parse(localLogsStr);
    localLogs.push(usageRecord);
    localStorage.setItem('forgefit_sim_ai_usage_logs', JSON.stringify(localLogs));
  } else {
    try {
      const { error } = await supabase.from('ai_usage_logs').insert(usageRecord);
      if (error) throw error;
    } catch (err: any) {
      errorMonitor.logError('api_failure', `AI Usage log insertion failed: ${err.message}`);
    }
  }
}

/**
 * Exponential backoff wrapper supporting fetch retries on transient errors (429, 500, 503).
 */
async function fetchWithRetry(url: string, options: RequestInit, retries = 3, delay = 500): Promise<Response> {
  try {
    const response = await fetch(url, options);

    if (response.ok) {
      return response;
    }

    const transientCodes = [429, 500, 503];
    if (transientCodes.includes(response.status) && retries > 0) {
      console.warn(`[Gemini Retry] Received ${response.status}. Retrying in ${delay}ms... (Retries left: ${retries})`);
      await new Promise(res => setTimeout(res, delay));
      return fetchWithRetry(url, options, retries - 1, delay * 2);
    }

    return response;
  } catch (error) {
    if (retries > 0) {
      console.warn(`[Gemini Retry] Request failed due to connection error. Retrying in ${delay}ms... (Retries left: ${retries})`);
      await new Promise(res => setTimeout(res, delay));
      return fetchWithRetry(url, options, retries - 1, delay * 2);
    }
    throw error;
  }
}

/**
 * Centralized caller dispatching queries to Gemini 2.5 Flash or local chatbot fallback.
 */
export async function askGemini(
  systemPrompt: string,
  userMessage: string,
  history: ChatMessage[],
  userId: string,
  userRole: string,
  feature: string
): Promise<string> {
  // 1. Check Rate limits first
  const usageStatus = await getUsageStatus({ id: userId, role: userRole });
  if (usageStatus.isExceeded) {
    return `Rate Limit Exceeded. You have used ${usageStatus.promptsUsed}/${usageStatus.limit} prompts for this ${usageStatus.resetPeriod}. Please upgrade to Pro or wait to reset.`;
  }

  // 2. Fallback to Local simulator chatbot when API key is unavailable
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'undefined' || GEMINI_API_KEY.trim() === '') {
    // Generate dummy profile object for local chatbot context mapping
    const fallbackProfile: Profile = {
      id: userId,
      name: 'User',
      age: 25,
      gender: 'Male',
      height: 175,
      weight: 75,
      goal: 'General Fitness',
      activity_level: 'Moderately Active',
      experience_level: 'Intermediate',
      training_days: 3,
      available_equipment: ['Dumbbells', 'Bodyweight'],
      dietary_preference: 'Non Vegetarian',
      xp: 0,
      level: 1,
      streak: 0,
      longest_streak: 0,
      permissions: { notifications: true, camera: false, microphone: false, storage: true, health: false },
      role: 'user',
      created_at: new Date().toISOString()
    };
    return generateLocalFallbackResponse(userMessage, fallbackProfile);
  }

  try {
    const contents = [
      {
        role: 'user',
        parts: [{ text: systemPrompt }]
      },
      ...history.map(msg => ({
        role: msg.role === 'coach' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      })),
      {
        role: 'user',
        parts: [{ text: userMessage }]
      }
    ];

    const response = await fetchWithRetry(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contents }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API returned status: ${response.status}`);
    }

    const data = await response.json();
    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!replyText) {
      throw new Error('Empty response parts from Gemini Model API.');
    }

    // 3. Track usage successfully
    const estimatedTokens = Math.round((systemPrompt.length + userMessage.length + replyText.length) / 4);
    await logUsageEvent(userId, usageStatus.tier, estimatedTokens, feature);

    return replyText;
  } catch (err: any) {
    errorMonitor.logError('api_failure', `Gemini query failed: ${err.message}`, err.stack);
    // Graceful fallback to local simulator chatbot
    return `[Local Coach Offline Mode]\n${generateLocalFallbackResponse(userMessage, {
      id: userId,
      name: 'User',
      age: 25,
      gender: 'Male',
      height: 175,
      weight: 75,
      goal: 'Build Muscle',
      activity_level: 'Moderately Active',
      experience_level: 'Intermediate',
      training_days: 3,
      available_equipment: ['Dumbbells', 'Bodyweight'],
      dietary_preference: 'Non Vegetarian',
      xp: 0,
      level: 1,
      streak: 0,
      longest_streak: 0,
      permissions: { notifications: true, camera: false, microphone: false, storage: true, health: false },
      role: 'user',
      created_at: new Date().toISOString()
    })}`;
  }
}

/**
 * Standard request wrappers mapping to specific recommendations and goal guides.
 */

export async function askCoach(
  userMessage: string,
  history: ChatMessage[],
  profile: Profile,
  workouts: WorkoutLog[],
  nutrition: NutritionLog[],
  recovery: RecoveryLog[],
  supplements: SupplementLog[]
): Promise<string> {
  const memoryPrompt = buildMemoryContextPrompt(profile, workouts, nutrition, recovery, supplements);

  const hr = metricValidator.getMetric<number>('heartrate');
  const sleep = metricValidator.getMetric<number>('sleep');
  const steps = metricValidator.getMetric<number>('steps');
  const calories = metricValidator.getMetric<number>('calories');
  const recoveryMetric = metricValidator.getMetric<number>('recovery');
  const hrv = metricValidator.getMetric<number>('hrv');
  const oxygen = metricValidator.getMetric<number>('bloodoxygen');

  let biometricsContext = '';
  if (hr || sleep || steps || calories || recoveryMetric || hrv || oxygen) {
    biometricsContext = `\n\n[CONNECTED DEVICE BIOMETRIC DATA]
${hr ? `- Heart Rate: ${hr.value} bpm (Source: ${hr.source}, Updated: ${hr.lastUpdated})` : ''}
${sleep ? `- Sleep: ${sleep.value} hours (Source: ${sleep.source})` : ''}
${steps ? `- Steps: ${steps.value} steps (Source: ${steps.source})` : ''}
${calories ? `- Calories Burned: ${calories.value} kcal (Source: ${calories.source})` : ''}
${recoveryMetric ? `- Recovery Score: ${recoveryMetric.value}% (Source: ${recoveryMetric.source})` : ''}
${hrv ? `- HRV: ${hrv.value} ms (Source: ${hrv.source})` : ''}
${oxygen ? `- Blood Oxygen: ${oxygen.value}% (Source: ${oxygen.source})` : ''}

You must only use these verified biometric metrics. Do not fabricate or estimate any other stats.`;
  } else {
    biometricsContext = `\n\n[CONNECTED DEVICE BIOMETRIC DATA]
No wearable device is currently connected. You do NOT have access to the user's heart rate, sleep, recovery, or readiness data.
CRITICAL RULE: If the user asks for heart rate, sleep, recovery, or readiness data, you MUST respond EXACTLY with:
"I don't currently have access to your heart rate, sleep, recovery or readiness data because no wearable device is connected."
Do not estimate or fabricate these values.`;
  }

  const finalPrompt = `${memoryPrompt}${biometricsContext}`;
  return askGemini(finalPrompt, userMessage, history, profile.id, profile.role, 'AI_COACH_CHAT');
}

export async function getWorkoutRecommendations(profile: Profile, workouts: WorkoutLog[]): Promise<string> {
  const systemPrompt = `You are ForgeFit AI, an elite training strategist. Analyze this user's details and recent workout history:
  Goal: ${profile.goal}
  Equipment: ${profile.available_equipment.join(', ')}
  Experience: ${profile.experience_level}
  Log count: ${workouts.length} recent sessions.
  
  Provide exactly 3 bullet-point training directives containing sets, reps, and loading rules. Do not output conversational filler.`;
  
  return askGemini(systemPrompt, 'Generate workout recommendations', [], profile.id, profile.role, 'WORKOUT_REC');
}

export async function getNutritionRecommendations(profile: Profile, nutrition: NutritionLog[]): Promise<string> {
  const systemPrompt = `You are ForgeFit AI, a PhD sports dietitian. Analyze the user's details and recent nutritional logs:
  Goal: ${profile.goal}
  Weight: ${profile.weight}kg | Height: ${profile.height}cm
  Diet: ${profile.dietary_preference}
  Log count: ${nutrition.length} logs.
  
  Provide exactly 3 compact nutrition instructions outlining calorie intake thresholds, protein benchmarks, and water guidelines.`;

  return askGemini(systemPrompt, 'Generate nutrition recommendations', [], profile.id, profile.role, 'NUTRITION_REC');
}

export async function getRecoveryRecommendations(profile: Profile, recovery: RecoveryLog[]): Promise<string> {
  const systemPrompt = `You are ForgeFit AI, a sports recovery expert. Analyze the user's recovery metrics:
  Goal: ${profile.goal}
  Weight: ${profile.weight}kg
  Streak: ${profile.streak} days
  Log count: ${recovery.length} logs.

  Provide exactly 3 recovery instructions detailing sleep targets, CNS fatigue management, and active stretch protocols.`;

  return askGemini(systemPrompt, 'Generate recovery recommendations', [], profile.id, profile.role, 'RECOVERY_REC');
}

export async function getGoalGuidance(profile: Profile): Promise<string> {
  const systemPrompt = `You are ForgeFit AI, a performance coach. Analyze the user's primary goal:
  Goal: ${profile.goal}
  Weight: ${profile.weight}kg
  Experience: ${profile.experience_level}

  Provide exactly 3 bullet points detailing progressive overload targets, calorie boundaries, and mindset suggestions to reach this goal.`;

  return askGemini(systemPrompt, 'Generate goal guidance', [], profile.id, profile.role, 'GOAL_GUIDANCE');
}
