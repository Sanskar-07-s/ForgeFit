// ForgeFit AI - Notifications Inbox & Timing Provider Context (v4.3)

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { useFitnessData } from './FitnessDataContext';
import { notifications, NotificationPreferences } from '../services/notifications';
import { Notification } from '@shared/types';
import { generateDailyReminders } from '@ai/reminder-engine';

interface NotificationContextType {
  inbox: Notification[];
  preferences: NotificationPreferences;
  unreadCount: number;
  triggerHydrationReminder: () => Promise<void>;
  triggerSupplementReminder: () => Promise<void>;
  updatePreferences: (prefs: NotificationPreferences) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  deleteItem: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile } = useAuth();
  const { workoutLogs, nutritionLogs, supplementLogs, recoveryLogs } = useFitnessData();

  const [inbox, setInbox] = useState<Notification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences>(notifications.getPreferences());

  useEffect(() => {
    setInbox(notifications.getInbox());
  }, [user]);

  // Periodic Reminder Engine Evaluation (runs every 5 minutes in background)
  useEffect(() => {
    if (!profile) return () => {};

    const runEvaluations = async () => {
      const remindersList = generateDailyReminders(
        profile,
        workoutLogs,
        nutritionLogs,
        supplementLogs,
        recoveryLogs
      );

      for (const item of remindersList) {
        // Only send if it doesn't already exist in the inbox to avoid spam
        const duplicate = inbox.some(n => n.title === item.title && !n.read);
        if (!duplicate) {
          await notifications.sendNotification(user.id, item.title, item.message, item.category);
        }
      }
      
      setInbox([...notifications.getInbox()]);
    };

    runEvaluations();
    const timer = setInterval(runEvaluations, 300000); // 5 minutes

    return () => clearInterval(timer);
  }, [profile, workoutLogs, nutritionLogs, supplementLogs, recoveryLogs]);

  const triggerHydrationReminder = async () => {
    if (!user) return;
    await notifications.sendNotification(
      user.id,
      'Drink Water! 💧',
      'Hydration keeps your muscle joints moving smoothly. Track your next 250ml glass.',
      'hydration'
    );
    setInbox([...notifications.getInbox()]);
  };

  const triggerSupplementReminder = async () => {
    if (!user) return;
    await notifications.sendNotification(
      user.id,
      'Supplement Intake 💊',
      'Have you logged your daily Creatine or Whey Protein today?',
      'supplement'
    );
    setInbox([...notifications.getInbox()]);
  };

  const updatePreferences = (prefs: NotificationPreferences) => {
    notifications.savePreferences(prefs);
    setPreferences(prefs);
  };

  const markRead = (id: string) => {
    notifications.markAsRead(id);
    setInbox([...notifications.getInbox()]);
  };

  const markAllRead = () => {
    notifications.markAllAsRead();
    setInbox([...notifications.getInbox()]);
  };

  const deleteItem = (id: string) => {
    notifications.deleteNotification(id);
    setInbox([...notifications.getInbox()]);
  };

  const unreadCount = inbox.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        inbox,
        preferences,
        unreadCount,
        triggerHydrationReminder,
        triggerSupplementReminder,
        updatePreferences,
        markRead,
        markAllRead,
        deleteItem,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
