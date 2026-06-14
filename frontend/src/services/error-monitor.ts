// ForgeFit AI - Error Monitoring Service (v4.4)
import { ErrorLog } from '@shared/types';
import { supabase, isSimulatorMode } from './supabase';
import { offlineDb } from './offlineDb';

export type ErrorCategory =
  | 'ui_runtime'          // React render / UI errors
  | 'api_failure'          // API errors
  | 'supabase_error'       // Supabase client/auth/db failures
  | 'gemini_error'         // Gemini coach response failures
  | 'offline_sync_error'   // Offline sync queue failures
  | 'promise_unhandled'    // Unhandled rejections
  | 'payment_error';       // Subscription/checkout errors

class ErrorMonitor {
  private logs: ErrorLog[] = [];

  constructor() {
    this.logs = offlineDb.getCollection<ErrorLog>('error_logs');

    // Register global window error listeners
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.logError('ui_runtime', event.message, event.error?.stack);
      });

      window.addEventListener('unhandledrejection', (event) => {
        this.logError('promise_unhandled', String(event.reason), event.reason?.stack);
      });
    }
  }

  /**
   * Logs a structured failure to the database (Live Mode) or LocalStorage (Simulator Mode).
   */
  async logError(
    type: ErrorCategory,
    message: string,
    stack?: string,
    metadata?: Record<string, any>
  ): Promise<ErrorLog> {
    // Attempt to resolve active user id if authenticated
    let userId: string | undefined = undefined;
    try {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        userId = data.user.id;
      }
    } catch (err) {
      // Offline fallback, user remains undefined
    }

    const errorLog: ErrorLog = {
      id: Math.random().toString(36).substring(2, 9),
      user_id: userId,
      error_type: type,
      message,
      stack,
      metadata: metadata || {},
      created_at: new Date().toISOString(),
    };

    // Store in local memory log array
    this.logs.unshift(errorLog);

    if (isSimulatorMode) {
      // Simulator mode: Persist locally
      offlineDb.persistRecordLocally('error_logs', errorLog);
    } else {
      // Live mode: Write directly to error_logs table via Supabase client
      try {
        const { error } = await supabase.from('error_logs').insert({
          user_id: userId,
          error_type: type,
          message,
          stack,
          metadata: errorLog.metadata
        });
        if (error) throw error;
      } catch (err: any) {
        console.error('[ErrorMonitor] Failed to write error log to remote Supabase:', err.message);
        // Fallback write to local storage as secondary backup
        offlineDb.persistRecordLocally('error_logs', errorLog);
      }
    }

    console.error(`[ForgeFit ErrorMonitor] (${type}): ${message}`, stack);

    return errorLog;
  }

  getLogs(): ErrorLog[] {
    return this.logs;
  }

  clearLogs(): void {
    this.logs = [];
    localStorage.removeItem('forgefit_error_logs');
  }
}

export const errorMonitor = new ErrorMonitor();
