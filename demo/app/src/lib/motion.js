import { useReducedMotion } from 'framer-motion';

/**
 * Motion vocabulary. One file so timing and easing cannot drift per component.
 *
 * MOTION IS FUNCTIONAL ONLY. Each entry below exists to answer a question the
 * user actually has: did my tap register, what just changed, is this match on
 * right now, is the list still loading. Nothing here is present to look lively.
 *
 * BUDGET: nothing exceeds 240ms. Anything slower than that on a match list reads
 * as lag rather than polish, and this app runs on mid-range Android over mobile
 * data where the main thread is already contended.
 *
 * REDUCED MOTION: index.css neutralises CSS animations globally, but Framer drives
 * transforms in JS and sails straight past that. So every component that animates
 * must gate on `useMotionSafe()` — the CSS rule alone is not enough.
 */

/** Matches `ease-standard` in tailwind.config.js. */
export const EASE = [0.2, 0, 0.2, 1];

export const DUR = {
  fast: 0.12, // press feedback, cross-fade out
  base: 0.18, // entrances, tab moves
  slow: 0.24, // score change — the one moment worth a beat longer
};

/**
 * True when motion is allowed. Prefer this over reading the media query directly
 * so the decision is made the same way everywhere.
 */
export const useMotionSafe = () => !useReducedMotion();

/* ─── list entrance ─────────────────────────────────────────────────── */

/**
 * The list container does two jobs at once: it cross-fades when the filter
 * changes, and it staggers its rows in.
 *
 * Both live in ONE variant set on purpose. Spreading a separate `initial`/`animate`
 * pair alongside `initial="hidden"` silently loses whichever comes first in JSX —
 * which is exactly the bug that made the entrance never run.
 *
 * The stagger is 15ms, so even a 16-row list finishes inside 240ms. It gives the
 * list a reading direction on first paint; anything slower turns a fixture list
 * into a cascade you have to sit through.
 */
export const listStack = (safe) =>
  safe
    ? {
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: { duration: DUR.base, ease: EASE, staggerChildren: 0.015 },
        },
        exit: { opacity: 0, transition: { duration: DUR.fast, ease: EASE } },
      }
    : { hidden: { opacity: 1 }, show: { opacity: 1 }, exit: { opacity: 1 } };

export const listItem = (safe) =>
  safe
    ? {
        hidden: { opacity: 0, y: 6 },
        show: { opacity: 1, y: 0, transition: { duration: DUR.base, ease: EASE } },
      }
    : { hidden: { opacity: 1 }, show: { opacity: 1 } };

/* ─── press feedback ────────────────────────────────────────────────── */

/**
 * A whole 68px row scaling down would visibly nudge its neighbours, so the press
 * is deliberately tiny — just enough to confirm the tap landed on touch, where
 * there is no hover state to do that job.
 */
export const pressable = (safe) => (safe ? { whileTap: { scale: 0.995 } } : {});

/* ─── score change ──────────────────────────────────────────────────── */

/**
 * A goal is the single most important event this product reports, so the number
 * gets a beat. Applied by keying the element on its own value, so it remounts and
 * replays whenever the score actually changes — and never on an unrelated render.
 */
export const scorePop = (safe) =>
  safe
    ? {
        initial: { scale: 1.35, opacity: 0.4 },
        animate: { scale: 1, opacity: 1 },
        transition: { duration: DUR.slow, ease: EASE },
      }
    : {};
