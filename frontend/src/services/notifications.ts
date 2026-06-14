// ForgeFit AI - Push & In-App Notification Manager Service (v4.3)

import type { Notification } from '@shared/types';
import { offlineDb } from './offlineDb';

export interface NotificationPreferences {
  workout: boolean;
  nutrition: boolean;
  hydration: boolean;
  supplement: boolean;
  recovery: boolean;
  community: boolean;
  challenge: boolean;
  system: boolean;
}

export const defaultPreferences: NotificationPreferences = {
  workout: true,
  nutrition: true,
  hydration: true,
  supplement: true,
  recovery: true,
  community: true,
  challenge: true,
  system: true,
};

class NotificationService {
  private inAppInbox: Notification[] = [];
  private preferences: NotificationPreferences = defaultPreferences;

  constructor() {
    // Load cached preferences and notifications
    const cachedPrefs = localStorage.getItem('forgefit_notification_preferences');
    if (cachedPrefs) {
      this.preferences = { ...defaultPreferences, ...JSON.parse(cachedPrefs) };
    }
    this.inAppInbox = offlineDb.getCollection<Notification>('notifications');
  }

  getPreferences(): NotificationPreferences {
    return this.preferences;
  }

  savePreferences(prefs: NotificationPreferences): void {
    this.preferences = prefs;
    localStorage.setItem('forgefit_notification_preferences', JSON.stringify(prefs));
  }

  getInbox(): Notification[] {
    return this.inAppInbox;
  }

  /**
   * Broadcasts a notification locally (native browser + in-app log write).
   */
  async sendNotification(
    userId: string,
    title: string,
    message: string,
    category: keyof NotificationPreferences
  ): Promise<Notification | null> {
    // Check if category is enabled in user settings
    if (!this.preferences[category]) {
      return null;
    }

    const notification: Notification = {
      id: Math.random().toString(36).substring(2, 9),
      user_id: userId,
      title,
      message,
      category,
      read: false,
      created_at: new Date().toISOString(),
    };

    // 1. Save to local in-app inbox
    this.inAppInbox.unshift(notification);
    offlineDb.persistRecordLocally('notifications', notification);

    // 2. Dispatch Native Browser Push Notification
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new window.Notification(title, {
          body: message,
          icon: '/favicon.svg',
          badge: '/favicon.svg',
        });
      } catch (err) {
        // Fallback for mobile devices where service workers show notifications
        if (navigator.serviceWorker && navigator.serviceWorker.ready) {
          const reg = await navigator.serviceWorker.ready;
          reg.showNotification(title, {
            body: message,
            icon: '/favicon.svg',
          });
        }
      }
    }

    return notification;
  }

  markAsRead(id: string): void {
    const item = this.inAppInbox.find(n => n.id === id);
    if (item) {
      item.read = true;
      offlineDb.persistRecordLocally('notifications', item);
    }
  }

  markAllAsRead(): void {
    this.inAppInbox.forEach(n => {
      n.read = true;
      offlineDb.persistRecordLocally('notifications', n);
    });
  }

  deleteNotification(id: string): void {
    this.inAppInbox = this.inAppInbox.filter(n => n.id !== id);
    offlineDb.deleteRecordLocally('notifications', id);
  }

  clearAll(): void {
    this.inAppInbox = [];
    localStorage.removeItem('forgefit_notifications');
  }
}

export const notifications = new NotificationService();
