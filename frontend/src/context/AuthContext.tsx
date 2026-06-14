// ForgeFit AI - Authentication & Profile Session Context (v4.3)

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSimulatorMode } from '../services/supabase';
import { Profile } from '@shared/types';
import { errorMonitor } from '../services/error-monitor';

interface AuthContextType {
  user: any | null;
  profile: Profile | null;
  loading: boolean;
  isOnboarded: boolean;
  login: (email: string, pass: string) => Promise<{ error: any }>;
  signup: (email: string, pass: string) => Promise<{ error: any }>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<boolean>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnboarded, setIsOnboarded] = useState(true);

  // Load session on startup
  useEffect(() => {
    const initSession = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;
        
        if (data.user) {
          setUser(data.user);
          await loadUserProfile(data.user.id);
        } else {
          setLoading(false);
        }
      } catch (err: any) {
        errorMonitor.logError('api_failure', 'Auth Session load failure: ' + err.message, err.stack);
        setLoading(false);
      }
    };

    initSession();

    // Subscribe to auth state updates
    if (!isSimulatorMode) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          setUser(session.user);
          await loadUserProfile(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
          setIsOnboarded(false);
          setLoading(false);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
    return () => {};
  }, []);

  const loadUserProfile = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .single();

      if (error || !data) {
        // User logged in but profile not generated yet (Needs onboarding)
        setIsOnboarded(false);
        setProfile(null);
      } else {
        setProfile(data);
        setIsOnboarded(!!data.goal); // Check if they completed goal selection
      }
    } catch (err: any) {
      errorMonitor.logError('api_failure', 'Profile fetch failed for uid: ' + uid, err.stack);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
      if (error) throw error;
      
      if (data.user) {
        setUser(data.user);
        await loadUserProfile(data.user.id);
      }
      return { error: null };
    } catch (err: any) {
      errorMonitor.logError('api_failure', 'Login failed: ' + err.message);
      setLoading(false);
      return { error: err };
    }
  };

  const signup = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({ email, password: pass });
      if (error) throw error;

      if (data.user) {
        setUser(data.user);
        setIsOnboarded(false); // New signup needs onboarding
        setProfile(null);
      }
      return { error: null };
    } catch (err: any) {
      errorMonitor.logError('api_failure', 'Signup failed: ' + err.message);
      setLoading(false);
      return { error: err };
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
    } catch (err) {}
    setUser(null);
    setProfile(null);
    setIsOnboarded(false);
    setLoading(false);
  };

  const updateProfile = async (updates: Partial<Profile>): Promise<boolean> => {
    if (!user) return false;
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;
      
      // Update local state
      setProfile(prev => prev ? { ...prev, ...updates } as Profile : null);
      if (updates.goal) {
        setIsOnboarded(true);
      }

      // Log audit
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        action: 'UPDATE_PROFILE',
        entity_type: 'profile',
        entity_id: user.id,
        metadata: updates,
      });

      return true;
    } catch (err: any) {
      errorMonitor.logError('api_failure', 'Profile update failed: ' + err.message, err.stack);
      return false;
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await loadUserProfile(user.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isOnboarded,
        login,
        signup,
        logout,
        updateProfile,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
