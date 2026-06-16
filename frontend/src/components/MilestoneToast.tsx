// ForgeFit AI — MilestoneToast v3
// Full-screen animated celebration overlay for streak milestones

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Award, X, Zap } from 'lucide-react';

interface MilestoneConfig {
  emoji:    string;
  title:    string;
  subtitle: string;
  xp:       number;
  gradient: string;
  color:    string;
}

const MILESTONES: Record<number, MilestoneConfig> = {
  3: {
    emoji:    '🔥',
    title:    '3-Day Streak!',
    subtitle: 'You\'re building a habit. Keep the fire alive!',
    xp:       50,
    gradient: 'linear-gradient(135deg, rgba(34,211,238,0.15), rgba(34,211,238,0.05))',
    color:    '#22D3EE',
  },
  7: {
    emoji:    '🔥🔥',
    title:    'One Week Strong!',
    subtitle: 'Seven days of consistency. You\'re unstoppable.',
    xp:       150,
    gradient: 'linear-gradient(135deg, rgba(249,115,22,0.2), rgba(245,158,11,0.1))',
    color:    '#F97316',
  },
  14: {
    emoji:    '✨',
    title:    'Golden Fortnight!',
    subtitle: 'Two weeks of pure dedication. Golden aura unlocked.',
    xp:       300,
    gradient: 'linear-gradient(135deg, rgba(234,179,8,0.2), rgba(245,158,11,0.15))',
    color:    '#EAB308',
  },
  30: {
    emoji:    '🏆',
    title:    '30-Day Champion!',
    subtitle: 'One month of excellence. Badge unlocked forever.',
    xp:       750,
    gradient: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(34,211,238,0.1))',
    color:    '#8B5CF6',
  },
  100: {
    emoji:    '👑',
    title:    'LEGENDARY — 100 Days!',
    subtitle: 'You have achieved what less than 1% of users ever do.',
    xp:       2000,
    gradient: 'linear-gradient(135deg, rgba(234,179,8,0.3), rgba(239,68,68,0.15), rgba(139,92,246,0.2))',
    color:    '#EAB308',
  },
};

interface Props {
  streak:   number;
  onClose:  () => void;
}

export const MilestoneToast: React.FC<Props> = ({ streak, onClose }) => {
  const config = MILESTONES[streak];
  if (!config) return null;

  useEffect(() => {
    // Fire confetti burst
    const isLegendary = streak === 100;
    const fireConfetti = () => {
      confetti({
        particleCount: isLegendary ? 300 : 100,
        spread:        isLegendary ? 180 : 80,
        origin:        { y: 0.5 },
        colors:        ['#22D3EE', '#8B5CF6', '#EAB308', '#10B981', '#F97316'],
        scalar:        isLegendary ? 1.4 : 1.0,
      });
      if (isLegendary) {
        // Second burst for legendary
        setTimeout(() => confetti({ particleCount: 200, spread: 360, origin: { x: 0.3, y: 0.3 }, colors: ['#EAB308', '#fff'] }), 400);
        setTimeout(() => confetti({ particleCount: 200, spread: 360, origin: { x: 0.7, y: 0.7 }, colors: ['#8B5CF6', '#22D3EE'] }), 800);
      }
    };
    fireConfetti();

    // Auto-dismiss after 5s (4s for non-legendary)
    const timer = setTimeout(onClose, streak === 100 ? 6000 : 4500);
    return () => clearTimeout(timer);
  }, [streak, onClose]);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[999] flex items-end justify-center p-4 pb-8 md:items-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{ background: 'rgba(7,10,18,0.7)', backdropFilter: 'blur(16px)' }}
        onClick={onClose}
      >
        {/* ── The toast card ── */}
        <motion.div
          className="relative w-full max-w-sm rounded-3xl overflow-hidden"
          style={{ background: config.gradient, border: `1px solid ${hexToRgba(config.color, 0.3)}` }}
          initial={{ y: 80, scale: 0.85, opacity: 0 }}
          animate={{ y: 0,  scale: 1,    opacity: 1 }}
          exit={{   y: 80, scale: 0.85, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 26 }}
          onClick={e => e.stopPropagation()}
        >
          {/* Glow bleed behind card */}
          <div
            className="absolute inset-0 -z-10 blur-[60px] scale-110"
            style={{ background: config.gradient, opacity: 0.5 }}
          />

          {/* ── Shimmer line at top ── */}
          <div className="h-px w-full" style={{ background: `linear-gradient(90deg, transparent, ${config.color}, transparent)` }} />

          <div className="p-8 text-center space-y-4">
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Emoji */}
            <motion.div
              className="text-6xl"
              initial={{ scale: 0.5, rotate: -10 }}
              animate={{ scale: 1,   rotate: 0   }}
              transition={{ delay: 0.15, type: 'spring', stiffness: 300, damping: 18 }}
            >
              {config.emoji}
            </motion.div>

            {/* Title */}
            <div>
              <motion.h2
                className="text-2xl font-black text-white"
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0,  opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {config.title}
              </motion.h2>
              <motion.p
                className="text-sm text-slate-400 mt-1"
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0,  opacity: 1 }}
                transition={{ delay: 0.28 }}
              >
                {config.subtitle}
              </motion.p>
            </div>

            {/* XP reward badge */}
            <motion.div
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-white text-sm"
              style={{ background: hexToRgba(config.color, 0.2), border: `1px solid ${hexToRgba(config.color, 0.4)}`, boxShadow: `0 0 20px ${hexToRgba(config.color, 0.3)}` }}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1,   opacity: 1 }}
              transition={{ delay: 0.35, type: 'spring', stiffness: 280, damping: 20 }}
            >
              <Zap className="w-4 h-4" style={{ color: config.color }} />
              <span style={{ color: config.color }}>+{config.xp} XP Awarded</span>
            </motion.div>

            {/* Streak badge */}
            <motion.div
              className="flex items-center justify-center gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Award className="w-4 h-4 text-slate-500" />
              <span className="text-xs text-slate-500 font-medium">{streak} Day Streak Badge Unlocked</span>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
