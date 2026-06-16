// ForgeFit AI — MotionButton v3
// Framer Motion spring-physics button system: primary / secondary / danger

import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';

type Variant = 'primary' | 'secondary' | 'danger' | 'cyan';

interface Props {
  children:   ReactNode;
  variant?:   Variant;
  onClick?:   () => void;
  type?:      'button' | 'submit' | 'reset';
  disabled?:  boolean;
  className?: string;
  size?:      'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  id?:        string;
  ariaLabel?: string;
}

const BASE = 'relative inline-flex items-center justify-center gap-2 font-semibold rounded-xl overflow-hidden select-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2';

const SIZES = {
  sm: 'px-4 py-2 text-xs',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3.5 text-base',
};

const STYLES: Record<Variant, { base: string; hover: string; glow: string }> = {
  primary: {
    base:  'text-white',
    hover: '',
    glow:  '0 0 30px rgba(34,211,238,0.45), 0 0 60px rgba(34,211,238,0.15)',
  },
  secondary: {
    base:  'text-slate-300',
    hover: 'text-white',
    glow:  'none',
  },
  danger: {
    base:  'text-slate-400',
    hover: 'text-brand-rose',
    glow:  '0 0 20px rgba(239,68,68,0.4)',
  },
  cyan: {
    base:  'text-brand-cyan',
    hover: '',
    glow:  '0 0 20px rgba(34,211,238,0.35)',
  },
};

export const MotionButton: React.FC<Props> = ({
  children,
  variant   = 'primary',
  onClick,
  type      = 'button',
  disabled  = false,
  className = '',
  size      = 'md',
  fullWidth = false,
  id,
  ariaLabel,
}) => {
  const spring = { type: 'spring' as const, stiffness: 420, damping: 22, mass: 0.8 };

  const getBackground = (hovered: boolean) => {
    switch (variant) {
      case 'primary':
        return 'linear-gradient(135deg, #22D3EE, #8B5CF6)';
      case 'secondary':
        return hovered ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.06)';
      case 'danger':
        return hovered ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.04)';
      case 'cyan':
        return hovered ? 'rgba(34,211,238,0.15)' : 'rgba(34,211,238,0.08)';
    }
  };

  const getBorder = () => {
    switch (variant) {
      case 'primary':   return 'none';
      case 'secondary': return '1px solid rgba(255,255,255,0.12)';
      case 'danger':    return '1px solid rgba(239,68,68,0.15)';
      case 'cyan':      return '1px solid rgba(34,211,238,0.25)';
    }
  };

  return (
    <motion.button
      type={type}
      id={id}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
      className={`${BASE} ${SIZES[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      style={{ border: getBorder(), background: getBackground(false) }}
      whileHover={disabled ? {} : {
        scale:     1.03,
        boxShadow: STYLES[variant].glow,
        y:         -2,
      }}
      whileTap={disabled ? {} : {
        scale:     0.93,
        y:         0,
        boxShadow: 'none',
      }}
      transition={spring}
    >
      {/* Primary shimmer sweep on hover */}
      {variant === 'primary' && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.12) 50%, transparent 60%)',
            backgroundSize: '200% 100%',
          }}
          initial={{ backgroundPosition: '200% 0' }}
          whileHover={{ backgroundPosition: ['-200% 0', '200% 0'] }}
          transition={{ duration: 0.7, ease: 'easeInOut' }}
        />
      )}

      {/* Content */}
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </motion.button>
  );
};
