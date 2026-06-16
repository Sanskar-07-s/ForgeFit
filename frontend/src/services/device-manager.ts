// ForgeFit AI - Central Device Registry & Manager (v5.1)

import { ConnectionState, MetricDetail, WearableAdapter } from './wearables/types';
import { googleFitAdapter } from './wearables/google-fit-adapter';
import { fitbitAdapter } from './wearables/fitbit-adapter';
import { garminAdapter } from './wearables/garmin-adapter';
import { appleHealthAdapter } from './wearables/apple-health-adapter';
import { samsungHealthAdapter } from './wearables/samsung-health-adapter';

export interface DeviceRegistryItem {
  id: string;
  name: string;
  category: 'smartwatch' | 'fitness_tracker' | 'health_platform' | 'companion_app';
  status: ConnectionState;
  lastSynced: string | null;
  batteryPct: number | null;
  firmwareVersion: string | null;
  availableMetrics: string[];
  adapter: WearableAdapter | null;
}

const STORAGE_KEYS = {
  CONNECTIONS: 'forgefit_device_connections',
  DATA_SOURCES: 'forgefit_data_source_routing',
};

// Supported device integrations registry
const SUPPORTED_DEVICES: Omit<DeviceRegistryItem, 'status' | 'lastSynced' | 'batteryPct' | 'firmwareVersion'>[] = [
  { id: 'google-fit',     name: 'Google Fit',       category: 'health_platform', availableMetrics: ['Steps', 'Calories'], adapter: googleFitAdapter },
  { id: 'fitbit',         name: 'Fitbit',           category: 'fitness_tracker', availableMetrics: ['Heart Rate', 'Sleep', 'Steps', 'Calories', 'Recovery', 'HRV', 'Blood Oxygen'], adapter: fitbitAdapter },
  { id: 'garmin',         name: 'Garmin Connect',   category: 'health_platform', availableMetrics: ['Heart Rate', 'Sleep', 'Steps', 'Calories', 'Recovery', 'HRV', 'Blood Oxygen'], adapter: garminAdapter },
  { id: 'apple-health',   name: 'Apple Health',     category: 'health_platform', availableMetrics: ['Heart Rate', 'Sleep', 'Steps', 'Calories', 'Recovery', 'HRV', 'Blood Oxygen'], adapter: appleHealthAdapter },
  { id: 'samsung-health',  name: 'Samsung Health',   category: 'health_platform', availableMetrics: ['Heart Rate', 'Sleep', 'Steps', 'Calories', 'Recovery', 'HRV', 'Blood Oxygen'], adapter: samsungHealthAdapter },
  { id: 'apple-watch',    name: 'Apple Watch',      category: 'smartwatch',      availableMetrics: ['Heart Rate', 'HRV', 'Steps', 'Calories'], adapter: null }, // Sourced through Apple Health Adapter
  { id: 'wear-os',        name: 'Wear OS',          category: 'smartwatch',      availableMetrics: ['Heart Rate', 'Steps', 'Calories'], adapter: null }, // Sourced through Google Fit / Samsung Health
  { id: 'bluetooth-wear', name: 'Bluetooth Smartwatch', category: 'smartwatch', availableMetrics: ['Heart Rate'], adapter: null }, // Sourced via Web Bluetooth
];

export class DeviceManager {
  private devices: DeviceRegistryItem[] = [];

  constructor() {
    this.initializeRegistry();
  }

  private initializeRegistry() {
    let savedConnections: Record<string, { status: ConnectionState; lastSynced: string | null }> = {};
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CONNECTIONS);
      if (stored) savedConnections = JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse connections', e);
    }

    this.devices = SUPPORTED_DEVICES.map(device => {
      const saved = savedConnections[device.id];
      let status: ConnectionState = 'not_connected';

      // Check credentials for adapters
      if (device.adapter) {
        const hasCreds = (device.adapter as any).hasCredentials();
        if (!hasCreds) {
          status = 'integration_not_configured';
        } else if (saved && saved.status !== 'integration_not_configured') {
          status = saved.status;
        }
      } else {
        // Native platforms (Apple Watch/Wear OS/Bluetooth Wear) configuration checks
        if (device.id === 'apple-watch') {
          const config = (import.meta as any).env.VITE_APPLE_HEALTH_CONFIGURED === 'true';
          status = config ? (saved?.status || 'not_connected') : 'integration_not_configured';
        } else if (device.id === 'wear-os') {
          const config = (import.meta as any).env.VITE_SAMSUNG_HEALTH_CONFIGURED === 'true' || (import.meta as any).env.VITE_GOOGLE_FIT_CLIENT_ID;
          status = config ? (saved?.status || 'not_connected') : 'integration_not_configured';
        } else if (device.id === 'bluetooth-wear') {
          const config = typeof navigator !== 'undefined' && 'bluetooth' in navigator;
          status = config ? (saved?.status || 'not_connected') : 'integration_not_configured';
        }
      }

      return {
        ...device,
        status,
        lastSynced: saved?.lastSynced || null,
        batteryPct: device.adapter ? device.adapter.getBattery() : null,
        firmwareVersion: device.adapter ? device.adapter.getFirmware() : null,
      };
    });
  }

  getDevices(): DeviceRegistryItem[] {
    this.initializeRegistry();
    return this.devices;
  }

  async connectDevice(id: string): Promise<boolean> {
    const dev = this.devices.find(d => d.id === id);
    if (!dev) return false;

    if (dev.status === 'integration_not_configured') {
      console.warn(`[Device Manager] Cannot connect ${dev.name}. Integration not configured.`);
      return false;
    }

    this.updateDeviceStatus(id, 'connecting');

    let success = false;
    if (dev.adapter) {
      success = await dev.adapter.connect();
    } else {
      // Simulate platform native request dialogs
      await new Promise(resolve => setTimeout(resolve, 1200));
      success = true;
    }

    if (success) {
      this.updateDeviceStatus(id, 'connected');
      await this.syncDevice(id); // auto sync upon connection
    } else {
      this.updateDeviceStatus(id, 'not_connected');
    }

    return success;
  }

  async disconnectDevice(id: string): Promise<boolean> {
    const dev = this.devices.find(d => d.id === id);
    if (!dev) return false;

    if (dev.adapter) {
      await dev.adapter.disconnect();
    }

    this.updateDeviceStatus(id, 'not_connected', null);
    this.removeRouteMappings(id);
    return true;
  }

  async syncDevice(id: string): Promise<boolean> {
    const dev = this.devices.find(d => d.id === id);
    if (!dev || dev.status === 'not_connected' || dev.status === 'integration_not_configured') return false;

    this.updateDeviceStatus(id, 'syncing');

    let success = false;
    try {
      if (dev.adapter) {
        success = await dev.adapter.sync();
        if (success) {
          const metrics = await dev.adapter.getMetrics();
          if (metrics) {
            // Save metrics to local storage for metric validator caching
            localStorage.setItem(`forgefit_wearable_data_${id}`, JSON.stringify(metrics));
          }
        }
      } else {
        // Mock native sync
        await new Promise(resolve => setTimeout(resolve, 1000));
        success = Math.random() > 0.08; // 92% sync success rate for testing
      }
    } catch {
      success = false;
    }

    if (success) {
      const now = new Date().toISOString();
      this.updateDeviceStatus(id, 'connected', now);
      this.autoRouteMetricSources(dev);
    } else {
      this.updateDeviceStatus(id, 'sync_failed');
    }

    return success;
  }

  // Auto assign metrics to their connected devices if not already assigned
  private autoRouteMetricSources(dev: DeviceRegistryItem) {
    const currentSources = this.getDataSourcesRouting();
    dev.availableMetrics.forEach(metric => {
      const key = metric.toLowerCase().replace(/\s+/g, '');
      if (!currentSources[key] || currentSources[key] === 'None') {
        currentSources[key] = dev.name;
      }
    });
    localStorage.setItem(STORAGE_KEYS.DATA_SOURCES, JSON.stringify(currentSources));
  }

  private removeRouteMappings(id: string) {
    const dev = this.devices.find(d => d.id === id);
    if (!dev) return;
    const currentSources = this.getDataSourcesRouting();
    dev.availableMetrics.forEach(metric => {
      const key = metric.toLowerCase().replace(/\s+/g, '');
      if (currentSources[key] === dev.name) {
        currentSources[key] = 'None';
      }
    });
    localStorage.setItem(STORAGE_KEYS.DATA_SOURCES, JSON.stringify(currentSources));
  }

  private updateDeviceStatus(id: string, status: ConnectionState, lastSynced?: string | null) {
    const idx = this.devices.findIndex(d => d.id === id);
    if (idx === -1) return;

    this.devices[idx].status = status;
    if (lastSynced !== undefined) {
      this.devices[idx].lastSynced = lastSynced;
    }

    // Save states to local storage
    let savedConnections: Record<string, { status: ConnectionState; lastSynced: string | null }> = {};
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CONNECTIONS);
      if (stored) savedConnections = JSON.parse(stored);
    } catch {}

    savedConnections[id] = {
      status,
      lastSynced: lastSynced !== undefined ? lastSynced : (savedConnections[id]?.lastSynced || null),
    };

    localStorage.setItem(STORAGE_KEYS.CONNECTIONS, JSON.stringify(savedConnections));
  }

  getDataSourcesRouting(): Record<string, string> {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.DATA_SOURCES);
      if (stored) return JSON.parse(stored);
    } catch {}

    // Default configuration (None mapped by default)
    return {
      heartrate: 'None',
      sleep: 'None',
      steps: 'None',
      calories: 'None',
      recovery: 'None',
      hrv: 'None',
      bloodoxygen: 'None',
    };
  }

  setDataSourceRouting(metric: string, sourceName: string) {
    const key = metric.toLowerCase().replace(/\s+/g, '');
    const current = this.getDataSourcesRouting();
    current[key] = sourceName;
    localStorage.setItem(STORAGE_KEYS.DATA_SOURCES, JSON.stringify(current));
  }
}

export const deviceManager = new DeviceManager();
