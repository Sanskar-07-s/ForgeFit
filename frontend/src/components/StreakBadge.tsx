// ForgeFit AI — StreakBadge v3
// Full gamification engine: idle flicker, increment bounce, milestone glow, loss state

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimate } from 'framer-motion';
import { MilestoneToast } from './MilestoneToast';

const MILESTONE_DAYS = [3, 7, 14, 30, 100];

type StreakState = 'idle' | 'increment' | 'milestone' | 'loss';

interface Props {
  streak:    number;
  isAtRisk?: boolean;  // true if user hasn't logged anything yet today and streak could break
  className?: string;
}

// ── Determine milestone level styling ─────────────────────
function getMilestoneLevel(streak: number): { color: string; glow: string; label: string } {
  if (streak >= 100) return { color: '#EAB308', glow: 'rgba(234,179,8,0.6)',   label: 'LEGENDARY' };
  if (streak >=  30) return { color: '#8B5CF6', glow: 'rgba(139,92,246,0.5)',  label: 'Champion'  };
  if (streak >=  14) return { color: '#EAB308', glow: 'rgba(234,179,8,0.4)',   label: 'Golden'    };
  if (streak >=   7) return { color: '#F97316', glow: 'rgba(249,115,22,0.5)',  label: 'On Fire'   };
  if (streak >=   3) return { color: '#22D3EE', glow: 'rgba(34,211,238,0.4)',  label: 'Streak'    };
  return               { color: '#94A3B8', glow: 'rgba(148,163,184,0.2)',  label: 'Streak'    };
}

export const StreakBadge: React.FC<Props> = ({ streak, isAtRisk = false, className = '' }) => {
  const [scope, animate] = useAnimate();
  const [showMilestone, setShowMilestone] = useState(false);
  const prevStreakRef = useRef(streak);
  const [displayStreak, setDisplayStreak] = useState(streak);
  const [state, setState] = useState<StreakState>('idle');

  const level = getMilestoneLevel(streak);
  const isLegendary = streak >= 100;

  // ── Watch for streak increment ─────────────────────────
  useEffect(() => {
    const prev = prevStreakRef.current;
    if (streak > prev) {
      prevStreakRef.current = streak;
      setState('increment');

      // Bounce sequence
      animate(scope.current, { scale: [1, 1.4, 0.92, 1.12, 1] }, { duration: 0.6, ease: 'easeInOut' });

      setTimeout(() => setDisplayStreak(streak), 200);

      // Check milestone
      if (MILESTONE_DAYS.includes(streak)) {
        setTimeout(() => {
          setState('milestone');
          setShowMilestone(true);
        }, 700);
      } else {
        setTimeout(() => setState('idle'), 800);
      }
    }
  }, [streak]);

  // ── Loss idle shake ────────────────────────────────────
  useEffect(() => {
    if (isAtRisk) {
      setState('loss');
    }
  }, [isAtRisk]);

  // ── Legendary page glow ────────────────────────────────
  useEffect(() => {
    if (isLegendary) {
      document.documentElement.style.setProperty('--legendary-active', '1');
    }
    return () => {
      document.documentElement.style.setProperty('--legendary-active', '0');
    };
  }, [isLegendary]);

  const isMilestone = MILESTONE_DAYS.includes(streak) && streak >= 3;

  return (
    <>
      {/* ── Milestone Toast Overlay ── */}
      <AnimatePresence>
        {showMilestone && (
          <MilestoneToast streak={streak} onClose={() => { setShowMilestone(false); setState('idle'); }} />
        )}
      </AnimatePresence>

      {/* ── Badge container ── */}
      <div className={`relative inline-flex items-center gap-2.5 select-none ${className}`}>

        {/* ── Outer glow ring (milestones only) ── */}
        {isMilestone && (
          <motion.div
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{ boxShadow: `0 0 30px ${level.glow}, 0 0 60px ${level.glow.replace('0.4', '0.15')}` }}
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}

        {/* ── Main badge ── */}
        <motion.div
          ref={scope}
          className="relative flex items-center gap-2 px-4 py-2 rounded-2xl cursor-default"
          style={{
            background: state === 'loss'
              ? 'rgba(239,68,68,0.1)'
              : isMilestone
                ? `linear-gradient(135deg, ${level.glow.replace(/[\d.]+\)$/, '0.15)')}, rgba(255,255,255,0.04))`
                : 'rgba(255,255,255,0.06)',
            border: state === 'loss'
              ? '1px solid rgba(239,68,68,0.4)'
              : `1px solid ${isMilestone ? level.glow.replace(/[\d.]+\)$/, '0.3)') : 'rgba(255,255,255,0.1)'}`,
          }}
          animate={state === 'loss' ? { x: [0, -4, 4, -3, 3, -2, 2, 0] } : {}}
          transition={state === 'loss' ? { duration: 0.5, ease: 'easeInOut' } : {}}
        >
          {/* Flame icon — animated */}
          <motion.span
            className="text-xl leading-none"
            style={{ filter: `drop-shadow(0 0 8px ${level.color})` }}
            animate={
              state === 'idle'
                ? { scale: [1, 1.05, 0.97, 1.03, 1], rotate: [0, 1, -1, 0.5, 0] }
                : state === 'loss'
                  ? { filter: ['drop-shadow(0 0 8px #EF4444)', 'drop-shadow(0 0 2px #EF4444)', 'drop-shadow(0 0 8px #EF4444)'] }
                  : {}
            }
            transition={{
              duration:  state === 'idle' ? 3.5 : 1,
              repeat:    state === 'idle' ? Infinity : 0,
              ease:      'easeInOut',
              repeatType:'mirror',
            }}
          >
            {state === 'loss' ? '❄️' : streak >= 30 ? '👑' : streak >= 14 ? '⭐' : streak >= 7 ? '🔥🔥' : '🔥'}
          </motion.span>

          {/* ── Streak number ── */}
          <div className="flex flex-col leading-none">
            <AnimatePresence mode="popLayout">
              <motion.span
                key={displayStreak}
                className="font-black text-lg text-white leading-none"
                style={{ color: state === 'loss' ? '#EF4444' : level.color, textShadow: `0 0 12px ${level.glow}` }}
                initial={{ y: -12, opacity: 0 }}
                animate={{ y: 0,   opacity: 1 }}
                exit={{   y:  12, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 380, damping: 22 }}
              >
                {displayStreak}
              </motion.span>
            </AnimatePresence>
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mt-0.5">
              {state === 'loss' ? 'At Risk!' : `${level.label}`}
            </span>
          </div>

          {/* ── Milestone label chip ── */}
          {isMilestone && state !== 'loss' && (
            <motion.span
              className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-lg ml-0.5"
              style={{ background: level.glow.replace(/[\d.]+\)$/, '0.2)'), color: level.color }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring' }}
            >
              ✦ {level.label}
            </motion.span>
          )}

          {/* ── At risk warning ── */}
          {state === 'loss' && (
            <motion.span
              className="text-[9px] font-bold text-brand-rose ml-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 1.8, repeat: Infinity }}
            >
              Log to save!
            </motion.span>
          )}
        </motion.div>

        {/* ── Floating ember particles (streak ≥ 7) ── */}
        {streak >= 7 && state !== 'loss' && (
          <div className="absolute inset-0 pointer-events-none overflow-visible" aria-hidden="true">
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 rounded-full"
                style={{
                  background: level.color,
                  left:  '50%',
                  bottom: '0%',
                  boxShadow: `0 0 4px ${level.color}`,
                }}
                animate={{
                  y:       [0, -30 - i * 15],
                  x:       [0, (i - 1) * 12],
                  opacity: [0, 0.8, 0],
                  scale:   [0.5, 1, 0.3],
                }}
                transition={{
                  duration:   1.8 + i * 0.4,
                  repeat:     Infinity,
                  delay:      i * 0.6,
                  ease:       'easeOut',
                }}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
};
