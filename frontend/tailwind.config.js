/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "../shared/**/*.{js,ts,jsx,tsx}",
    "../ai/**/*.{js,ts,jsx,tsx}"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          cyan:    '#22D3EE',   // Neon primary
          purple:  '#8B5CF6',   // Accent violet
          blue:    '#3B82F6',   // Supporting blue
          emerald: '#10B981',   // Success green
          amber:   '#F59E0B',   // Warning amber
          rose:    '#EF4444',   // Danger red
        },
        dark: {
          bg:       '#0B1020',                    // Deep navy background
          card:     'rgba(255,255,255,0.08)',      // Frosted card surface
          glass:    'rgba(255,255,255,0.06)',      // Ultra-light glass layer
          border:   'rgba(255,255,255,0.12)',      // Subtle border
          muted:    'rgba(255,255,255,0.04)',      // Hover state surface
        },
        light: {
          bg:       '#F0F4FF',
          card:     'rgba(255,255,255,0.85)',
          border:   'rgba(0,0,0,0.08)',
        }
      },
      backdropBlur: {
        xs:    '2px',
        glass: '20px',
        heavy: '40px',
      },
      boxShadow: {
        'glass-dark':    '0 8px 32px 0 rgba(0,0,0,0.45)',
        'glass-light':   '0 8px 32px 0 rgba(31,38,135,0.08)',
        'glow-cyan':     '0 0 20px rgba(34,211,238,0.35), 0 0 60px rgba(34,211,238,0.1)',
        'glow-purple':   '0 0 20px rgba(139,92,246,0.35), 0 0 60px rgba(139,92,246,0.1)',
        'glow-blue':     '0 0 20px rgba(59,130,246,0.35)',
        'glow-emerald':  '0 0 20px rgba(16,185,129,0.35)',
        'lift':          '0 20px 60px rgba(0,0,0,0.4)',
        'card-hover':    '0 12px 40px rgba(34,211,238,0.08)',
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
        '4xl': '32px',
      },
      animation: {
        'pulse-slow':   'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'spin-slow':    'spin 8s linear infinite',
        'fade-in':      'fadeIn 0.4s ease-out forwards',
        'fade-up':      'fadeUp 0.5s ease-out forwards',
        'slide-up':     'slideUp 0.35s ease-out forwards',
        'typing':       'typing 1.2s ease-in-out infinite',
        'glow-pulse':   'glowPulse 2s ease-in-out infinite',
        'scale-in':     'scaleIn 0.3s ease-out forwards',
        'shimmer':      'shimmer 1.5s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%':   { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)',    opacity: '1' },
        },
        typing: {
          '0%, 60%, 100%': { transform: 'translateY(0)' },
          '30%':            { transform: 'translateY(-6px)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(34,211,238,0.2)' },
          '50%':       { boxShadow: '0 0 40px rgba(34,211,238,0.5)' },
        },
        scaleIn: {
          '0%':   { opacity: '0', transform: 'scale(0.92)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      fontFamily: {
        heading: ['Outfit', 'sans-serif'],
        body:    ['Inter', 'sans-serif'],
      },
      spacing: {
        'safe-bottom': 'env(safe-area-inset-bottom)',
      }
    },
  },
  plugins: [],
}
