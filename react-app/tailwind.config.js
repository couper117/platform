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