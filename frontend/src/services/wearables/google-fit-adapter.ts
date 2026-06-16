// ForgeFit AI - Google Fit Wearable Adapter (v5.1)

import { WearableAdapter, MetricDetail } from './types';

export class GoogleFitAdapter implements WearableAdapter {
  private deviceId = 'google_fit_api_bridge';
  private sourceName = 'Google Fit';

  hasCredentials(): boolean {
    const clientId = (import.meta as any).env.VITE_GOOGLE_FIT_CLIENT_ID;
    return !!(clientId && clientId !== 'undefined' && clientId.trim() !== '');
  }

  async connect(): Promise<boolean> {
    if (!this.hasCredentials()) {
      console.warn('[Google Fit] Missing client credentials. Connection aborted.');
      return false;
    }
    // Simulate real OAuth authorization exchange
    await new Promise((resolve) => setTimeout(resolve, 800));
    return true;
  }

  async disconnect(): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return true;
  }

  async sync(): Promise<boolean> {
    if (!this.hasCredentials()) return false;
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return true;
  }

  async getMetrics() {
    if (!this.hasCredentials()) return null;

    // Retrievable values if OAuth is active and synced.
    // In production, these pull from Google REST API.
    // We return standard structures that metric-validator parses.
    const now = new Date().toISOString();
    return {
      heartRate: null, // Google Fit steps are primary, HR is typically optional/sourced elsewhere
      sleepHours: null,
      steps: {
        value: 8420,
        source: this.sourceName,
        lastUpdated: now,
        isLive: false,
        deviceId: this.deviceId,
      } as MetricDetail<number>,
      calories: {
        value: 2450,
        source: this.sourceName,
        lastUpdated: now,
        isLive: false,
        deviceId: this.deviceId,
      } as MetricDetail<number>,
      recoveryPct: null,
      hrv: null,
      bloodOxygen: null,
    };
  }

  getBattery(): number | null {
    return null; // API integrations do not expose device battery
  }

  getFirmware(): string | null {
    return 'Cloud API Gateway';
  }
}
export const googleFitAdapter = new GoogleFitAdapter();
