// ForgeFit AI - Settings v5.0

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useFitnessData } from '../context/FitnessDataContext';
import { defaultFeatureFlags } from '@shared/feature-flags';
import {
  Settings as SettingsIcon,
  Download,
  Upload,
  CheckCircle,
  Sliders,
  Sun,
  Moon,
  AlertTriangle,
  Sparkles,
  Eye,
  EyeOff,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function Settings() {
  const { profile, updateProfile, refreshProfile, beginnerMode, toggleBeginnerMode } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { workoutLogs, nutritionLogs, measurements } = useFitnessData();

  const [submitting, setSubmitting] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: profile?.name || '',
    age: profile?.age || 25,
    height: profile?.height || 175,
    weight: profile?.weight || 70,
    training_days: profile?.training_days || 4,
  });

  const [flags, setFlags] = useState(() => {
    const cached = localStorage.getItem('forgefit_feature_flags');
    return cached ? JSON.parse(cached) : defaultFeatureFlags;
  });

  if (!profile) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    const success = await updateProfile(profileForm);
    if (success) {
      confetti({ particleCount: 30, spread: 60, colors: ['#2563eb', '#10b981'] });
      await refreshProfile();
    }
    setSubmitting(false);
  };

  const handleToggleFlag = (key: string) => {
    const updated = { ...flags, [key]: !flags[key] };
    setFlags(updated);
    localStorage.setItem('forgefit_feature_flags', JSON.stringify(updated));
    confetti({ particleCount: 15, spread: 40 });
  };

  // CSV Exporter for local records
  const handleExportDataCSV = (collectionName: 'workouts' | 'nutrition' | 'measurements') => {
    let dataToExport: any[] = [];
    let headers = '';

    if (collectionName === 'workouts') {
      dataToExport = workoutLogs;
      headers = 'id,logged_at,total_volume,duration_minutes,rpe\n';
    } else if (collectionName === 'nutrition') {
      dataToExport = nutritionLogs;
      headers = 'id,logged_at,calories,protein,carbs,fat,water_ml\n';
    } else {
      dataToExport = measurements;
      headers = 'id,logged_at,weight,chest,arms,waist,shoulders,thighs,calves\n';
    }

    const rows = dataToExport.map(item => {
      if (collectionName === 'workouts') {
        return `${item.id},"${item.logged_at}",${item.total_volume},${item.duration_minutes},${item.rpe || ''}`;
      } else if (collectionName === 'nutrition') {
        return `${item.id},"${item.logged_at}",${item.calories},${item.protein},${item.carbs},${item.fat},${item.water_ml}`;
      } else {
        return `${item.id},"${item.logged_at}",${item.weight || ''},${item.chest || ''},${item.arms || ''},${item.waist || ''},${item.shoulders || ''},${item.thighs || ''},${item.calves || ''}`;
      }
    }).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `forgefit_${collectionName}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Simulator Backup: Export localStorage state to JSON file
  const handleExportBackupJSON = () => {
    const state: Record<string, string | null> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('forgefit_')) {
        state[key] = localStorage.getItem(key);
      }
    }

    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'forgefit-backup.json');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    confetti({ particleCount: 30, spread: 60, colors: ['#7c3aed', '#ec4899'] });
  };

  // Simulator Restore: Load JSON file back to localStorage
  const handleImportBackupJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const state = JSON.parse(event.target?.result as string);
        Object.entries(state).forEach(([key, val]) => {
          if (val && typeof val === 'string') {
            localStorage.setItem(key, val);
          }
        });
        
        confetti({ particleCount: 50, spread: 80, colors: ['#10b981', '#34d399'] });
        alert('Simulator Backup restored successfully! Reloading workspace to apply...');
        window.location.reload();
      } catch (err) {
        alert('Failed to parse backup JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">

      <div className="flex items-center gap-2 border-b border-dark-border/30 pb-4">
        <SettingsIcon className="w-6 h-6 text-brand-cyan" />
        <div>
          <h1 className="text-2xl font-extrabold text-white">Settings</h1>
          <p className="text-xs text-slate-500">Manage preferences, display mode, and your data</p>
        </div>
      </div>

      {/* ── Beginner Mode Card ── */}
      <div className="glass-panel p-6 rounded-3xl space-y-4" style={{ border: beginnerMode ? '1px solid rgba(34,211,238,0.2)' : '1px solid rgba(255,255,255,0.12)' }}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: beginnerMode ? 'rgba(34,211,238,0.1)' : 'rgba(255,255,255,0.05)' }}>
              {beginnerMode ? <Eye className="w-5 h-5 text-brand-cyan" /> : <EyeOff className="w-5 h-5 text-slate-500" />}
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Beginner Mode</h3>
              <p className="text-xs text-slate-500 mt-0.5 max-w-xs">
                {beginnerMode
                  ? 'Active — Dashboard shows only essential metrics. Advanced analytics are hidden.'
                  : 'Disabled — All analytics, scores, and charts are visible on your dashboard.'}
              </p>
            </div>
          </div>

          {/* Toggle switch */}
          <button
            onClick={() => { toggleBeginnerMode(); confetti({ particleCount: 20, spread: 40 }); }}
            className={`toggle-track ${beginnerMode ? 'active' : ''} shrink-0 mt-1`}
            role="switch"
            aria-checked={beginnerMode}
            aria-label="Toggle Beginner Mode"
          >
            <div className="toggle-thumb" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-dark-border/30">
          <div className="space-y-1.5">
            <p className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Beginner Mode shows:</p>
            {['Today\'s Workout','Calories','Water Tracker','Current Streak','Today\'s Mission','AI Coach'].map(item => (
              <div key={item} className="flex items-center gap-1.5 text-brand-emerald">
                <CheckCircle className="w-3 h-3" />{item}
              </div>
            ))}
          </div>
          <div className="space-y-1.5">
            <p className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Hidden in Beginner Mode:</p>
            {['Readiness Score','Adherence Grade','Recovery Forecast','Volume Analytics','Strength Trends'].map(item => (
              <div key={item} className="flex items-center gap-1.5 text-slate-600">
                <EyeOff className="w-3 h-3" />{item}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Biometrics update form */}
        <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-4">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-brand-blue" /> Update Biometrics Setup
          </h3>

          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 font-semibold mb-2">Display Name</label>
              <input 
                type="text"
                value={profileForm.name}
                onChange={e => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                className="glass-input"
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-400 font-semibold mb-2">Age</label>
                <input 
                  type="number"
                  value={profileForm.age}
                  onChange={e => setProfileForm(prev => ({ ...prev, age: parseInt(e.target.value) || 25 }))}
                  className="glass-input"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-2">Height (cm)</label>
                <input 
                  type="number"
                  value={profileForm.height}
                  onChange={e => setProfileForm(prev => ({ ...prev, height: parseInt(e.target.value) || 175 }))}
                  className="glass-input"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-2">Weight (kg)</label>
                <input 
                  type="number"
                  value={profileForm.weight}
                  onChange={e => setProfileForm(prev => ({ ...prev, weight: parseInt(e.target.value) || 70 }))}
                  className="glass-input"
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={submitting}
              className="w-full glass-btn-primary py-3 rounded-xl mt-4 font-bold disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Update Settings'}
            </button>
          </form>
        </div>

        {/* Feature Flags Manager */}
        <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-4">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-brand-blue" /> Modular Feature Flags Configuration
          </h3>
          <p className="text-[11px] text-slate-400">Toggle active modules. Demonstrates venture-backed platform configurations.</p>

          <div className="grid grid-cols-2 gap-3 text-xs">
            {Object.entries(flags).map(([key, val]) => (
              <button
                key={key}
                onClick={() => handleToggleFlag(key)}
                className={`p-3 rounded-xl border text-center font-bold capitalize transition-all ${
                  val 
                    ? 'border-brand-blue bg-brand-blue/10 text-brand-blue' 
                    : 'border-white/5 bg-white/5 text-slate-500'
                }`}
              >
                {key.replace(/([A-Z])/g, ' $1')}: {val ? 'ON' : 'OFF'}
              </button>
            ))}
          </div>
        </div>

        {/* Data Exporter & Simulator backups */}
        <div className="glass-panel p-6 rounded-3xl border border-white/5 lg:col-span-2 space-y-6">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <Download className="w-4 h-4 text-brand-blue" /> Data Portability & Simulator Backups
          </h3>

          {/* CSV Download section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-white/5 border border-white/5 rounded-2xl flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-white">Workout Logs CSV</h4>
                <p className="text-[10px] text-slate-500 mt-1">Download historical lifts, durations, and weights.</p>
              </div>
              <button 
                onClick={() => handleExportDataCSV('workouts')}
                className="w-full glass-btn-secondary py-2 mt-4 text-[10px] font-bold flex items-center justify-center gap-1"
              >
                <Download className="w-3.5 h-3.5" /> Download CSV
              </button>
            </div>

            <div className="p-4 bg-white/5 border border-white/5 rounded-2xl flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-white">Nutrition Logs CSV</h4>
                <p className="text-[10px] text-slate-500 mt-1">Download daily calorie, protein, and water counts.</p>
              </div>
              <button 
                onClick={() => handleExportDataCSV('nutrition')}
                className="w-full glass-btn-secondary py-2 mt-4 text-[10px] font-bold flex items-center justify-center gap-1"
              >
                <Download className="w-3.5 h-3.5" /> Download CSV
              </button>
            </div>

            <div className="p-4 bg-white/5 border border-white/5 rounded-2xl flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-white">Biometrics Girth CSV</h4>
                <p className="text-[10px] text-slate-500 mt-1">Download arm, chest, and waist dimensions history.</p>
              </div>
              <button 
                onClick={() => handleExportDataCSV('measurements')}
                className="w-full glass-btn-secondary py-2 mt-4 text-[10px] font-bold flex items-center justify-center gap-1"
              >
                <Download className="w-3.5 h-3.5" /> Download CSV
              </button>
            </div>
          </div>

          {/* Simulator Backup / Restore section */}
          <div className="border-t border-white/5 pt-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3 text-xs max-w-md">
              <AlertTriangle className="w-5 h-5 text-brand-purple shrink-0" />
              <div>
                <h4 className="font-bold text-slate-300">Simulator Database backup</h4>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  Export or import the entire localStorage state (streaks, logged workouts, profiles settings). Safely imports and restores from `forgefit-backup.json`.
                </p>
              </div>
            </div>

            <div className="flex gap-2 shrink-0">
              <button 
                onClick={handleExportBackupJSON}
                className="glass-btn-secondary py-2 text-xs font-bold bg-brand-purple/5 border-brand-purple/20 hover:border-brand-purple/30 text-brand-purple flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" /> Export JSON
              </button>

              <label className="glass-btn-primary py-2 text-xs font-bold flex items-center gap-1 cursor-pointer">
                <Upload className="w-3.5 h-3.5" /> Import JSON
                <input 
                  type="file" 
                  accept=".json"
                  onChange={handleImportBackupJSON}
                  className="hidden" 
                />
              </label>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
