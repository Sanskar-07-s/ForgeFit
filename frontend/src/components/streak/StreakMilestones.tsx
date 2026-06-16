// ForgeFit AI - Streak Milestones Board (v5.0)

import React from 'react';
import { motion } from 'framer-motion';
import { GlassCard } from '../GlassCard';
import { Flame, Award, Shield, Zap, Sparkles, Trophy } from 'lucide-react';

interface Milestone {
  days: number;
  title: string;
  description: string;
  icon: React.ElementType;
  glow: string;
  badgeColor: string;
}

const MILESTONES: Milestone[] = [
  { days: 3,   title: 'Habit Builder',       description: 'Small Cyan Aura unlocked.',   icon: Flame,   glow: 'rgba(34,211,238,0.3)',   badgeColor: '#22D3EE' },
  { days: 7,   title: 'Consistency Spark',   description: 'Active Fire Animation.',     icon: Sparkles, glow: 'rgba(249,115,22,0.35)',  badgeColor: '#F97316' },
  { days: 14,  title: 'Iron Will',            description: 'Golden Aura surrounding badge.', icon: Zap,      glow: 'rgba(234,179,8,0.4)',    badgeColor: '#EAB308' },
  { days: 30,  title: 'Elite Athlete',        description: 'Elite Badge & Confetti trigger.', icon: Shield,   glow: 'rgba(139,92,246,0.45)',  badgeColor: '#8B5CF6' },
  { days: 50,  title: 'Demi-God',             description: 'Legend status & ambient glow.', icon: Award,    glow: 'rgba(236,72,153,0.5)',   badgeColor: '#EC4899' },
  { days: 100, title: 'Fitness Legend',       description: 'Legendary celebrate & badge.', icon: Trophy,   glow: 'rgba(234,179,8,0.6)',    badgeColor: '#EAB308' },
];

interface Props {
  currentStreak: number;
  className?: string;
}

export const StreakMilestones: React.FC<Props> = ({ currentStreak, className = '' }) => {
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Streak Milestones</h3>
          <p className="text-xs text-slate-500 mt-0.5">Track your consistency rewards & badges</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-brand-amber/10 text-brand-amber border border-brand-amber/20">
          <Flame className="w-3.5 h-3.5 fill-brand-amber animate-pulse" />
          <span>Active: {currentStreak} days</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {MILESTONES.map((m, index) => {
          const isUnlocked = currentStreak >= m.days;
          const progressPct = Math.min((currentStreak / m.days) * 100, 100);
          const Icon = m.icon;

          return (
            <GlassCard
              key={m.days}
              className={`p-5 rounded-2xl flex flex-col justify-between relative overflow-hidden ${
                isUnlocked ? '' : 'opacity-60'
              }`}
              glowColor={m.badgeColor}
            >
              {/* Radial bleed behind unlocked icons */}
              {isUnlocked && (
                <div
                  className="absolute inset-0 pointer-events-none opacity-10"
                  style={{
                    background: `radial-gradient(circle at 10% 10%, ${m.glow}, transparent 50%)`,
                  }}
                />
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{
                      background: isUnlocked ? `${m.badgeColor}20` : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${isUnlocked ? `${m.badgeColor}40` : 'rgba(255,255,255,0.1)'}`,
                    }}
                  >
                    <Icon
                      className="w-5 h-5"
                      style={{ color: isUnlocked ? m.badgeColor : '#475569' }}
                    />
                  </div>
                  <span
                    className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md"
                    style={{
                      background: isUnlocked ? `${m.badgeColor}20` : 'rgba(255,255,255,0.05)',
                      color: isUnlocked ? m.badgeColor : '#64748B',
                    }}
                  >
                    {m.days} Days
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                    {m.title}
                    {isUnlocked && <span className="text-brand-emerald text-xs">✓</span>}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">{m.description}</p>
                </div>
              </div>

              {/* Progress gauge */}
              <div className="mt-4 space-y-1">
                <div className="flex justify-between text-[9px] font-semibold text-slate-500">
                  <span>Progress</span>
                  <span>{Math.round(progressPct)}%</span>
                </div>
                <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${progressPct}%`,
                      background: isUnlocked ? m.badgeColor : 'rgba(255,255,255,0.1)',
                      boxShadow: isUnlocked ? `0 0 6px ${m.badgeColor}` : 'none',
                    }}
                  />
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
};
