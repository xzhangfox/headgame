/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        gold: {
          50:  '#fffde7',
          100: '#fff9c4',
          200: '#fff176',
          300: '#ffe566',
          400: '#ffc107',
          500: '#e6ac00',
          600: '#c79100',
          700: '#a07000',
          800: '#7a5200',
          900: '#4d3200',
        },
        neon: {
          gold:   '#ffd700',
          amber:  '#ff9900',
          green:  '#39ff14',
          red:    '#ff2d2d',
        },
      },
      fontFamily: {
        sans:    ['"Noto Sans SC"', '"Inter"', 'system-ui', 'sans-serif'],
        display: ['"Noto Sans SC"', '"Poppins"', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'game-gradient': 'linear-gradient(135deg, #080600 0%, #110e00 50%, #080800 100%)',
        'card-gradient': 'linear-gradient(135deg, rgba(255,210,0,0.06) 0%, rgba(255,210,0,0.01) 100%)',
        'glow-gold':     'radial-gradient(ellipse at center, rgba(212,175,55,0.25) 0%, transparent 70%)',
      },
      boxShadow: {
        glow:        '0 0 20px rgba(212,175,55,0.45), 0 0 40px rgba(212,175,55,0.15)',
        'glow-lg':   '0 0 35px rgba(212,175,55,0.6),  0 0 70px rgba(212,175,55,0.25)',
        'glow-amber':'0 0 20px rgba(255,153,0,0.5),   0 0 40px rgba(255,153,0,0.2)',
        glass:       '0 8px 32px rgba(0,0,0,0.6)',
      },
      animation: {
        'float':       'float 3s ease-in-out infinite',
        'pulse-glow':  'pulseGlow 2s ease-in-out infinite',
        'shake':       'shake 0.5s ease-in-out',
        'bounce-in':   'bounceIn 0.6s cubic-bezier(0.68,-0.55,0.265,1.55)',
        'slide-up':    'slideUp 0.4s ease-out',
        'spin-slow':   'spin 8s linear infinite',
      },
      keyframes: {
        float: {
          '0%,100%': { transform: 'translateY(0px)' },
          '50%':     { transform: 'translateY(-10px)' },
        },
        pulseGlow: {
          '0%,100%': { boxShadow: '0 0 20px rgba(212,175,55,0.35)' },
          '50%':     { boxShadow: '0 0 45px rgba(212,175,55,0.8), 0 0 90px rgba(212,175,55,0.25)' },
        },
        shake: {
          '0%,100%': { transform: 'translateX(0)' },
          '25%':     { transform: 'translateX(-8px)' },
          '75%':     { transform: 'translateX(8px)' },
        },
        bounceIn: {
          '0%':   { transform: 'scale(0)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        slideUp: {
          '0%':   { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',    opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
