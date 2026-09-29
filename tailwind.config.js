/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        void: '#080612',
        obsidian: '#0E0C22',
        panel: '#17152F',
        violet: {
          DEFAULT: '#9D4EDD',
          soft: '#B57BFF',
        },
        magenta: '#FF007F',
        amber: '#FFBE0B',
        emerald: '#00F5D4',
        ink: '#EDE9FF',
        muted: '#A29DC8',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        body: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        tag: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 24px -4px rgba(157, 78, 221, 0.55)',
        'glow-magenta': '0 0 24px -4px rgba(255, 0, 127, 0.55)',
        'glow-emerald': '0 0 24px -4px rgba(0, 245, 212, 0.5)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};