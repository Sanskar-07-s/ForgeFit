// ForgeFit AI - Firebase Analytics Setup Service (v4.4)
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAnalytics, Analytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: (import.meta as any).env.VITE_FIREBASE_API_KEY || '',
  authDomain: (import.meta as any).env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: (import.meta as any).env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: (import.meta as any).env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: (import.meta as any).env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: (import.meta as any).env.VITE_FIREBASE_APP_ID || '',
  measurementId: (import.meta as any).env.VITE_FIREBASE_MEASUREMENT_ID || ''
};

let app;
let analytics: Analytics | null = null;

// Initialize Firebase only in browser window environment and if keys are set
if (typeof window !== 'undefined' && firebaseConfig.apiKey) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    analytics = getAnalytics(app);
    console.log('[ForgeFit Firebase] Initialized Analytics successfully.');
  } catch (err) {
    console.warn('[ForgeFit Firebase] Failed to initialize Firebase Analytics:', err);
  }
}

export { app, analytics };
