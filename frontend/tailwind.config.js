/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        galaxy: {
          dark: '#030712',      // Deep space black
          void: '#090a16',      // Cosmic dark blue-grey
          nebula: '#1e1b4b',    // Midnight indigo
        },
        cosmic: {
          purple: '#8b5cf6',    // Neon purple highlight
          pink: '#ec4899',      // Accent pink
          blue: '#3b82f6',      // Space blue
        },
        quantum: {
          cyan: '#06b6d4',      // Glowing cyan
          emerald: '#10b981',   // Successful green
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        outfit: ['Outfit', 'sans-serif'],
      },
      backgroundImage: {
        'cosmic-gradient': 'linear-gradient(to bottom right, #090a16, #1e1b4b, #030712)',
        'cyber-glass': 'linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)',
      },
      boxShadow: {
        'glow-cyan': '0 0 15px rgba(6, 182, 212, 0.25)',
        'glow-purple': '0 0 15px rgba(139, 92, 246, 0.25)',
      }
    },
  },
  plugins: [],
}
