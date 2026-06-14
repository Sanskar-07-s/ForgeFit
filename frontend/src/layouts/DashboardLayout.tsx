// ForgeFit AI - Dashboard Workspace Layout (v4.3)

import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSync } from '../context/SyncContext';
import { useNotifications } from '../context/NotificationContext';
import { isSimulatorMode } from '../services/supabase';
import { 
  Home, 
  Dumbbell, 
  BookOpen, 
  Utensils, 
  LineChart, 
  MessageSquare, 
  Flame, 
  Bell, 
  Settings, 
  ShieldAlert, 
  Menu, 
  X, 
  Sun, 
  Moon,
  CloudLightning,
  CheckCircle,
  WifiOff,
  RefreshCw,
  Award
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, logout } = useAuth();
  const { syncStatus, triggerManualSync } = useSync();
  const { unreadCount } = useNotifications();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigationItems = [
    { name: 'Dashboard', path: '/dashboard', icon: Home },
    { name: 'Workouts', path: '/workouts', icon: Dumbbell },
    { name: 'Exercise Library', path: '/exercises', icon: BookOpen },
    { name: 'Nutrition', path: '/nutrition', icon: Utensils },
    { name: 'Progress Tracker', path: '/progress', icon: LineChart },
    { name: 'AI Coach', path: '/coach', icon: MessageSquare },
    { name: 'Community', path: '/community', icon: Award },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  // Insert Admin panel if user is admin
  if (profile?.role === 'admin') {
    navigationItems.push({ name: 'Admin Console', path: '/admin', icon: ShieldAlert });
  }

  // Render network status indicator
  const renderSyncIndicator = () => {
    switch (syncStatus.state) {
      case 'Connected':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Synced</span>
          </div>
        );
      case 'Offline':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <WifiOff className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Offline Mode</span>
          </div>
        );
      case 'Syncing':
        return (
          <button 
            onClick={triggerManualSync}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-brand-blue/10 text-brand-blue border border-brand-blue/20 animate-pulse"
          >
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span className="hidden md:inline">Syncing...</span>
          </button>
        );
      case 'Error':
      default:
        return (
          <button 
            onClick={triggerManualSync}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20"
          >
            <CloudLightning className="w-3.5 h-3.5 text-red-500" />
            <span>Retry Sync</span>
          </button>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-dark-bg text-slate-100 dark:bg-dark-bg dark:text-slate-100 light:bg-light-bg light:text-slate-900 transition-colors">
      
      {/* Accessibility Skip Link */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-brand-blue text-white px-4 py-2 rounded-xl z-50 font-bold text-xs"
      >
        Skip to Main Content
      </a>

      {/* Developer Mode Banner */}
      <div 
        role="status" 
        aria-live="polite" 
        className={`w-full py-1.5 text-center text-[10px] font-bold uppercase tracking-wider border-b ${
          isSimulatorMode 
            ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' 
            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
        }`}
      >
        {isSimulatorMode 
          ? '⚠️ Simulator Mode Active (Local Storage database sandbox)' 
          : '🚀 Live Mode Connected (Supabase Cloud Sync active)'
        }
      </div>

      {/* 1. TOP HEADER NAVIGATION BAR */}
      <header className="sticky top-0 z-40 w-full glass-panel border-b py-3 px-4 md:px-6 flex items-center justify-between">
        
        {/* Branding & Menu Toggle */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-white/5 text-slate-400 focus:outline-none"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-blue to-brand-purple flex items-center justify-center font-bold text-white shadow-glow-blue">
              F
            </div>
            <span className="font-extrabold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-brand-blue">
              FORGEFIT<span className="text-brand-purple">.AI</span>
            </span>
          </Link>
        </div>

        {/* Dynamic State Telemetry Center */}
        <div className="flex items-center gap-4">
          {renderSyncIndicator()}

          {/* XP & Level Gauge */}
          {profile && (
            <div className="hidden lg:flex items-center gap-3 bg-white/5 border border-white/5 px-3 py-1.5 rounded-xl text-xs">
              <span className="font-bold text-slate-400">Lv. {profile.level}</span>
              <div className="w-24 bg-white/10 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-brand-blue h-full rounded-full transition-all duration-500"
                  style={{ width: `${(profile.xp / (profile.level * 1000)) * 100}%` }}
                />
              </div>
              <span className="text-brand-blue font-semibold">{profile.xp} / {profile.level * 1000} XP</span>
            </div>
          )}

          {/* Streak Flame */}
          {profile && (
            <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-xl text-amber-400 font-bold text-sm">
              <Flame className="w-4 h-4 fill-amber-500" />
              <span>{profile.streak} Days</span>
            </div>
          )}

          {/* Theme toggler */}
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-xl hover:bg-white/5 text-slate-400 transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
          </button>

          {/* Notification Inbox Icon */}
          <Link to="/notifications" className="relative p-2 rounded-xl hover:bg-white/5 text-slate-400 transition-all">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </Link>

          {/* Profile Quick Menu */}
          <button 
            onClick={logout}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-xl border border-white/10 hover:bg-white/5 text-slate-300 transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      {/* 2. MAIN WORKSPACE CONTAINER */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Side Panel (Desktop Navigation) */}
        <aside className="hidden md:flex flex-col w-64 glass-panel border-r p-4 shrink-0 justify-between">
          <nav className="space-y-1">
            {navigationItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive 
                      ? 'bg-brand-blue text-white shadow-glow-blue' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
          
          <div className="border-t border-white/5 pt-4 text-center">
            <p className="text-[10px] text-slate-500">ForgeFit AI v4.3.0 Enterprise</p>
            <p className="text-[9px] text-slate-600">Premium Caching Engine Active</p>
          </div>
        </aside>

        {/* Viewport Content Panel */}
        <main 
          id="main-content" 
          tabIndex={-1} 
          className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6 focus:outline-none"
        >
          <div className="max-w-6xl mx-auto animate-fade-in">
            {children}
          </div>
        </main>
      </div>

      {/* 3. MOBILE MENU SLIDEOVER */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-dark-bg/95 backdrop-blur-md flex flex-col p-6 animate-fade-in">
          <div className="flex items-center justify-between mb-8">
            <span className="font-extrabold text-xl tracking-tight text-white">
              WORKSPACE
            </span>
            <button 
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 rounded-xl bg-white/5 text-slate-400"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <nav className="flex-1 space-y-2">
            {navigationItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-4 px-4 py-4 rounded-2xl text-base font-semibold transition-all ${
                    isActive 
                      ? 'bg-brand-blue text-white shadow-glow-blue' 
                      : 'text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <button 
            onClick={() => {
              setMobileMenuOpen(false);
              logout();
            }}
            className="w-full py-4 text-center text-red-400 border border-red-500/20 hover:bg-red-500/10 rounded-2xl font-bold transition-all mt-auto"
          >
            Logout Session
          </button>
        </div>
      )}
      
      {/* 4. MOBILE BOTTOM ACTION BAR */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 md:hidden glass-panel border-t flex items-center justify-around py-2">
        {navigationItems.slice(0, 5).map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex flex-col items-center justify-center px-3 py-1 rounded-xl transition-all ${
                isActive ? 'text-brand-blue' : 'text-slate-500'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] mt-0.5 font-medium">{item.name.split(' ')[0]}</span>
            </Link>
          );
        })}
      </nav>

    </div>
  );
};
