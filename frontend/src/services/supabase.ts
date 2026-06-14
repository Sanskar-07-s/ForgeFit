// ForgeFit AI - Supabase Client & Simulator Layer (v4.3)

import { createClient } from '@supabase/supabase-js';
import { offlineDb } from './offlineDb';

// Retrieve environment keys
const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || '';

export const isSimulatorMode = !supabaseUrl || !supabaseAnonKey || supabaseUrl === 'undefined';

// Live Supabase Client (initialized only if variables are set)
const liveClient = !isSimulatorMode ? createClient(supabaseUrl, supabaseAnonKey) : null;

// ============================================================================
// SUPABASE CLIENT SIMULATOR MODE
// ============================================================================

// Standard Exercises matching seed data for local simulator use
const SIMULATOR_EXERCISES = [
  { id: 'ex-1', name: 'Flat Barbell Bench Press', muscle_group: 'Chest', equipment: 'Full Gym', difficulty: 'Intermediate', instructions: ['Lie flat on a bench...', 'Unrack the bar and lower it...'], common_mistakes: ['Bouncing off chest'], coaching_tips: ['Retract scapula'] },
  { id: 'ex-2', name: 'Incline Dumbbell Bench Press', muscle_group: 'Upper Chest', equipment: 'Dumbbells', difficulty: 'Intermediate', instructions: ['Set bench to 30 deg incline...'], common_mistakes: ['Incline too high'], coaching_tips: ['Keep wrists stacked'] },
  { id: 'ex-3', name: 'Push-Ups', muscle_group: 'Chest', equipment: 'Bodyweight', difficulty: 'Beginner', instructions: ['Body in straight plank...', 'Lower chest...'], common_mistakes: ['Sagging hips'], coaching_tips: ['Tuck elbows'] },
  { id: 'ex-4', name: 'Wide-Grip Lat Pulldown', muscle_group: 'Lats', equipment: 'Full Gym', difficulty: 'Beginner', instructions: ['Sit at machine...', 'Pull bar to upper chest...'], common_mistakes: ['Pulling behind neck'], coaching_tips: ['Pull through elbows'] },
  { id: 'ex-5', name: 'Bodyweight Pull-Ups', muscle_group: 'Lats', equipment: 'Bodyweight', difficulty: 'Intermediate', instructions: ['Hang and pull chin clear...'], common_mistakes: ['Swinging legs'], coaching_tips: ['Squeeze scapulae'] },
  { id: 'ex-6', name: 'Barbell Back Squat', muscle_group: 'Quads', equipment: 'Full Gym', difficulty: 'Intermediate', instructions: ['Barbell on traps...', 'Squat to parallel...'], common_mistakes: ['Knees caving'], coaching_tips: ['Brace core'] },
  { id: 'ex-7', name: 'Dumbbell Bulgarian Split Squat', muscle_group: 'Quads', equipment: 'Dumbbells', difficulty: 'Advanced', instructions: ['Back foot on bench...', 'Squat down...'], common_mistakes: ['Leaning too far'], coaching_tips: ['Maintain balance'] },
  { id: 'ex-8', name: 'Standing Calf Raise', muscle_group: 'Calves', equipment: 'Dumbbells', difficulty: 'Beginner', instructions: ['Raise heels on block...'], common_mistakes: ['Bouncing'], coaching_tips: ['Pause at top'] },
  { id: 'ex-9', name: 'Plank', muscle_group: 'Abs', equipment: 'Bodyweight', difficulty: 'Beginner', instructions: ['Rest forearms and hold straight...'], common_mistakes: ['Saggy hips'], coaching_tips: ['Squeeze glutes'] },
];

const SIMULATOR_ACHIEVEMENTS = [
  { id: 'ac-1', code: 'FIRST_WORKOUT', name: 'First Sweat', description: 'Log your first recorded workout session.', xp_reward: 150, icon_name: 'Activity' },
  { id: 'ac-2', code: 'SEVEN_DAY_WARRIOR', name: '7-Day Warrior', description: 'Maintain a workout streak for 7 days.', xp_reward: 500, icon_name: 'Flame' },
  { id: 'ac-3', code: 'FIRST_PR', name: 'Power Unleashed', description: 'Record your first Personal Record.', xp_reward: 300, icon_name: 'Trophy' },
  { id: 'ac-4', code: 'IRON_HABIT_MASTER', name: 'Iron Habit Master', description: 'Log creatine consistency for 100 days.', xp_reward: 2000, icon_name: 'Award' },
];

const SIMULATOR_CHALLENGES = [
  { id: 'ch-1', name: 'Summer Shred Campaign', description: 'Complete 15 workouts and log macros for 30 days.', xp_reward: 750, duration_days: 30 },
  { id: 'ch-2', name: 'Iron Heart Challenge', description: 'Complete 8 active conditioning splits in 14 days.', xp_reward: 400, duration_days: 14 },
];

const SIMULATOR_POSTS = [
  { id: 'p-1', user_id: 'user-0', content: 'Hit a new bench PR of 100kg today! Progress overload logic is working wonders 🔥', likes_count: 8, created_at: new Date(Date.now() - 3600000).toISOString(), profile: { name: 'David Goggins', avatar_url: '' } },
  { id: 'p-2', user_id: 'user-1', content: 'Finished 7 days of hydration streak. Level 5 reached!', likes_count: 5, created_at: new Date(Date.now() - 7200000).toISOString(), profile: { name: 'Sarm Lifter', avatar_url: '' } },
];

// Initialize simulator data in localStorage if missing
if (isSimulatorMode) {
  if (offlineDb.getCollection('exercises').length === 0) {
    offlineDb.saveCollection('exercises', SIMULATOR_EXERCISES);
  }
  if (offlineDb.getCollection('achievements').length === 0) {
    offlineDb.saveCollection('achievements', SIMULATOR_ACHIEVEMENTS);
  }
  if (offlineDb.getCollection('challenges').length === 0) {
    offlineDb.saveCollection('challenges', SIMULATOR_CHALLENGES);
  }
  if (offlineDb.getCollection('posts').length === 0) {
    offlineDb.saveCollection('posts', SIMULATOR_POSTS);
  }
}

/**
 * Mock Query Builder simulating Supabase database queries.
 */
class MockQueryBuilder<T> {
  private data: T[] = [];
  private filterField?: string;
  private filterValue?: any;
  private isSingle = false;

  constructor(data: T[]) {
    this.data = data;
  }

  select(columns?: string) {
    // Return self to chain calls
    return this;
  }

  insert(values: T | T[]) {
    const arr = Array.isArray(values) ? values : [values];
    this.data.push(...arr);
    return Promise.resolve({ data: values, error: null });
  }

  update(values: Partial<T>) {
    if (this.filterField && this.filterValue !== undefined) {
      this.data = this.data.map(item => {
        if ((item as any)[this.filterField!] === this.filterValue) {
          return { ...item, ...values };
        }
        return item;
      });
    }
    return Promise.resolve({ data: values, error: null });
  }

  delete() {
    if (this.filterField && this.filterValue !== undefined) {
      this.data = this.data.filter(item => (item as any)[this.filterField!] !== this.filterValue);
    }
    return Promise.resolve({ data: null, error: null });
  }

  eq(field: string, value: any) {
    this.filterField = field;
    this.filterValue = value;
    this.data = this.data.filter(item => (item as any)[field] === value);
    return this;
  }

  order(field: string, config?: { ascending: boolean }) {
    const asc = config?.ascending !== false;
    this.data.sort((a: any, b: any) => {
      const valA = a[field];
      const valB = b[field];
      if (valA < valB) return asc ? -1 : 1;
      if (valA > valB) return asc ? 1 : -1;
      return 0;
    });
    return this;
  }

  single() {
    this.isSingle = true;
    return Promise.resolve({ data: this.data[0] || null, error: null });
  }

  then(onfulfilled?: (value: { data: T[] | T | null; error: any }) => any) {
    const result = this.isSingle ? (this.data[0] || null) : this.data;
    const promiseResult = { data: result, error: null };
    if (onfulfilled) {
      return Promise.resolve(promiseResult).then(onfulfilled);
    }
    return Promise.resolve(promiseResult);
  }
}

/**
 * Replicated Supabase Client API for Simulator Mode.
 */
class SupabaseSimulatorClient {
  auth = {
    getUser: () => {
      const activeUser = localStorage.getItem('forgefit_simulated_user');
      if (activeUser) {
        return Promise.resolve({ data: { user: JSON.parse(activeUser) }, error: null });
      }
      return Promise.resolve({ data: { user: null }, error: null });
    },

    signUp: async (credentials: any) => {
      const mockUser = {
        id: 'usr-' + Math.random().toString(36).substring(2, 9),
        email: credentials.email,
        created_at: new Date().toISOString(),
      };
      localStorage.setItem('forgefit_simulated_user', JSON.stringify(mockUser));
      return { data: { user: mockUser }, error: null };
    },

    signInWithPassword: async (credentials: any) => {
      const mockUser = {
        id: 'usr-default-sim',
        email: credentials.email,
        created_at: new Date().toISOString(),
      };
      localStorage.setItem('forgefit_simulated_user', JSON.stringify(mockUser));
      return { data: { user: mockUser }, error: null };
    },

    signOut: async () => {
      localStorage.removeItem('forgefit_simulated_user');
      return { error: null };
    }
  };

  from(table: string) {
    const key = offlineDb.getTableKey(table);
    const collectionData = offlineDb.getCollection<any>(key);
    
    // Wire changes to automatically save back to localStorage
    const builder = new MockQueryBuilder<any>(collectionData);

    const originalInsert = builder.insert.bind(builder);
    builder.insert = async (values: any) => {
      const res = await originalInsert(values);
      const arr = Array.isArray(values) ? values : [values];
      arr.forEach(val => offlineDb.persistRecordLocally(table, val));
      return res;
    };

    const originalUpdate = builder.update.bind(builder);
    builder.update = async (values: any) => {
      const res = await originalUpdate(values);
      if (builder['filterField'] === 'id' || builder['filterField'] === 'user_id') {
        const idVal = builder['filterValue'];
        const updatedList = collectionData.map(item => {
          if (item[builder['filterField']!] === idVal) {
            return { ...item, ...values };
          }
          return item;
        });
        offlineDb.saveCollection(key, updatedList);
      }
      return res;
    };

    const originalDelete = builder.delete.bind(builder);
    builder.delete = async () => {
      const res = await originalDelete();
      if (builder['filterField'] === 'id') {
        offlineDb.deleteRecordLocally(table, builder['filterValue']);
      }
      return res;
    };

    return builder;
  }
}

// Export the finalized client interface
export const supabase = !isSimulatorMode ? liveClient! : new SupabaseSimulatorClient() as any;
export default supabase;
