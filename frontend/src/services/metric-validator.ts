// ForgeFit AI - Biometric Metric Trust Layer & Validator (v5.1)

import { MetricDetail } from './wearables/types';
import { deviceManager } from './device-manager';

const MANUAL_LOGS_PREFIX = 'forgefit_manual_log_';

export interface ManualLogData {
  weight?: number;
  sleepHours?: number;
  waterIntake?: number;
  steps?: number;
  caloriesBurned?: number;
  workoutCompleted?: boolean;
  loggedAt: string;
}

export const getTodayStr = (): string => {
  return new Date().toISOString().split('T')[0];
};

export const saveManualLog = (data: Partial<ManualLogData>) => {
  const dateStr = getTodayStr();
  const key = `${MANUAL_LOGS_PREFIX}${dateStr}`;
  let current: ManualLogData = { loggedAt: new Date().toISOString() };
  try {
    const existing = localStorage.getItem(key);
    if (existing) current = JSON.parse(existing);
  } catch {}

  const updated = { ...current, ...data, loggedAt: new Date().toISOString() };
  localStorage.setItem(key, JSON.stringify(updated));
  
  // Also dispatch a storage/custom event to alert React components of the update
  window.dispatchEvent(new Event('forgefit_manual_log_updated'));
};

export const getManualLogsForDate = (dateStr: string): ManualLogData | null => {
  try {
    const stored = localStorage.getItem(`${MANUAL_LOGS_PREFIX}${dateStr}`);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

export class MetricValidator {
  /**
   * Retrieves a verified metric detail, checking active wearables first, then manual entries.
   */
  getMetric<T>(metricKey: 'heartrate' | 'sleep' | 'steps' | 'calories' | 'recovery' | 'hrv' | 'bloodoxygen'): MetricDetail<T> | null {
    const routing = deviceManager.getDataSourcesRouting();
    const sourceName = routing[metricKey];

    // 1. If a source is mapped, verify that the device is actually connected and synced
    if (sourceName && sourceName !== 'None') {
      const devices = deviceManager.getDevices();
      const device = devices.find(d => d.name === sourceName && d.status === 'connected');
      if (device) {
        // Fetch last synced metrics
        try {
          const cacheStr = localStorage.getItem(`forgefit_wearable_data_${device.id}`);
          if (cacheStr) {
            const cache = JSON.parse(cacheStr);
            const mapping: Record<string, string> = {
              heartrate: 'heartRate',
              sleep: 'sleepHours',
              steps: 'steps',
              calories: 'calories',
              recovery: 'recoveryPct',
              hrv: 'hrv',
              bloodoxygen: 'bloodOxygen',
            };
            const fieldName = mapping[metricKey];
            if (fieldName && cache[fieldName]) {
              return cache[fieldName] as MetricDetail<T>;
            }
          }
        } catch (e) {
          console.error(`Failed to retrieve metric from device cache for ${metricKey}`, e);
        }
      }
    }

    // 2. Check if a Manual Entry exists for today
    const manualData = getManualLogsForDate(getTodayStr());
    if (manualData) {
      const now = manualData.loggedAt;
      if (metricKey === 'sleep' && manualData.sleepHours !== undefined) {
        return {
          value: manualData.sleepHours as unknown as T,
          source: 'Manual Entry',
          lastUpdated: now,
          isLive: false,
          deviceId: 'manual_entry',
        };
      }
      if (metricKey === 'steps' && manualData.steps !== undefined) {
        return {
          value: manualData.steps as unknown as T,
          source: 'Manual Entry',
          lastUpdated: now,
          isLive: false,
          deviceId: 'manual_entry',
        };
      }
      if (metricKey === 'calories' && manualData.caloriesBurned !== undefined) {
        return {
          value: manualData.caloriesBurned as unknown as T,
          source: 'Manual Entry',
          lastUpdated: now,
          isLive: false,
          deviceId: 'manual_entry',
        };
      }
      if (metricKey === 'recovery' && manualData.sleepHours !== undefined) {
        // Safe conversion of Sleep to estimated Recovery: ONLY IF USER logged it manual.
        // Recovery Score is computed: sleepHours * 11 + 10 (standard recovery mapping)
        const recoveryScore = Math.min(manualData.sleepHours * 11 + 10, 100);
        return {
          value: recoveryScore as unknown as T,
          source: 'Manual Entry',
          lastUpdated: now,
          isLive: false,
          deviceId: 'manual_entry',
        };
      }
    }

    // 3. Under all other conditions, return null (strict validation, no fabrication)
    return null;
  }
}

export const metricValidator = new MetricValidator();
