// ForgeFit AI - Database Interfaces and Types (v4.3)

export interface Profile {
  id: string; // matches auth.users.id
  name: string;
  age: number;
  gender: string;
  height: number; // in cm
  weight: number; // in kg
  goal: string;
  activity_level: string;
  experience_level: string;
  training_days: number;
  available_equipment: string[];
  dietary_preference: string;
  avatar_url?: string;
  xp: number;
  level: number;
  streak: number;
  longest_streak: number;
  last_workout_date?: string;
  permissions: {
    notifications: boolean;
    camera: boolean;
    microphone: boolean;
    storage: boolean;
    health: boolean;
  };
  role: 'user' | 'coach' | 'admin';
  created_at: string;
}

export interface Subscription {
  id: string;
  name: string;
  price: number;
  features: string[];
  limits: {
    ai_requests_per_day: number;
    custom_routines_count: number;
    max_clients?: number;
  };
  created_at: string;
}

export interface UserPlan {
  id: string;
  user_id: string;
  subscription_id: string;
  started_at: string;
  expires_at?: string;
  active: boolean;
}

export interface Payment {
  id: string;
  user_id: string;
  amount: number;
  provider: string;
  transaction_id: string;
  status: string;
  created_at: string;
}

export interface ExerciseCategory {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

export interface Exercise {
  id: string;
  name: string;
  description?: string;
  muscle_group: string;
  secondary_muscles: string[];
  difficulty: string;
  equipment: string;
  instructions: string[];
  common_mistakes: string[];
  coaching_tips: string[];
  image_url?: string;
  video_url?: string;
  category_id?: string;
  created_at: string;
}

export interface Workout {
  id: string;
  user_id: string;
  name: string;
  split_type: string;
  created_at: string;
}

export interface WorkoutExercise {
  id: string;
  workout_id: string;
  exercise_id: string;
  order_index: number;
  sets: number;
  reps: string;
  rest_time_seconds: number;
  progressive_overload_notes?: string;
  created_at: string;
}

export interface WorkoutLog {
  id: string;
  user_id: string;
  workout_id?: string;
  logged_at: string;
  total_volume: number;
  duration_minutes: number;
  rpe?: number;
  notes?: string;
}

export interface WorkoutLogSet {
  id: string;
  log_id: string;
  exercise_id: string;
  set_number: number;
  weight: number;
  reps: number;
  completed: boolean;
  rpe?: number;
  created_at: string;
}

export interface NutritionLog {
  id: string;
  user_id: string;
  logged_at: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  water_ml: number;
}

export interface SupplementLog {
  id: string;
  user_id: string;
  logged_at: string;
  creatine_g: number;
  whey_protein_g: number;
  notes?: string;
}

export interface Measurement {
  id: string;
  user_id: string;
  logged_at: string;
  weight?: number;
  chest?: number;
  arms?: number;
  waist?: number;
  shoulders?: number;
  thighs?: number;
  calves?: number;
}

export interface ProgressPhoto {
  id: string;
  user_id: string;
  photo_url: string;
  logged_at: string;
}

export interface RecoveryLog {
  id: string;
  user_id: string;
  logged_at: string;
  sleep_hours?: number;
  soreness_score?: number;
  workout_volume?: number;
  workout_duration?: number;
  recovery_pct?: number;
  consecutive_days: number;
}

export interface MuscleFatigueLog {
  id: string;
  user_id: string;
  logged_at: string;
  chest_fatigue: number;
  back_fatigue: number;
  shoulders_fatigue: number;
  arms_fatigue: number;
  legs_fatigue: number;
}

export interface Achievement {
  id: string;
  code: string;
  name: string;
  description: string;
  xp_reward: number;
  icon_name: string;
  created_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
}

export interface Challenge {
  id: string;
  name: string;
  description: string;
  xp_reward: number;
  duration_days: number;
  start_date: string;
  created_at: string;
}

export interface UserChallenge {
  id: string;
  user_id: string;
  challenge_id: string;
  progress: number;
  completed: boolean;
  joined_at: string;
}

export interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url?: string;
  likes_count: number;
  created_at: string;
  profile?: {
    name: string;
    avatar_url?: string;
  };
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile?: {
    name: string;
    avatar_url?: string;
  };
}

export interface Like {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  category: string;
  read: boolean;
  created_at: string;
}

export interface AiConversation {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface AiMessage {
  id: string;
  conversation_id: string;
  sender: 'user' | 'coach';
  content: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface ErrorLog {
  id: string;
  user_id?: string;
  error_type: string;
  message: string;
  stack?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface AiUsageLog {
  id: string;
  user_id: string;
  prompt_count: number;
  log_date: string;
  tier: string;
  tokens_estimated?: number;
  feature_used?: string;
  created_at?: string;
}

export interface AnalyticsEvent {
  id: string;
  user_id?: string;
  event_name: string;
  metadata: Record<string, any>;
  created_at: string;
}
