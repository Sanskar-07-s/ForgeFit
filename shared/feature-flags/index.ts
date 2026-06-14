// ForgeFit AI - Shared Feature Flags (v4.3)

export interface FeatureFlags {
  anatomy3d: boolean;
  anatomy2d: boolean;
  community: boolean;
  aiCoachMemory: boolean;
  coachMode: boolean;
  advancedAnalytics: boolean;
  pushNotifications: boolean;
  supplementTracker: boolean;
  offlineSync: boolean;
}

export const defaultFeatureFlags: FeatureFlags = {
  anatomy3d: true,
  anatomy2d: true,
  community: true,
  aiCoachMemory: true,
  coachMode: true,
  advancedAnalytics: true,
  pushNotifications: true,
  supplementTracker: true,
  offlineSync: true,
};

/**
 * Helper to check if a feature flag is enabled.
 * Can be wired into process.env, config, or user profiles in the future.
 */
export const isFeatureEnabled = (
  flagName: keyof FeatureFlags,
  overrides?: Partial<FeatureFlags>
): boolean => {
  if (overrides && overrides[flagName] !== undefined) {
    return !!overrides[flagName];
  }
  return defaultFeatureFlags[flagName];
};
