// ForgeFit AI - Offline Synchronization Engine (v4.3)

export interface QueuedMutation {
  id: string;
  table: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  payload: Record<string, any>;
  timestamp: number; // local execution time
  retryCount: number;
}

export interface SyncStatusReport {
  state: 'Connected' | 'Offline' | 'Syncing' | 'Error';
  pendingMutationsCount: number;
  lastSyncedAt?: string;
  syncProgressPct: number; // 0 to 100
}

/**
 * Custom sync conflict resolver using "Latest Write Wins" (LWW) strategy.
 * Compares timestamps and merges database records.
 */
export const resolveSyncConflict = (
  localRecord: Record<string, any>,
  serverRecord: Record<string, any>
): Record<string, any> => {
  const localTime = new Date(localRecord.updated_at || localRecord.created_at || 0).getTime();
  const serverTime = new Date(serverRecord.updated_at || serverRecord.created_at || 0).getTime();

  if (localTime >= serverTime) {
    // Local record is newer or equal, overwrite server
    return { ...serverRecord, ...localRecord };
  } else {
    // Server record is newer, discard local modifications
    return { ...localRecord, ...serverRecord };
  }
};

/**
 * Processor class managing the sync operations list.
 */
export class OfflineSyncProcessor {
  private queue: QueuedMutation[] = [];
  private isSyncing = false;
  private syncState: SyncStatusReport['state'] = 'Connected';
  private lastSyncedTime?: string;

  constructor(initialQueue: QueuedMutation[] = []) {
    this.queue = initialQueue;
    this.syncState = typeof navigator !== 'undefined' && navigator.onLine ? 'Connected' : 'Offline';
  }

  getQueue(): QueuedMutation[] {
    return this.queue;
  }

  getSyncReport(): SyncStatusReport {
    const totalPending = this.queue.length;
    return {
      state: this.syncState,
      pendingMutationsCount: totalPending,
      lastSyncedAt: this.lastSyncedTime,
      syncProgressPct: totalPending === 0 ? 100 : 0,
    };
  }

  /**
   * Pushes a new operation to the offline sync queue.
   */
  queueMutation(table: string, action: QueuedMutation['action'], payload: Record<string, any>): QueuedMutation {
    const mutation: QueuedMutation = {
      id: Math.random().toString(36).substring(2, 9),
      table,
      action,
      payload,
      timestamp: Date.now(),
      retryCount: 0,
    };
    
    this.queue.push(mutation);
    if (this.syncState === 'Connected') {
      this.syncState = 'Syncing';
    } else {
      this.syncState = 'Offline';
    }
    return mutation;
  }

  /**
   * Simulates network synchronization against a target callback service.
   */
  async processSyncQueue(
    syncCallback: (mutation: QueuedMutation) => Promise<boolean>
  ): Promise<SyncStatusReport> {
    if (this.queue.length === 0) {
      this.syncState = 'Connected';
      return this.getSyncReport();
    }

    this.isSyncing = true;
    this.syncState = 'Syncing';

    const remainingQueue: QueuedMutation[] = [];

    for (const mutation of this.queue) {
      try {
        const success = await syncCallback(mutation);
        if (!success) {
          mutation.retryCount += 1;
          if (mutation.retryCount < 3) {
            remainingQueue.push(mutation);
          } else {
            console.error(`Mutation ${mutation.id} on table ${mutation.table} exceeded maximum retries. Discarding.`);
          }
        }
      } catch (err) {
        mutation.retryCount += 1;
        remainingQueue.push(mutation);
      }
    }

    this.queue = remainingQueue;
    this.isSyncing = false;
    
    if (this.queue.length > 0) {
      this.syncState = 'Error';
    } else {
      this.syncState = 'Connected';
      this.lastSyncedTime = new Date().toISOString();
    }

    return this.getSyncReport();
  }

  setOnlineStatus(online: boolean) {
    this.syncState = online ? (this.queue.length > 0 ? 'Syncing' : 'Connected') : 'Offline';
  }
}
