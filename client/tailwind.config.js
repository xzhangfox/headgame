/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Apple dark system surfaces
        apple: {
          bg:      '#000000',
          'bg-2':  '#1c1c1e',
          'bg-3':  '#2c2c2e',
          'bg-4':  '#3a3a3c',
          'bg-5':  '#48484a',
          label:   '#ffffff',
          'label-2': 'rgba(235,235,245,0.60)',
          'label-3': 'rgba(235,235,245,0.30)',
          'label-4': 'rgba(235,235,245,0.16)',
          separator: 'rgba(84,84,88,0.65)',
          fill:    'rgba(120,120,128,0.20)',
          'fill-2':'rgba(120,120,128,0.16)',
          'fill-3':'rgba(118,118,128,0.12)',
        },
        // Gold — the single accent
        gold: {
          50:  '#fffde7',
          100: '#fff9c4',
          200: '#fff176',
          300: '#ffe566',
          400: '#ffc107',
          500: '#d4af37',
          600: '#c79100',
          700: '#a07000',
          800: '#7a5200',
          900: '#4d3200',
        },
        neon: {
          gold:  '#ffd700',
          green: '#30d158',   // Apple system green
          red:   '#ff453a',   // Apple system red
        },
      },
      fontFamily: {
        sans: [
          '-apple-system', 'BlinkMacSystemFont',
          '"SF Pro Text"', '"SF Pro Display"',
          '"Helvetica Neue"', 'Arial', 'sans-serif',
        ],
        display: [
          '-apple-system', 'BlinkMacSystemFont',
          '"SF Pro Display"', '"SF Pro Text"',
          '"Helvetica Neue"', 'Arial', 'sans-serif',
        ],
      },
      letterSpacing: {
        tightest: '-0.03em',
        tighter:  '-0.022em',
        tight:    '-0.015em',
        normal:   '0em',
        wide:     '0.01em',
      },
      lineHeight: {
        headline: '1.07',
        title:    '1.10',
        body:     '1.47',
        relaxed:  '1.6',
      },
      borderRadius: {
        pill:  '9999px',
        card:  '18px',
        inner: '12px',
        sm:    '8px',
        xs:    '6px',
      },
      boxShadow: {
        card:    '0 3px 30px rgba(0,0,0,0.55)',
        'card-lg':'0 8px 48px rgba(0,0,0,0.7)',
        gold:    '0 0 0 2px rgba(212,175,55,0.6)',
        'gold-glow': '0 0 20px rgba(212,175,55,0.35)',
        nav:     '0 1px 0 rgba(84,84,88,0.25)',
      },
      backgroundImage: {
        'gold-btn': 'linear-gradient(180deg, #f5c842 0%, #c79100 100%)',
        'gold-btn-hover': 'linear-gradient(180deg, #ffe566 0%, #d4af37 100%)',
      },
      backdropBlur: {
        nav: '20px',
      },
    },
  },
  plugins: [],
};
