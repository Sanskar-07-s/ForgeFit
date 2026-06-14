// ForgeFit AI - Offline Database Caching Service (v4.3)

import { QueuedMutation } from '@ai/offline-sync-engine';

const STORAGE_KEYS = {
  PROFILE: 'forgefit_profile',
  WORKOUT_LOGS: 'forgefit_workout_logs',
  NUTRITION_LOGS: 'forgefit_nutrition_logs',
  SUPPLEMENT_LOGS: 'forgefit_supplement_logs',
  RECOVERY_LOGS: 'forgefit_recovery_logs',
  MEASUREMENTS: 'forgefit_measurements',
  MUTATIONS_QUEUE: 'forgefit_sync_queue',
  NOTIFICATIONS: 'forgefit_notifications',
  COMMUNITY_POSTS: 'forgefit_posts',
};

/**
 * Checks if storage is available.
 */
const isStorageAvailable = (): boolean => {
  try {
    const key = '__storage_test__';
    localStorage.setItem(key, key);
    localStorage.removeItem(key);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Simple IndexedDB-like API wrapping LocalStorage for broad compatibility.
 */
export const offlineDb = {
  // --- Profile Storage ---
  getProfile: (): any | null => {
    if (!isStorageAvailable()) return null;
    const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
    return raw ? JSON.parse(raw) : null;
  },
  
  saveProfile: (profile: any): void => {
    if (!isStorageAvailable()) return;
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  },

  // --- Collection Query Helpers ---
  getCollection: <T>(key: string): T[] => {
    if (!isStorageAvailable()) return [];
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  },

  saveCollection: <T>(key: string, data: T[]): void => {
    if (!isStorageAvailable()) return;
    localStorage.setItem(key, JSON.stringify(data));
  },

  // --- Sync Mutation Queue ---
  getSyncQueue: (): QueuedMutation[] => {
    return offlineDb.getCollection<QueuedMutation>(STORAGE_KEYS.MUTATIONS_QUEUE);
  },

  saveSyncQueue: (queue: QueuedMutation[]): void => {
    offlineDb.saveCollection<QueuedMutation>(STORAGE_KEYS.MUTATIONS_QUEUE, queue);
  },

  clearQueue: (): void => {
    if (!isStorageAvailable()) return;
    localStorage.removeItem(STORAGE_KEYS.MUTATIONS_QUEUE);
  },

  // --- Generic Helpers mapping tables to storage keys ---
  getTableKey: (table: string): string => {
    switch (table) {
      case 'profiles': return STORAGE_KEYS.PROFILE;
      case 'workout_logs': return STORAGE_KEYS.WORKOUT_LOGS;
      case 'nutrition_logs': return STORAGE_KEYS.NUTRITION_LOGS;
      case 'supplement_logs': return STORAGE_KEYS.SUPPLEMENT_LOGS;
      case 'recovery_logs': return STORAGE_KEYS.RECOVERY_LOGS;
      case 'measurements': return STORAGE_KEYS.MEASUREMENTS;
      case 'notifications': return STORAGE_KEYS.NOTIFICATIONS;
      case 'posts': return STORAGE_KEYS.COMMUNITY_POSTS;
      default: return `forgefit_${table}`;
    }
  },

  /**
   * Persists record to the correct local database cache table.
   */
  persistRecordLocally: (table: string, record: Record<string, any>): void => {
    const key = offlineDb.getTableKey(table);
    if (table === 'profiles') {
      offlineDb.saveProfile(record);
      return;
    }

    const currentList = offlineDb.getCollection<any>(key);
    
    // Check if updating existing record
    const existingIndex = currentList.findIndex(item => item.id === record.id);
    if (existingIndex !== -1) {
      currentList[existingIndex] = { ...currentList[existingIndex], ...record, updated_at: new Date().toISOString() };
    } else {
      currentList.push({ ...record, created_at: record.created_at || new Date().toISOString() });
    }

    offlineDb.saveCollection(key, currentList);
  },

  /**
   * Deletes record locally.
   */
  deleteRecordLocally: (table: string, id: string): void => {
    const key = offlineDb.getTableKey(table);
    if (table === 'profiles') {
      localStorage.removeItem(key);
      return;
    }

    const currentList = offlineDb.getCollection<any>(key);
    const filtered = currentList.filter(item => item.id !== id);
    offlineDb.saveCollection(key, filtered);
  }
};
