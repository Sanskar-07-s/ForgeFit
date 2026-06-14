// ForgeFit AI - Offline Synchronization Provider Context (v4.3)

import React, { createContext, useContext, useEffect, useState } from 'react';
import { OfflineSyncProcessor, SyncStatusReport, QueuedMutation } from '@ai/offline-sync-engine';
import { offlineDb } from '../services/offlineDb';
import { supabase } from '../services/supabase';
import { notifications } from '../services/notifications';

interface SyncContextType {
  syncStatus: SyncStatusReport;
  queueMutation: (table: string, action: QueuedMutation['action'], payload: Record<string, any>) => void;
  triggerManualSync: () => Promise<void>;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export const SyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [processor] = useState(() => {
    const cachedQueue = offlineDb.getSyncQueue();
    return new OfflineSyncProcessor(cachedQueue);
  });

  const [syncStatus, setSyncStatus] = useState<SyncStatusReport>(processor.getSyncReport());

  useEffect(() => {
    // 1. Connection Event Listeners
    const handleOnline = () => {
      processor.setOnlineStatus(true);
      setSyncStatus(processor.getSyncReport());
      runSyncLoop();
    };

    const handleOffline = () => {
      processor.setOnlineStatus(false);
      setSyncStatus(processor.getSyncReport());
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Run initial sync check
    runSyncLoop();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const runSyncLoop = async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return;
    }

    setSyncStatus(processor.getSyncReport());

    const report = await processor.processSyncQueue(async (mutation) => {
      try {
        let error = null;

        // Apply mutation to Supabase client
        if (mutation.action === 'INSERT') {
          const res = await supabase.from(mutation.table).insert(mutation.payload);
          error = res.error;
        } else if (mutation.action === 'UPDATE') {
          const res = await supabase
            .from(mutation.table)
            .update(mutation.payload)
            .eq('id', mutation.payload.id);
          error = res.error;
        } else if (mutation.action === 'DELETE') {
          const res = await supabase
            .from(mutation.table)
            .delete()
            .eq('id', mutation.payload.id);
          error = res.error;
        }

        if (error) {
          console.warn(`Sync failed for table ${mutation.table}:`, error);
          return false;
        }
        return true;
      } catch (err) {
        return false;
      }
    });

    // Save remainder queue to local storage cache
    offlineDb.saveSyncQueue(processor.getQueue());
    setSyncStatus(report);

    if (report.state === 'Connected' && report.pendingMutationsCount === 0 && report.lastSyncedAt) {
      notifications.sendNotification(
        'system',
        'Database Caches Synced! ☁️',
        'Local offline modifications have been successfully merged with server nodes.',
        'system'
      );
    }
  };

  const queueMutation = (table: string, action: QueuedMutation['action'], payload: Record<string, any>) => {
    // 1. Immediate local write to allow instant UI update
    if (action === 'DELETE') {
      offlineDb.deleteRecordLocally(table, payload.id);
    } else {
      offlineDb.persistRecordLocally(table, payload);
    }

    // 2. Queue for database sync
    processor.queueMutation(table, action, payload);
    offlineDb.saveSyncQueue(processor.getQueue());
    setSyncStatus(processor.getSyncReport());

    // 3. Attempt processing immediately if online
    runSyncLoop();
  };

  const triggerManualSync = async () => {
    await runSyncLoop();
  };

  return (
    <SyncContext.Provider value={{ syncStatus, queueMutation, triggerManualSync }}>
      {children}
    </SyncContext.Provider>
  );
};

export const useSync = () => {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
};
