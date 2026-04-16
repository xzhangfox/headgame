/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0e7ff',
          100: '#dcc5ff',
          200: '#c49dff',
          300: '#a96eff',
          400: '#8b3dff',
          500: '#7c22ff',
          600: '#6f0af5',
          700: '#5d00d6',
          800: '#4c00af',
          900: '#3b0088',
        },
        neon: {
          pink: '#ff2d78',
          cyan: '#00e5ff',
          green: '#39ff14',
          yellow: '#ffe600',
          orange: '#ff6a00',
        },
      },
      fontFamily: {
        sans: ['"Noto Sans SC"', '"Inter"', 'system-ui', 'sans-serif'],
        display: ['"Noto Sans SC"', '"Poppins"', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'game-gradient': 'linear-gradient(135deg, #0f0c29 0%, #1a0533 50%, #0d1b2a 100%)',
        'card-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
        'glow-purple': 'radial-gradient(ellipse at center, rgba(124,34,255,0.3) 0%, transparent 70%)',
      },
      boxShadow: {
        glow: '0 0 20px rgba(124,34,255,0.5), 0 0 40px rgba(124,34,255,0.2)',
        'glow-pink': '0 0 20px rgba(255,45,120,0.5), 0 0 40px rgba(255,45,120,0.2)',
        'glow-cyan': '0 0 20px rgba(0,229,255,0.5)',
        glass: '0 8px 32px rgba(0,0,0,0.4)',
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'shake': 'shake 0.5s ease-in-out',
        'bounce-in': 'bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'slide-up': 'slideUp 0.4s ease-out',
        'spin-slow': 'spin 8s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(124,34,255,0.4)' },
          '50%': { boxShadow: '0 0 40px rgba(124,34,255,0.8), 0 0 80px rgba(124,34,255,0.3)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-8px)' },
          '75%': { transform: 'translateX(8px)' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
