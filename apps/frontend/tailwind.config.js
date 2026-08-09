/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['"Bebas Neue"', 'sans-serif'],
        body: ['"DM Sans"', 'sans-serif'],
      },
      colors: {
        red: { DEFAULT: '#E8002D', dark: '#C40024', glow: 'rgba(232,0,45,0.12)' },
        gold: { DEFAULT: '#F5A623' },
        green: { DEFAULT: '#00C853' },
        cyan: { DEFAULT: '#00D4FF' },
        surface: {
          DEFAULT: '#FFFFFF',
          2: '#F7F7F8',
          3: '#EDEDEF',
          dark: '#111120',
          dark2: '#16162A',
        },
        rwanda: {
          blue: '#00A1DE',
          yellow: '#FAD201',
          green: '#20603D',
        }
      },
      animation: {
        'live-pulse': 'pulse 1.2s ease-in-out infinite',
        'ticker': 'ticker 60s linear infinite',
        'score-pop': 'scorePop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      keyframes: {
        scorePop: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.35)', color: '#E8002D' },
          '100%': { transform: 'scale(1)' },
        }
      }
    },
  },
  plugins: [require("tailwindcss-animate")],
}
