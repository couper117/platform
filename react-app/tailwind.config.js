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
        // Montserrat, matching the reference. Self-hosted — never a CDN, the
        // extra RTT is felt on Rwandan mobile networks.
        sans: ['"Montserrat Variable"', 'system-ui', 'sans-serif'],
        display: ['"Montserrat Variable"', 'system-ui', 'sans-serif'],
      },

      // The reference is a display-led design: an 80px hero headline down to
      // 11px labels. `text-base` stays 15px for body copy and data density.
      fontSize: {
        xs: ['11px', { lineHeight: '16px' }],
        sm: ['13px', { lineHeight: '18px' }],
        base: ['15px', { lineHeight: '22px' }],
        lg: ['18px', { lineHeight: '24px' }],
        xl: ['22px', { lineHeight: '28px' }],
        '2xl': ['28px', { lineHeight: '34px' }],
        '3xl': ['36px', { lineHeight: '42px' }],
        '4xl': ['44px', { lineHeight: '48px' }],
        '5xl': ['56px', { lineHeight: '58px' }],
        hero: ['80px', { lineHeight: '1', letterSpacing: '-0.02em' }],
      },

      colors: {
        // ─── Brand — three greens, split by contrast job. See tokens.css ──
        brand: {
          DEFAULT: 'rgb(var(--brand) / <alpha-value>)', // dark-label fills, accents
          strong: 'rgb(var(--brand-strong) / <alpha-value>)', // white-label fills
          text: 'rgb(var(--brand-text) / <alpha-value>)', // green type
          hover: 'rgb(var(--brand-hover) / <alpha-value>)',
          tint: 'rgb(var(--brand-tint) / <alpha-value>)', // hover wash
          on: 'rgb(var(--on-brand) / <alpha-value>)',
          // For surfaces dark in BOTH themes (footer slab, auth panel, photo
          // overlays). Theme-independent by design — see tokens.css.
          bright: 'rgb(var(--brand-bright) / <alpha-value>)',
        },

        // ─── Surfaces ────────────────────────────────────────────────
        page: 'rgb(var(--bg) / <alpha-value>)',
        alt: 'rgb(var(--bg-alt) / <alpha-value>)',
        surface: {
          DEFAULT: 'rgb(var(--surface) / <alpha-value>)',
          2: 'rgb(var(--surface-2) / <alpha-value>)',
          // DEPRECATED — legacy keys so un-swept screens still build. Repointed at
          // tokens rather than left as literals: `surface-3` was #EDEDEF, a grey
          // almost-but-not-quite --hairline, and `surface-dark` was #111120, a
          // blue-black that clashed with the footer's #0F0F0F. Both now match.
          3: 'rgb(var(--hairline) / <alpha-value>)',
          dark: '#0F0F0F',
          dark2: '#17171A',
        },
        hairline: 'rgb(var(--hairline) / <alpha-value>)',

        // ─── Ink ─────────────────────────────────────────────────────
        primary: 'rgb(var(--text) / <alpha-value>)',
        secondary: 'rgb(var(--text-2) / <alpha-value>)',
        tertiary: 'rgb(var(--text-3) / <alpha-value>)',
        disabled: 'rgb(var(--text-disabled) / <alpha-value>)',

        // ─── Semantic ────────────────────────────────────────────────
        live: {
          DEFAULT: 'rgb(var(--live) / <alpha-value>)',
          on: 'rgb(var(--on-live) / <alpha-value>)',
        },
        danger: {
          DEFAULT: 'rgb(var(--danger) / <alpha-value>)',
          text: 'rgb(var(--danger-text) / <alpha-value>)',
          on: 'rgb(var(--on-danger) / <alpha-value>)',
        },
        success: 'rgb(var(--success) / <alpha-value>)',
        club: 'rgb(var(--club) / <alpha-value>)',

        // ─── DEPRECATED legacy palette ───────────────────────────────
        // Still referenced by ~57 un-swept screens. Deleted in the final cleanup.
        //
        // `red` IS DELIBERATELY REMAPPED TO THE BRAND GREEN. It was the old accent
        // and it appears in hundreds of places (`text-red`, `bg-red`, `border-red`).
        // Pointing it at --brand-strong turns every un-swept screen green in one
        // line, so the product reads as one design while the screen-by-screen
        // rewrite continues — instead of looking half-migrated for days.
        //
        // --brand-strong specifically, because it is the one green that works BOTH
        // as text on white (4.55:1) and as a fill under a white label (4.55:1), and
        // the legacy classes use it for both. The raw --brand would fail at 3.11:1.
        red: {
          DEFAULT: 'rgb(var(--brand-strong) / <alpha-value>)',
          dark: 'rgb(var(--brand-hover) / <alpha-value>)',
          glow: 'rgb(var(--brand) / 0.12)',
        },
        gold: { DEFAULT: '#F5A623' },
        green: { DEFAULT: 'rgb(var(--brand-strong) / <alpha-value>)' },
        cyan: { DEFAULT: '#00D4FF' },
        rwanda: { blue: '#00A1DE', yellow: '#FAD201', green: 'rgb(var(--brand) / <alpha-value>)' },
      },

      /**
       * Tailwind's preflight paints EVERY element's border-color with
       * `borderColor.DEFAULT`, which is gray-200 (#E5E7EB) out of the box. That was
       * the single biggest source of mismatch — 725 instances on the landing page of
       * a grey that is near --hairline but not it, so nothing quite lined up.
       *
       * It has to be set HERE and not as a colour named DEFAULT: `borderColor.DEFAULT`
       * resolves from `colors.gray[200]` in the default config, not from `colors.DEFAULT`.
       */
      borderColor: {
        DEFAULT: 'rgb(var(--hairline) / <alpha-value>)',
      },

      // The reference is generously rounded, with a distinct radius per role.
      borderRadius: {
        badge: '4px',
        control: '8px', // dropdown items, small buttons, socials
        input: '12px',
        modal: '16px',
        card: '20px', // the default card
        panel: '30px', // large form / summary panels
        pill: '999px', // buttons, filter chips, badges
      },

      // Depth comes from shadow here, not borders.
      boxShadow: {
        nav: 'var(--shadow-nav)',
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        brand: 'var(--shadow-brand)',
      },

      backdropBlur: {
        nav: '12px',
      },

      spacing: {
        tap: '44px', // minimum interactive target
        row: '68px', // uniform match row height
        rail: '56px', // bottom-nav height
        nav: '72px', // fixed header height — body clears this
      },

      transitionTimingFunction: {
        standard: 'cubic-bezier(0.2, 0, 0.2, 1)',
      },

      animation: {
        'live-pulse': 'livePulse 2s cubic-bezier(0.2,0,0.2,1) infinite',
        shimmer: 'shimmer 1.4s linear infinite',
        'fade-up': 'fadeUp 0.3s cubic-bezier(0.2,0,0.2,1) forwards',
        // Ambient hero zoom, straight from the reference. Long by design: it is
        // a background, not a transition, so the 240ms budget does not apply.
        'slow-zoom': 'slowZoom 20s ease-in-out infinite alternate',
        ticker: 'ticker 60s linear infinite', // DEPRECATED
      },

      keyframes: {
        livePulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.45' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slowZoom: {
          from: { transform: 'scale(1)' },
          to: { transform: 'scale(1.15)' },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
