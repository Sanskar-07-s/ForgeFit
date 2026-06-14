// ForgeFit AI - Gemini Coach Chatbot Engine (v4.3)

import { Profile, WorkoutLog, NutritionLog, RecoveryLog } from '../shared/types';

export interface ChatMessage {
  role: 'user' | 'coach';
  content: string;
}

/**
 * Clean system instructions prompt framing the AI Coach behavior.
 */
export const buildSystemPrompt = (
  profile: Profile,
  recentWorkouts: WorkoutLog[],
  recentNutrition: NutritionLog[],
  recentRecovery: RecoveryLog[]
): string => {
  const workoutCount = recentWorkouts.length;
  const lastSleep = recentRecovery.length > 0 ? recentRecovery[recentRecovery.length - 1].sleep_hours : 8;
  const lastCalories = recentNutrition.length > 0 ? recentNutrition[recentNutrition.length - 1].calories : 2000;

  return `You are ForgeFit AI, a premium, hyper-intelligent, elite fitness and nutrition coach.
User Bio:
- Name: ${profile.name}
- Goal: ${profile.goal}
- Experience: ${profile.experience_level}
- Weight: ${profile.weight} kg, Height: ${profile.height} cm, Age: ${profile.age} years
- Training Frequency: ${profile.training_days} days/week
- Equipment Available: ${profile.available_equipment.join(', ')}
- Diet: ${profile.dietary_preference}

Current State:
- Workout logged this week: ${workoutCount} sessions
- Last sleep tracked: ${lastSleep} hours
- Last recorded calorie intake: ${lastCalories} kcal
- Gamification: Level ${profile.level}, ${profile.xp} XP, ${profile.streak} day streak

Instructions:
1. Provide realistic, scientifically sound fitness, form, recovery, and nutrition advice.
2. Keep responses structured, concise, and professional (startup-quality).
3. Ground recommendations in the user's specific goals (${profile.goal}), dietary preferences (${profile.dietary_preference}), and available equipment.
4. Keep user safety paramount; warn about common mistakes and advise progressive loading increments conservatively (+2.5kg or +1 rep).
5. Always stay in character as ForgeFit AI Coach. Keep answers highly engaging and brief.`;
};

/**
 * Returns a fallback response when Gemini API key is missing.
 * Analyzes the user's message text for key intents (form, calorie, recovery, routine).
 */
export const generateLocalFallbackResponse = (
  userMessage: string,
  profile: Profile
): string => {
  const query = userMessage.toLowerCase();

  if (query.includes('form') || query.includes('squat') || query.includes('deadlift') || query.includes('bench')) {
    return `Hello ${profile.name}, regarding form correction:
When performing compound movements (Squats/Deadlifts):
1. **Maintain neutral spine**: Keep your eyes focused forward/downward, brace your core, and do not arch your lower back.
2. **Drive through your mid-foot**: Ensure your heels remain flat on the floor.
3. **Elbow alignment**: For Bench Press, keep your elbows tucked at a 45-degree angle to protect your shoulders from excessive shear stress.
Let me know if you want a detailed breakdown of a specific exercise in your library!`;
  }

  if (query.includes('calorie') || query.includes('food') || query.includes('diet') || query.includes('eat') || query.includes('protein')) {
    const proteinTarget = Math.round(profile.weight * 2.0);
    return `Regarding nutrition coaching for your goal to **${profile.goal}**:
1. **Daily Targets**: Your customized profile suggests aiming for high protein (${proteinTarget}g/day).
2. **Dietary Preference**: Adhere to **${profile.dietary_preference}** meals.
3. **Meal Timing**: Distribute protein intake across 4-5 meals (30-40g each) to trigger muscle protein synthesis consistently throughout the day.
Would you like a high-protein meal template matching your preferences?`;
  }

  if (query.includes('sore') || query.includes('recovery') || query.includes('sleep') || query.includes('rest') || query.includes('fatigue')) {
    return `As your coach, recovery is where growth happens:
1. **Target Sleep**: Prioritize 7.5 to 9 hours of quality sleep to restore nervous capacities.
2. **Soreness Management**: If a muscle group has a soreness score >= 7/10, allocate a rest day or focus on active mobility.
3. **Hydration**: Drink 35ml of water per kg of bodyweight daily to flush out lactic metabolic accumulations.
Take it easy if you feel fatigued!`;
  }

  if (query.includes('program') || query.includes('split') || query.includes('workout') || query.includes('generator')) {
    return `Looking at your profile, you are set up for **${profile.experience_level}** training using **${profile.available_equipment.join(', ')}**:
1. **Recommended Split**: We suggest a **${profile.training_days >= 4 ? 'Push Pull Legs' : 'Full Body'}** routine.
2. **Progressive Overload**: Try to add +1 rep or +2.5kg only when you successfully hit the upper rep targets on all working sets.
You can use the **Workout Generator** tab to construct your schedule automatically!`;
  }

  // General default response
  return `Hi ${profile.name}! I am analyzing your fitness history. Your goal is to **${profile.goal}** at Level ${profile.level}.
I can help you with:
- Correcting form details on compound movements
- Meal planning aligned with **${profile.dietary_preference}** limits
- Calorie adjustments & protein distributions
- Overload and deload suggestions
What specific area would you like to optimize today?`;
};

/**
 * Triggers query execution against Gemini API.
 * Falls back to local response generator if keys/network fail.
 */
export const executeGeminiChat = async (
  apiKey: string,
  userMessage: string,
  history: ChatMessage[],
  profile: Profile,
  recentWorkouts: WorkoutLog[],
  recentNutrition: NutritionLog[],
  recentRecovery: RecoveryLog[]
): Promise<string> => {
  if (!apiKey || apiKey === 'undefined' || apiKey.trim() === '') {
    return generateLocalFallbackResponse(userMessage, profile);
  }

  try {
    const systemPrompt = buildSystemPrompt(profile, recentWorkouts, recentNutrition, recentRecovery);
    
    // Format messages for Google Gemini API endpoint
    // Endpoint: https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent
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

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contents }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const json = await response.json();
    const reply = json.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!reply) {
      throw new Error('Empty response from Gemini model');
    }

    return reply;
  } catch (error) {
    console.warn('Gemini API query failed, falling back to local coach rules:', error);
    return generateLocalFallbackResponse(userMessage, profile);
  }
};
