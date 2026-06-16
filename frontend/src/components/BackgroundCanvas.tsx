// ForgeFit AI — BackgroundCanvas v3
// Animated ambient layer: floating blobs + SVG noise + vignette
// Fixed, pointer-events-none, behind everything (z-index: -1)

import React, { useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';

// ── SVG Noise texture (inlined, no network request) ───────
const NOISE_SVG = `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'>
  <filter id='noise'>
    <feTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/>
    <feColorMatrix type='saturate' values='0'/>
  </filter>
  <rect width='200' height='200' filter='url(#noise)' opacity='1'/>
</svg>`;

const NOISE_URL = `url("data:image/svg+xml,${encodeURIComponent(NOISE_SVG)}")`;

export const BackgroundCanvas: React.FC = () => {
  const { theme } = useTheme();
  const dark = theme === 'dark';

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 overflow-hidden pointer-events-none select-none"
      style={{ zIndex: 0 }}
    >
      {/* ── Base background ── */}
      <div
        className="absolute inset-0 transition-colors duration-700"
        style={{
          background: dark
            ? 'linear-gradient(160deg, #070A12 0%, #0B1020 50%, #0D0A1E 100%)'
            : 'linear-gradient(160deg, #F0F4FF 0%, #F7F8FC 60%, #EEF1FA 100%)',
        }}
      />

      {/* ── Blob 1 — cyan top-left ── */}
      <div
        className="absolute rounded-full blob-1"
        style={{
          width: '600px',
          height: '600px',
          left: '-150px',
          top: '-100px',
          background: dark
            ? 'radial-gradient(circle, rgba(34,211,238,0.12) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(34,211,238,0.08) 0%, transparent 70%)',
          filter: 'blur(60px)',
          animation: 'blobDrift1 18s ease-in-out infinite',
        }}
      />

      {/* ── Blob 2 — purple bottom-right ── */}
      <div
        className="absolute rounded-full"
        style={{
          width: '700px',
          height: '700px',
          right: '-200px',
          bottom: '-150px',
          background: dark
            ? 'radial-gradient(circle, rgba(139,92,246,0.10) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 70%)',
          filter: 'blur(80px)',
          animation: 'blobDrift2 22s ease-in-out infinite',
        }}
      />

      {/* ── Blob 3 — mix center-right ── */}
      <div
        className="absolute rounded-full"
        style={{
          width: '450px',
          height: '450px',
          right: '20%',
          top: '30%',
          background: dark
            ? 'radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(99,102,241,0.05) 0%, transparent 70%)',
          filter: 'blur(60px)',
          animation: 'blobDrift3 25s ease-in-out infinite',
        }}
      />

      {/* ── Noise texture overlay ── */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: NOISE_URL,
          backgroundRepeat: 'repeat',
          opacity: dark ? 0.04 : 0.025,
          mixBlendMode: 'overlay',
        }}
      />

      {/* ── Vignette edges ── */}
      <div
        className="absolute inset-0"
        style={{
          background: dark
            ? 'radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(7,10,18,0.7) 100%)'
            : 'radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(234,237,248,0.6) 100%)',
        }}
      />
    </div>
  );
};
