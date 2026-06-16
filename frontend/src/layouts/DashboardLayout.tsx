// ForgeFit AI - Dashboard Workspace Layout (v5.0) — Premium Navigation

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
  X,
  Sun,
  Moon,
  CloudLightning,
  CheckCircle,
  WifiOff,
  RefreshCw,
  Award,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Users,
  LogOut,
  Zap,
  Cpu,
  Smartphone,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { BackgroundCanvas } from '../components/BackgroundCanvas';

// ── Types ─────────────────────────────────────────────────
interface NavItem {
  name:  string;
  label: string;   // Short label for bottom nav
  path:  string;
  icon:  React.ElementType;
}

// ── Nav items ─────────────────────────────────────────────
const MAIN_NAV: NavItem[] = [
  { name: 'Dashboard',     label: 'Home',     path: '/dashboard',  icon: Home },
  { name: 'Workouts',      label: 'Workout',  path: '/workouts',   icon: Dumbbell },
  { name: 'Nutrition',     label: 'Nutrition',path: '/nutrition',  icon: Utensils },
  { name: 'Progress',      label: 'Progress', path: '/progress',   icon: LineChart },
  { name: 'AI Coach',      label: 'AI Coach', path: '/coach',      icon: MessageSquare },
];

const MORE_NAV: NavItem[] = [
  { name: 'AI Gym Buddy',     label: 'Buddy',       path: '/gym-buddy',    icon: Cpu },
  { name: 'Devices Hub',      label: 'Devices',     path: '/devices',      icon: Smartphone },
  { name: 'Exercise Library', label: 'Exercises',   path: '/exercises',    icon: BookOpen },
  { name: 'Community',        label: 'Community',   path: '/community',    icon: Users },
  { name: 'Notifications',    label: 'Alerts',      path: '/notifications',icon: Bell },
  { name: 'Settings',         label: 'Settings',    path: '/settings',     icon: Settings },
];

const ADMIN_NAV: NavItem = {
  name: 'Admin Console', label: 'Admin', path: '/admin', icon: ShieldAlert,
};

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, logout } = useAuth();
  const { syncStatus, triggerManualSync } = useSync();
  const { unreadCount } = useNotifications();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  // Build full nav list for desktop sidebar
  const allNav = [...MAIN_NAV, ...MORE_NAV];
  if (profile?.role === 'admin') allNav.push(ADMIN_NAV);

  const isActive = (path: string) => location.pathname === path;

  // ── Sync indicator ─────────────────────────────────────
  const renderSync = () => {
    switch (syncStatus.state) {
      case 'Connected':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-brand-emerald/10 text-brand-emerald border border-brand-emerald/20">
            <CheckCircle className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Synced</span>
          </div>
        );
      case 'Offline':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-brand-amber/10 text-brand-amber border border-brand-amber/20">
            <WifiOff className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Offline</span>
          </div>
        );
      case 'Syncing':
        return (
          <button onClick={triggerManualSync} className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20 animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span className="hidden lg:inline">Syncing…</span>
          </button>
        );
      default:
        return (
          <button onClick={triggerManualSync} className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-brand-rose/10 text-brand-rose border border-brand-rose/20">
            <CloudLightning className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      <BackgroundCanvas />

      {/* ── Skip link ── */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-brand-cyan text-dark-bg px-4 py-2 rounded-xl z-50 font-bold text-xs">
        Skip to main content
      </a>

      {/* ── Dev mode banner ── */}
      <div
        role="status"
        aria-live="polite"
        className={`w-full py-1 text-center text-[10px] font-bold uppercase tracking-widest border-b ${
          isSimulatorMode
            ? 'bg-brand-amber/10 text-brand-amber border-brand-amber/20'
            : 'bg-brand-emerald/10 text-brand-emerald border-brand-emerald/20'
        }`}
      >
        {isSimulatorMode ? '⚠️ Simulator Mode — Local Storage Sandbox' : '🚀 Live Mode — Supabase Cloud Sync Active'}
      </div>

      {/* ── TOP HEADER ── */}
      <header className="sticky top-0 z-40 w-full glass-panel border-b border-dark-border/50 py-3 px-4 md:px-6 flex items-center justify-between">

        {/* Brand */}
        <div className="flex items-center gap-3">
          {/* Collapse toggle (desktop only) */}
          <button
            onClick={() => setSidebarCollapsed(p => !p)}
            className="hidden md:flex items-center justify-center w-8 h-8 rounded-lg hover:bg-white/5 text-slate-500 hover:text-slate-300 transition-colors"
            aria-label="Toggle sidebar"
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          <Link to="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-dark-bg text-sm shadow-glow-cyan"
              style={{ background: 'linear-gradient(135deg, #22D3EE, #8B5CF6)' }}>
              F
            </div>
            {!sidebarCollapsed && (
              <span className="hidden md:block font-extrabold text-lg tracking-tight gradient-text">
                ForgeFit<span className="text-brand-purple">.AI</span>
              </span>
            )}
            <span className="md:hidden font-extrabold text-lg tracking-tight gradient-text">
              ForgeFit<span className="text-brand-purple">.AI</span>
            </span>
          </Link>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2 md:gap-3">
          {renderSync()}

          {/* XP gauge */}
          {profile && (
            <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <Zap className="w-3.5 h-3.5 text-brand-cyan" />
              <span className="text-slate-400 font-medium">Lv.{profile.level}</span>
              <div className="w-20 bg-white/10 h-1.5 rounded-full overflow-hidden">
                <div className="progress-fill-cyan h-full" style={{ width: `${Math.min((profile.xp / (profile.level * 1000)) * 100, 100)}%` }} />
              </div>
              <span className="text-brand-cyan font-bold">{profile.xp} XP</span>
            </div>
          )}

          {/* Streak */}
          {profile && (
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-xl text-brand-amber font-bold text-sm" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <Flame className="w-4 h-4 fill-brand-amber" />
              <span>{profile.streak}d</span>
            </div>
          )}

          {/* Theme */}
          <button onClick={toggleTheme} className="p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-slate-200 transition-colors">
            {theme === 'dark' ? <Sun className="w-4.5 h-4.5 text-brand-amber" /> : <Moon className="w-4.5 h-4.5 text-slate-600" />}
          </button>

          {/* Notifications */}
          <Link to="/notifications" className="relative p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-slate-200 transition-colors">
            <Bell className="w-4.5 h-4.5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full text-[9px] font-bold text-white flex items-center justify-center" style={{ background: '#EF4444' }}>
                {unreadCount}
              </span>
            )}
          </Link>

          {/* Logout (desktop) */}
          <button
            onClick={logout}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl text-slate-400 hover:text-brand-rose transition-colors hover:bg-brand-rose/5"
          >
            <LogOut className="w-3.5 h-3.5" /> Logout
          </button>
        </div>
      </header>

      {/* ── MAIN WORKSPACE ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── DESKTOP SIDEBAR ── */}
        <aside
          className={`hidden md:flex flex-col glass-panel border-r border-dark-border/50 shrink-0 transition-all duration-300 ease-in-out justify-between ${
            sidebarCollapsed ? 'w-[64px]' : 'w-[220px]'
          }`}
        >
          <nav className="p-3 space-y-1">
            {allNav.map(item => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  title={sidebarCollapsed ? item.name : undefined}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    active ? 'nav-active' : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'
                  } ${sidebarCollapsed ? 'justify-center' : ''}`}
                >
                  <Icon className="w-4.5 h-4.5 shrink-0" />
                  {!sidebarCollapsed && <span>{item.name}</span>}
                </Link>
              );
            })}
          </nav>

          {!sidebarCollapsed && (
            <div className="p-3 border-t border-dark-border/30 text-center space-y-0.5">
              <p className="text-[10px] text-slate-600">ForgeFit AI v5.0</p>
              <p className="text-[9px] text-slate-700">Premium Engine Active</p>
            </div>
          )}
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6 focus:outline-none relative z-10"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ type: 'spring', stiffness: 350, damping: 26 }}
              className="max-w-6xl mx-auto"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* ── MOBILE BOTTOM NAVIGATION ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 md:hidden glass-panel border-t border-dark-border/50 flex items-center justify-around px-2 py-2"
        style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}>
        {MAIN_NAV.map(item => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
                active ? 'text-brand-cyan' : 'text-slate-600 hover:text-slate-400'
              }`}
            >
              <Icon className={`w-5 h-5 transition-all ${active ? 'drop-shadow-[0_0_6px_rgba(34,211,238,0.8)]' : ''}`} />
              <span className={`text-[10px] font-semibold ${active ? 'text-brand-cyan' : ''}`}>{item.label}</span>
            </Link>
          );
        })}

        {/* More button */}
        <button
          onClick={() => setMoreMenuOpen(true)}
          className="flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-xl text-slate-600 hover:text-slate-400 transition-all"
        >
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-[10px] font-semibold">More</span>
        </button>
      </nav>

      {/* ── MOBILE MORE MENU (bottom sheet) ── */}
      {moreMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 md:hidden bg-black/60 backdrop-blur-sm"
            onClick={() => setMoreMenuOpen(false)}
          />
          {/* Sheet */}
          <div className="bottom-sheet z-50 md:hidden p-6 pb-10">
            <div className="flex items-center justify-between mb-6">
              <span className="font-bold text-lg text-white gradient-text">More</span>
              <button onClick={() => setMoreMenuOpen(false)} className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[...MORE_NAV, ...(profile?.role === 'admin' ? [ADMIN_NAV] : [])].map(item => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setMoreMenuOpen(false)}
                    className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl text-center transition-all ${
                      active ? 'card-glow-cyan' : ''
                    }`}
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      active ? 'text-brand-cyan' : 'text-slate-400'
                    }`} style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={`text-xs font-semibold ${active ? 'text-brand-cyan' : 'text-slate-400'}`}>{item.name}</span>
                  </Link>
                );
              })}
            </div>

            <button
              onClick={() => { setMoreMenuOpen(false); logout(); }}
              className="w-full mt-6 py-3 rounded-2xl text-sm font-bold text-brand-rose border border-brand-rose/20 hover:bg-brand-rose/10 transition-all flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </>
      )}
    </div>
  );
};
