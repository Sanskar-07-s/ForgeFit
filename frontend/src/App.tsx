// ForgeFit AI - React Router Routing System App.tsx (v4.3)

import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { DashboardLayout } from './layouts/DashboardLayout';
import { ErrorBoundary } from './components/ErrorBoundary';

// Direct/Eager Imports for core views (improves immediate loading)
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';

// Lazy Loaded Pages for performance optimization (Phase 0 / Sprint 1)
const Workouts = lazy(() => import('./pages/Workouts'));
const ExerciseLibrary = lazy(() => import('./pages/ExerciseLibrary'));
const Nutrition = lazy(() => import('./pages/Nutrition'));
const Progress = lazy(() => import('./pages/Progress'));
const AICoach = lazy(() => import('./pages/AICoach'));
const Community = lazy(() => import('./pages/Community'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Settings = lazy(() => import('./pages/Settings'));
const Admin = lazy(() => import('./pages/Admin'));
const GymBuddy = lazy(() => import('./pages/GymBuddy'));
const WorkoutSession = lazy(() => import('./pages/WorkoutSession'));
const Devices = lazy(() => import('./pages/Devices'));

// Premium Loading Skeleton
const SuspenseLoader = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
    <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg animate-pulse"
      style={{ background: 'linear-gradient(135deg, rgba(34,211,238,0.2), rgba(139,92,246,0.2))', border: '1px solid rgba(34,211,238,0.2)' }}>
      F
    </div>
    <div className="flex gap-2">
      <div className="w-2 h-2 rounded-full bg-brand-cyan animate-bounce" style={{ animationDelay: '0ms' }} />
      <div className="w-2 h-2 rounded-full bg-brand-cyan animate-bounce" style={{ animationDelay: '150ms' }} />
      <div className="w-2 h-2 rounded-full bg-brand-cyan animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
    <p className="text-xs text-slate-600 font-medium">Loading ForgeFit AI…</p>
  </div>
);

// Protected Router Wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading, isOnboarded } = useAuth();

  if (loading) return <SuspenseLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (!isOnboarded) return <Navigate to="/onboarding" replace />;

  return <DashboardLayout>{children}</DashboardLayout>;
};

// Onboarding only Wrapper (Allows access even if not fully onboarded yet)
const OnboardingRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <SuspenseLoader />;
  if (!user) return <Navigate to="/login" replace />;

  return <>{children}</>;
};

// Role-based Router restrictions (Coaches/Admins only)
const RoleRestrictedRoute: React.FC<{ children: React.ReactNode; allowedRoles: string[] }> = ({ children, allowedRoles }) => {
  const { user, profile, loading, isOnboarded } = useAuth();

  if (loading) return <SuspenseLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (!isOnboarded) return <Navigate to="/onboarding" replace />;
  
  const hasAccess = profile && allowedRoles.includes(profile.role);
  if (!hasAccess) return <Navigate to="/dashboard" replace />;

  return <DashboardLayout>{children}</DashboardLayout>;
};

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Suspense fallback={<SuspenseLoader />}>
          <Routes>
            {/* Public Views */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Onboarding Intake wizard */}
            <Route path="/onboarding" element={<OnboardingRoute><Onboarding /></OnboardingRoute>} />

            {/* Protected Main App Routes */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/workouts" element={<ProtectedRoute><Workouts /></ProtectedRoute>} />
            <Route path="/exercises" element={<ProtectedRoute><ExerciseLibrary /></ProtectedRoute>} />
            <Route path="/nutrition" element={<ProtectedRoute><Nutrition /></ProtectedRoute>} />
            <Route path="/progress" element={<ProtectedRoute><Progress /></ProtectedRoute>} />
            <Route path="/coach" element={<ProtectedRoute><AICoach /></ProtectedRoute>} />
            <Route path="/community" element={<ProtectedRoute><Community /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/gym-buddy" element={<ProtectedRoute><GymBuddy /></ProtectedRoute>} />
            <Route path="/coach-session" element={<ProtectedRoute><WorkoutSession /></ProtectedRoute>} />
            <Route path="/devices" element={<ProtectedRoute><Devices /></ProtectedRoute>} />

            {/* Role Restricted Admin Access */}
            <Route 
              path="/admin" 
              element={
                <RoleRestrictedRoute allowedRoles={['admin']}>
                  <Admin />
                </RoleRestrictedRoute>
              } 
            />

            {/* Wildcard Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
