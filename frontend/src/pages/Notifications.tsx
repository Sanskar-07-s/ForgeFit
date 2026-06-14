// ForgeFit AI - Notifications Center & Inbox Preferences Page (v4.3)

import React, { useState } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { 
  Bell, 
  Trash2, 
  CheckCheck, 
  Sliders, 
  Flame, 
  Droplet, 
  Dumbbell, 
  Info,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { NotificationCategory } from '@shared/enums';
import { NotificationPreferences } from '../services/notifications';

export default function Notifications() {
  const { 
    inbox, 
    preferences, 
    updatePreferences, 
    markRead, 
    markAllRead, 
    deleteItem 
  } = useNotifications();

  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [showPreferences, setShowPreferences] = useState(false);

  // Group notifications filter
  const filteredInbox = activeCategoryFilter === 'all' 
    ? inbox
    : inbox.filter(n => n.category === activeCategoryFilter);

  const togglePreference = (key: keyof NotificationPreferences) => {
    updatePreferences({
      ...preferences,
      [key]: !preferences[key],
    });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case NotificationCategory.HYDRATION:
        return <Droplet className="w-4 h-4 text-brand-blue" />;
      case NotificationCategory.NUTRITION:
      case NotificationCategory.SUPPLEMENT:
        return <Flame className="w-4 h-4 text-brand-purple" />;
      case NotificationCategory.WORKOUT:
        return <Dumbbell className="w-4 h-4 text-brand-blue" />;
      case NotificationCategory.CHALLENGE:
        return <Calendar className="w-4 h-4 text-brand-cyan" />;
      case NotificationCategory.SYSTEM:
      default:
        return <Bell className="w-4 h-4 text-brand-emerald" />;
    }
  };

  const categories = [
    { code: 'all', label: 'All Alerts' },
    { code: 'workout', label: 'Workouts' },
    { code: 'hydration', label: 'Hydration' },
    { code: 'supplement', label: 'Supplements' },
    { code: 'challenge', label: 'Challenges' },
    { code: 'system', label: 'System' },
  ];

  return (
    <div className="space-y-6">
      
      {/* Title & Preferences toggler */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white">Notification Center</h2>
          <p className="text-xs text-slate-400">View logs of hydration reminders and streak saver triggers</p>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={markAllRead}
            className="glass-btn-secondary flex items-center gap-1.5 text-xs py-2"
          >
            <CheckCheck className="w-4 h-4" /> Mark All Read
          </button>
          
          <button 
            onClick={() => setShowPreferences(!showPreferences)}
            className="glass-btn-primary flex items-center gap-1.5 text-xs py-2"
          >
            <Sliders className="w-4 h-4" /> Config Categories
          </button>
        </div>
      </div>

      {/* Preferences configuration cards */}
      {showPreferences && (
        <div className="glass-panel p-5 rounded-3xl border border-brand-blue/30 bg-[#0c0d16] space-y-4">
          <div>
            <h3 className="font-bold text-sm text-white">Enable/Disable Reminders Individually</h3>
            <p className="text-[11px] text-slate-400">Unchecking a category prevents the engine from generating push alerts.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            {Object.entries(preferences).map(([key, value]) => (
              <button
                key={key}
                onClick={() => togglePreference(key as keyof NotificationPreferences)}
                className={`p-3 rounded-xl border text-center font-bold capitalize transition-all ${
                  value 
                    ? 'border-brand-blue bg-brand-blue/10 text-brand-blue' 
                    : 'border-white/5 bg-white/5 text-slate-500'
                }`}
              >
                {key} Alerts
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Category filter selectors tabs */}
      <div className="flex flex-wrap gap-2 border-b border-white/5 pb-4">
        {categories.map((cat) => (
          <button
            key={cat.code}
            onClick={() => setActiveCategoryFilter(cat.code)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeCategoryFilter === cat.code 
                ? 'bg-brand-blue text-white shadow-glow-blue' 
                : 'bg-white/5 text-slate-400 hover:text-slate-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* List logs */}
      <div className="space-y-3">
        {filteredInbox.map((n) => (
          <div 
            key={n.id} 
            className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
              n.read 
                ? 'border-white/5 bg-white/5 opacity-60' 
                : 'border-brand-blue/25 bg-brand-blue/5 shadow-inner'
            }`}
          >
            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                {getCategoryIcon(n.category)}
              </div>
              <div className="space-y-0.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-white text-sm">{n.title}</span>
                  <span className="text-[9px] text-slate-500 font-medium capitalize">{n.category}</span>
                </div>
                <p className="text-slate-400 leading-relaxed">{n.message}</p>
                <span className="text-[9px] text-slate-500 block pt-1">{new Date(n.created_at).toLocaleTimeString()}</span>
              </div>
            </div>

            <div className="flex gap-1 shrink-0">
              {!n.read && (
                <button 
                  onClick={() => markRead(n.id)}
                  className="p-2 rounded-lg hover:bg-white/5 text-brand-blue font-bold text-xs"
                >
                  Mark Read
                </button>
              )}
              <button 
                onClick={() => deleteItem(n.id)}
                className="p-2 rounded-lg hover:bg-white/5 text-red-400"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {filteredInbox.length === 0 && (
          <div className="p-8 text-center border border-dashed border-white/10 rounded-3xl text-slate-500 font-bold text-xs flex flex-col items-center gap-1.5">
            <AlertCircle className="w-8 h-8" />
            <span>No notifications logged under this filter category.</span>
          </div>
        )}
      </div>

    </div>
  );
}
