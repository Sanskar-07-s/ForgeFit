// ForgeFit AI — GlassCard v3
// Cursor-reactive 3D tilt card with glow tracking
// Wraps any card content — drop-in replacement for glass-panel divs

import React, { useRef, useState, useCallback, ReactNode } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface GlassCardProps {
  children:    ReactNode;
  className?:  string;
  glowColor?:  string;    // CSS color string, e.g. '#22D3EE'
  intensity?:  number;    // 0–1, default 0.8
  disabled?:   boolean;   // skip tilt effect
  onClick?:    () => void;
  style?:      React.CSSProperties;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  glowColor = '#22D3EE',
  intensity = 0.8,
  disabled = false,
  onClick,
  style = {},
}) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [hovered, setHovered] = useState(false);
  const [glowPos, setGlowPos] = useState({ x: 50, y: 50 });

  // Spring-physics motion values
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);

  const springConfig = { stiffness: 280, damping: 28, mass: 0.6 };
  const rotateX = useSpring(rawX, springConfig);
  const rotateY = useSpring(rawY, springConfig);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const cx   = rect.left + rect.width  / 2;
    const cy   = rect.top  + rect.height / 2;

    // Max tilt degrees scaled by intensity
    const maxTilt = 8 * intensity;
    const rx = ((e.clientY - cy) / (rect.height / 2)) * -maxTilt;
    const ry = ((e.clientX - cx) / (rect.width  / 2)) *  maxTilt;

    rawX.set(rx);
    rawY.set(ry);

    // Glow follows cursor (% position inside card)
    const pctX = Math.round(((e.clientX - rect.left) / rect.width)  * 100);
    const pctY = Math.round(((e.clientY - rect.top)  / rect.height) * 100);
    setGlowPos({ x: pctX, y: pctY });
  }, [disabled, intensity, rawX, rawY]);

  const handleMouseLeave = useCallback(() => {
    rawX.set(0);
    rawY.set(0);
    setHovered(false);
  }, [rawX, rawY]);

  // Parse hex glow for rgba
  const glowRgba = hexToRgba(glowColor, 0.12);
  const borderGlow = hexToRgba(glowColor, hovered ? 0.35 : 0.12);

  return (
    <motion.div
      ref={ref}
      className={`glass-panel relative overflow-hidden ${className}`}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
        perspective: '800px',
        border: `1px solid ${borderGlow}`,
        transition: 'border-color 0.3s ease',
        cursor: onClick ? 'pointer' : undefined,
        ...style,
      }}
      whileHover={disabled ? {} : { y: -5, scale: 1.03 }}
      whileTap={onClick ? { scale: 0.98 } : {}}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
    >
      {/* ── Cursor glow layer ── */}
      {hovered && !disabled && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at ${glowPos.x}% ${glowPos.y}%, ${glowRgba} 0%, transparent 60%)`,
            transition: 'background 0.05s linear',
          }}
        />
      )}

      {/* ── Hover shadow glow ── */}
      <div
        className="absolute inset-0 pointer-events-none rounded-[inherit]"
        style={{
          boxShadow: hovered
            ? `0 20px 60px ${hexToRgba(glowColor, 0.15)}, 0 0 40px ${hexToRgba(glowColor, 0.08)}`
            : '0 8px 32px rgba(0,0,0,0.35)',
          transition: 'box-shadow 0.4s ease',
        }}
      />

      {/* ── Content ── */}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
};

// ── Utility ──────────────────────────────────────────────────
function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
