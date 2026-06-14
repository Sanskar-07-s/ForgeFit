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
          blue: '#2563eb',    // Electric Blue Primary
          purple: '#7c3aed',  // Accent purple
          cyan: '#0891b2',    // Accent cyan
          emerald: '#059669', // Accent emerald
        },
        dark: {
          bg: '#090a0f',      // Pitch dark background
          card: 'rgba(17, 18, 28, 0.65)',
          border: 'rgba(255, 255, 255, 0.08)',
        },
        light: {
          bg: '#f8fafc',      // Light clean grey
          card: 'rgba(255, 255, 255, 0.75)',
          border: 'rgba(0, 0, 0, 0.06)',
        }
      },
      backdropBlur: {
        xs: '2px',
        glass: '16px',
      },
      boxShadow: {
        'glass-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glass-light': '0 8px 32px 0 rgba(31, 38, 135, 0.08)',
        'glow-blue': '0 0 15px rgba(37, 99, 235, 0.35)',
        'glow-purple': '0 0 15px rgba(124, 58, 237, 0.35)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 8s linear infinite',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}
