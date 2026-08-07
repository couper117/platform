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
        // One variable font serves the whole system. Body is the natural width;
        // display is the same file at wdth 125% ("Archivo Expanded").
        sans: ['"Archivo Variable"', 'system-ui', 'sans-serif'],
        display: [
          ['"Archivo Variable"', 'system-ui', 'sans-serif'],
          { fontVariationSettings: '"wdth" 125' },
        ],
      },

      // The whole type scale: 28 / 22 / 18 / 15 / 13 / 11, body 15.
      // These override Tailwind's defaults for the same keys, so existing
      // `text-sm` / `text-lg` usages snap onto the scale automatically.
      fontSize: {
        xs: ['11px', { lineHeight: '16px' }],
        sm: ['13px', { lineHeight: '18px' }],
        base: ['15px', { lineHeight: '22px' }],
        lg: ['18px', { lineHeight: '24px' }],
        xl: ['22px', { lineHeight: '28px' }],
        '2xl': ['28px', { lineHeight: '32px' }],
      },

      colors: {
        // ─── Design tokens (src/styles/tokens.css) ──────────────────
        // `--bg` is exposed as `page` so it reads as `bg-page`, not `bg-bg`.
        page: 'rgb(var(--bg) / <alpha-value>)',
        surface: {
          DEFAULT: 'rgb(var(--surface) / <alpha-value>)',
          2: 'rgb(var(--surface-2) / <alpha-value>)',
          // DEPRECATED — legacy keys kept so un-swept screens still build.
          3: '#EDEDEF',
          dark: '#111120',
          dark2: '#16162A',
        },
        hairline: 'rgb(var(--hairline) / <alpha-value>)',
        primary: 'rgb(var(--text) / <alpha-value>)',
        secondary: 'rgb(var(--text-2) / <alpha-value>)',
        // Metadata — safe at 11px. For disabled/decorative only, use `disabled`.
        tertiary: 'rgb(var(--text-3) / <alpha-value>)',
        disabled: 'rgb(var(--text-disabled) / <alpha-value>)',
        live: {
          // `bg-live` fill + `text-live-on` label, or `text-live` as text.
          DEFAULT: 'rgb(var(--live) / <alpha-value>)',
          on: 'rgb(var(--on-live) / <alpha-value>)',
        },
        danger: {
          // `bg-danger` fills/borders — NOT a text colour on dark. For red text
          // use `text-danger-text`; for a label on a danger fill, `text-danger-on`.
          DEFAULT: 'rgb(var(--danger) / <alpha-value>)',
          text: 'rgb(var(--danger-text) / <alpha-value>)',
          on: 'rgb(var(--on-danger) / <alpha-value>)',
        },
        success: 'rgb(var(--success) / <alpha-value>)',
        // Club identity comes from runtime data — set `--club` inline per row.
        club: 'rgb(var(--club) / <alpha-value>)',

        // ─── DEPRECATED legacy palette ──────────────────────────────
        // Still referenced by ~57 un-swept files. Each phase removes usages;
        // the final cleanup commit deletes this block. Do not add new uses.
        red: { DEFAULT: '#E8002D', dark: '#C40024', glow: 'rgba(232,0,45,0.12)' },
        gold: { DEFAULT: '#F5A623' },
        green: { DEFAULT: '#00C853' },
        cyan: { DEFAULT: '#00D4FF' },
        rwanda: {
          blue: '#00A1DE',
          yellow: '#FAD201',
          green: '#20603D',
        },
      },

      borderRadius: {
        control: '4px', // inputs, buttons
        card: '8px', // cards, rows, panels
        pill: '999px', // badges, status pills
      },

      // Minimum tap target (44px) and the fixed row/rail metrics the layout
      // rules depend on, named so screens can't drift from them.
      spacing: {
        tap: '44px', // minimum interactive target
        row: '68px', // uniform match row height
        rail: '56px', // status rail width / bottom-nav height
      },

      transitionTimingFunction: {
        // One easing for the whole system. Motion is functional only.
        standard: 'cubic-bezier(0.2, 0, 0.2, 1)',
      },

      animation: {
        'live-pulse': 'livePulse 2s var(--tw-ease, cubic-bezier(0.2,0,0.2,1)) infinite',
        'score-pop': 'scorePop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        // DEPRECATED — used by the un-swept ticker markup.
        ticker: 'ticker 60s linear infinite',
      },

      keyframes: {
        livePulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.35' },
        },
        scorePop: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.35)' },
          '100%': { transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
