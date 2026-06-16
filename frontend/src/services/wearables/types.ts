// ForgeFit AI - Wearable Integration Types (v5.1)

export type ConnectionState =
  | 'not_connected'
  | 'connecting'
  | 'connected'
  | 'syncing'
  | 'sync_failed'
  | 'integration_not_configured';

export interface MetricDetail<T> {
  value: T;
  source: string;
  lastUpdated: string;
  isLive: boolean;
  deviceId: string;
}

export interface WearableAdapter {
  connect(): Promise<boolean>;
  disconnect(): Promise<boolean>;
  sync(): Promise<boolean>;
  getMetrics(): Promise<{
    heartRate: MetricDetail<number> | null;
    sleepHours: MetricDetail<number> | null;
    steps: MetricDetail<number> | null;
    calories: MetricDetail<number> | null;
    recoveryPct: MetricDetail<number> | null;
    hrv: MetricDetail<number> | null;
    bloodOxygen: MetricDetail<number> | null;
  } | null>;
  getBattery(): number | null;
  getFirmware(): string | null;
}
