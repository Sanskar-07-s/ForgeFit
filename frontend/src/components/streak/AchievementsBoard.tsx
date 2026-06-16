// ForgeFit AI - Premium Achievements Board (v5.0)

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from '../GlassCard';
import { MotionButton } from '../MotionButton';
import {
  Award,
  Zap,
  Flame,
  CheckCircle,
  Trophy,
  Activity,
  Calendar,
  Lock,
  Heart,
  Droplet,
  UtensilsCrossed,
  X,
  Target
} from 'lucide-react';
import confetti from 'canvas-confetti';

export interface AchievementItem {
  id: string;
  title: string;
  description: string;
  xp: number;
  icon: React.ElementType;
  color: string;
  check: (stats: UserStats) => boolean;
}

interface UserStats {
  workoutCount: number;
  streak: number;
  sleepDays: number; // days with sleep >= 8h
  proteinDays: number; // days with protein goal met
}

const ACHIEVEMENTS: AchievementItem[] = [
  { id: 'first_workout',     title: 'First Workout',      description: 'Log your first session with ForgeFit AI.', xp: 100, icon: Flame,           color: '#22D3EE', check: (s) => s.workoutCount >= 1 },
  { id: 'first_week',        title: 'First Week',         description: 'Maintain consistency for 7 days in a row.', xp: 250, icon: Calendar,        color: '#10B981', check: (s) => s.streak >= 7 },
  { id: '10_workouts',       title: '10 Workouts',        description: 'Complete 10 total sessions in the library.', xp: 300, icon: Target,          color: '#3B82F6', check: (s) => s.workoutCount >= 10 },
  { id: '25_workouts',       title: '25 Workouts',        description: 'Push through 25 full workouts.',             xp: 500, icon: Activity,        color: '#8B5CF6', check: (s) => s.workoutCount >= 25 },
  { id: '50_workouts',       title: '50 Workouts',        description: 'Hit the half-century mark! 50 sessions.',    xp: 800, icon: Award,           color: '#EC4899', check: (s) => s.workoutCount >= 50 },
  { id: '100_workouts',      title: '100 Workouts',       description: 'Ultimate veteran. 100 workouts complete.',   xp: 1500, icon: Trophy,          color: '#EAB308', check: (s) => s.workoutCount >= 100 },
  { id: 'perfect_week',      title: 'Perfect Week',       description: 'Log workout, diet, hydration target for 7d.',  xp: 400, icon: CheckCircle,     color: '#10B981', check: (s) => s.streak >= 7 },
  { id: 'consistency_king',  title: 'Consistency King',   description: 'Achieve a streak of 14 days or longer.',      xp: 600, icon: Trophy,          color: '#EAB308', check: (s) => s.streak >= 14 },
  { id: 'recovery_master',   title: 'Recovery Master',    description: 'Get 8+ hours of sleep on 5 different days.',  xp: 350, icon: Heart,           color: '#3B82F6', check: (s) => s.sleepDays >= 5 },
  { id: 'protein_champion',  title: 'Protein Champion',   description: 'Hit your protein goals 3 days in a row.',     xp: 300, icon: UtensilsCrossed, color: '#EC4899', check: (s) => s.proteinDays >= 3 },
];

interface Props {
  workoutCount: number;
  streak: number;
  sleepDays: number;
  proteinDays: number;
  className?: string;
}

export const AchievementsBoard: React.FC<Props> = ({
  workoutCount,
  streak,
  sleepDays,
  proteinDays,
  className = '',
}) => {
  const [selected, setSelected] = useState<AchievementItem | null>(null);

  const stats: UserStats = {
    workoutCount,
    streak,
    sleepDays,
    proteinDays,
  };

  const handleShowUnlock = (ach: AchievementItem) => {
    confetti({
      particleCount: 80,
      spread: 60,
      colors: [ach.color, '#fff', '#8B5CF6'],
    });
    setSelected(ach);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Session Achievements</h3>
          <p className="text-xs text-slate-500 mt-0.5">Collect badge achievements by training regularly</p>
        </div>
        <div className="text-xs text-slate-400">
          Unlocked:{' '}
          <strong className="text-brand-cyan">
            {ACHIEVEMENTS.filter((ach) => ach.check(stats)).length}
          </strong>{' '}
          / {ACHIEVEMENTS.length}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {ACHIEVEMENTS.map((ach) => {
          const isUnlocked = ach.check(stats);
          const Icon = ach.icon;

          return (
            <GlassCard
              key={ach.id}
              onClick={isUnlocked ? () => handleShowUnlock(ach) : undefined}
              className={`p-4 rounded-2xl flex flex-col items-center justify-between text-center relative overflow-hidden transition-all duration-300 ${
                isUnlocked ? 'cursor-pointer' : 'opacity-40'
              }`}
              glowColor={ach.color}
            >
              {/* Lock overlay for locked badges */}
              {!isUnlocked && (
                <div className="absolute top-2 right-2 text-slate-700">
                  <Lock className="w-3.5 h-3.5" />
                </div>
              )}

              <div className="flex flex-col items-center space-y-3">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center relative"
                  style={{
                    background: isUnlocked ? `${ach.color}15` : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${isUnlocked ? `${ach.color}30` : 'rgba(255,255,255,0.07)'}`,
                    boxShadow: isUnlocked ? `0 0 15px ${ach.color}20` : 'none',
                  }}
                >
                  <Icon
                    className="w-6 h-6"
                    style={{ color: isUnlocked ? ach.color : '#475569' }}
                  />
                  {isUnlocked && (
                    <motion.div
                      className="absolute inset-0 rounded-[inherit] border border-white/40"
                      animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0, 0.3] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    />
                  )}
                </div>

                <div>
                  <h4 className="font-bold text-white text-xs tracking-tight line-clamp-1">
                    {ach.title}
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2 leading-relaxed px-1">
                    {ach.description}
                  </p>
                </div>
              </div>

              <div
                className="mt-3 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded"
                style={{
                  background: isUnlocked ? `${ach.color}20` : 'rgba(255,255,255,0.05)',
                  color: isUnlocked ? ach.color : '#475569',
                }}
              >
                +{ach.xp} XP
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Unlock Animation modal detail */}
      <AnimatePresence>
        {selected && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ background: 'rgba(7,10,18,0.7)', backdropFilter: 'blur(16px)' }}
            onClick={() => setSelected(null)}
          >
            <motion.div
              className="glass-panel w-full max-w-sm p-6 text-center space-y-6 relative overflow-hidden"
              style={{ border: `1px solid ${selected.color}40` }}
              initial={{ scale: 0.9, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 30, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="absolute inset-0 -z-10 blur-[80px]"
                style={{
                  background: `radial-gradient(circle, ${selected.color}15 0%, transparent 60%)`,
                }}
              />

              <button
                onClick={() => setSelected(null)}
                className="absolute top-4 right-4 text-slate-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex flex-col items-center space-y-3">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center relative animate-pulse"
                  style={{
                    background: `${selected.color}20`,
                    border: `1px solid ${selected.color}50`,
                  }}
                >
                  {React.createElement(selected.icon, {
                    className: 'w-8 h-8',
                    style: { color: selected.color },
                  })}
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-white">{selected.title}</h3>
                  <p className="text-sm text-slate-400 mt-1">{selected.description}</p>
                </div>
              </div>

              <div
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-black"
                style={{
                  background: `${selected.color}20`,
                  color: selected.color,
                  border: `1px solid ${selected.color}40`,
                }}
              >
                <Zap className="w-4 h-4" />
                <span>+{selected.xp} XP CLAIMED</span>
              </div>

              <MotionButton
                onClick={() => setSelected(null)}
                variant="primary"
                fullWidth
              >
                Awesome!
              </MotionButton>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
