// ForgeFit AI - Telemetry Analytics Manager Service (v4.4)
import { supabase, isSimulatorMode } from './supabase';
import { errorMonitor } from './error-monitor';
import { logEvent } from 'firebase/analytics';
import { analytics } from './firebase';

export interface AnalyticsEventPayload {
  user_id?: string;
  event_name: string;
  metadata?: Record<string, any>;
  created_at: string;
}

/**
 * Tracks a user telemetry event.
 * Ensures strict security by checking auth session user_id in Live Mode.
 */
export async function trackEvent(eventName: string, metadata: Record<string, any> = {}): Promise<void> {
  const now = new Date().toISOString();

  // Send to Firebase Analytics first if initialized
  if (analytics) {
    try {
      logEvent(analytics, eventName, metadata);
    } catch (err) {
      console.warn('[ForgeFit Analytics] Firebase logging failed:', err);
    }
  }
  
  // Try to resolve current user session
  let userId: string | undefined = undefined;
  
  try {
    const { data } = await supabase.auth.getUser();
    if (data?.user) {
      userId = data.user.id;
    }
  } catch (err) {
    // Session fetching fails in completely offline environments, ignore gracefully
  }

  const payload: AnalyticsEventPayload = {
    user_id: userId,
    event_name: eventName,
    metadata: {
      ...metadata,
      environment: isSimulatorMode ? 'simulator' : 'production',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
    },
    created_at: now
  };

  if (isSimulatorMode) {
    // Store in LocalStorage simulator queue
    try {
      const localEventsStr = localStorage.getItem('forgefit_sim_analytics') || '[]';
      const localEvents = JSON.parse(localEventsStr) as AnalyticsEventPayload[];
      localEvents.push(payload);
      localStorage.setItem('forgefit_sim_analytics', JSON.stringify(localEvents));
      console.log(`[ForgeFit Analytics] (Local): ${eventName}`, payload);
    } catch (err: any) {
      errorMonitor.logError('offline_sync_error', `Failed to write local analytics event: ${err.message}`);
    }
  } else {
    // Write directly to Supabase with RLS constraints
    try {
      // If user is not logged in, we cannot write to the table (due to RLS checking auth.uid() = user_id)
      if (!userId) {
        console.warn(`[ForgeFit Analytics] Pre-auth event "${eventName}" skipped in Live Mode (requires authenticated user_id).`);
        return;
      }

      const { error } = await supabase.from('analytics_events').insert({
        user_id: userId,
        event_name: eventName,
        metadata: payload.metadata,
        created_at: now
      });

      if (error) throw error;
      console.log(`[ForgeFit Analytics] (Remote): ${eventName}`, payload);
    } catch (err: any) {
      errorMonitor.logError('api_failure', `Failed to upload analytics event: ${err.message}`, err.stack);
    }
  }
}
