/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        terminal: {
          bg: '#0a0a0b',
          panel: '#0f1117',
          border: '#1a1d27',
          accent: '#1e2235',
          hover: '#252a3d',
        },
        whale: {
          green: '#00d68f',
          red: '#ff4757',
          yellow: '#ffd32a',
          blue: '#4fc3f7',
          purple: '#b39ddb',
          orange: '#ff9f43',
          cyan: '#18dcff',
          dim: '#6b7280',
        },
        bloomberg: {
          orange: '#ff6b00',
          amber: '#ffaa00',
          teal: '#00b8a9',
          green: '#00e676',
          red: '#ff1744',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
        terminal: ['IBM Plex Mono', 'Courier New', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'blink': 'blink 1s step-end infinite',
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
        'ticker': 'ticker 30s linear infinite',
        'glow': 'glow 2s ease-in-out infinite',
      },
      keyframes: {
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        slideIn: {
          '0%': { transform: 'translateY(-8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        ticker: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(0, 214, 143, 0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(0, 214, 143, 0.6)' },
        },
      },
      backgroundImage: {
        'grid-pattern': 'linear-gradient(rgba(26,29,39,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(26,29,39,0.5) 1px, transparent 1px)',
      },
      backgroundSize: {
        'grid': '20px 20px',
      },
    },
  },
  plugins: [],
}
