import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import SportBounce from './SportBounce';
import { useMotionSafe } from '../../lib/motion';

/**
 * Cold-start curtain.
 *
 * THE BALL LEADS, NOT THE WORDMARK. This screen used to be pure typography — "Rwa"
 * set solid and "Sport" drawn as outlined text that filled left to right. Handsome,
 * but nothing about it was sport, and it spoke a language used nowhere else in the
 * product. Loader already declares the rule: a product should have ONE loading
 * gesture, and here it is the bouncing ball that changes sport. The splash was the
 * only place not saying it, so now it does — same component, same clock, just
 * larger. Someone who waits here once recognises every route wait afterwards.
 *
 * THE FLOOR IS LOAD-BEARING, not decoration. SportBounce draws its own contact
 * shadow in `bg-primary/20`, which is tuned for the light auth screens and is
 * effectively invisible on a near-black panel. Without a ground plane the ball
 * reads as drifting rather than striking, so the hairline supplies the floor the
 * shadow cannot. It fades at both ends so it reads as a court line, not a rule.
 *
 * THE RAIL IS THE FLAG, and it is the one bold stroke on the screen. Blue, yellow
 * and green travel along the bottom edge — the national colours doing the job of a
 * progress indicator rather than sitting somewhere as ornament. It also pays off on
 * the way out: the panel exits by sliding UP, so the stripe sweeps the full height
 * of the viewport and leaves last.
 *
 * Still INDETERMINATE, and deliberately so. We have no idea how far along a font
 * request is, so a segment travels rather than filling to a percentage. Faking
 * progress is the most common way a loader lies.
 *
 * TIMING IS UNCHANGED and still owned here: it leaves when the app is READY —
 * `document.fonts.ready` — with a 1400ms floor so the gesture is actually seen
 * rather than flashing, and a 3000ms ceiling so a failed font request can never
 * trap anyone behind it. Fast machine: ~1.4s. Slow connection: as long as it
 * genuinely needs, no longer.
 *
 * COLD START ONLY. This is an entrance, not a loading indicator — route waits use
 * Loader, which is quieter and usually invisible.
 *
 * Under prefers-reduced-motion SportBounce renders a single static ball, the rail
 * is shown full rather than travelling, and the panel fades instead of sliding.
 * Nothing draws itself.
 */

const MIN_MS = 1400; // long enough for the ball to land at least once
const MAX_MS = 3000; // safety net if fonts never resolve

const SplashScreen = ({ onReady }) => {
  const { t } = useTranslation();
  const safe = useMotionSafe();

  /**
   * Decide WHEN to go; AnimatePresence in App owns the going.
   *
   * An earlier version drove the exit from an `animate` prop plus
   * onAnimationComplete and unmounted itself. That silently never slid — measuring the
   * curtain showed `transform: none` for its entire life, because the completion
   * callback fired and tore the element down before the transform ever ran.
   * AnimatePresence exists precisely to hold a component mounted until its `exit`
   * finishes, so the exit is declared below and this effect only reports readiness.
   */
  useEffect(() => {
    let cancelled = false;
    const start = Date.now();

    const leave = () => {
      if (cancelled) return;
      const waited = Date.now() - start;
      const hold = safe ? Math.max(0, MIN_MS - waited) : 0;
      setTimeout(() => !cancelled && onReady?.(), hold);
    };

    document.fonts?.ready.then(leave).catch(leave);
    const cap = setTimeout(leave, MAX_MS);

    return () => {
      cancelled = true;
      clearTimeout(cap);
    };
    // onReady is stable in practice; re-running on it would restart the timers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safe]);

  return (
    <motion.div
      // The curtain lifts out of the way, revealing the app already rendered behind
      // it. Declared as `exit` so AnimatePresence keeps this mounted until it lands.
      initial={false}
      exit={safe ? { y: '-100%' } : { opacity: 0 }}
      transition={{ duration: safe ? 0.75 : 0.2, ease: [0.76, 0, 0.24, 1] }}
      className="fixed inset-0 z-[300] flex flex-col items-center justify-center bg-[#0F0F0F]"
    >
      {/* The ball, and the floor it strikes. The `-mt-3` is not a nudge: SportBounce
          holds its ball 12px clear of its own box, so without pulling the line up by
          exactly that much the bounce lands in mid-air and the floor means nothing. */}
      <div className="flex flex-col items-center">
        <SportBounce size={60} className="h-28" />
        <span
          aria-hidden="true"
          className="-mt-3 h-px w-32 bg-gradient-to-r from-transparent via-white/25 to-transparent"
        />
      </div>

      {/* The wordmark, now supporting the ball rather than carrying the screen.
          One entrance for the whole block — the ball is already the motion here. */}
      <motion.div
        initial={safe ? { opacity: 0, y: 12 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
        className="mt-8 flex flex-col items-center"
      >
        <p className="font-display text-3xl font-extrabold tracking-tight text-white">
          Rwa<span className="text-brand-bright">Sport</span>
        </p>
        <p className="mt-2.5 text-[11px] font-bold uppercase tracking-[0.35em] text-white/40">
          Rwanda · MINISPORTS
        </p>
      </motion.div>

      {/* The flag, doing the work of a progress bar. Sits on the bottom edge so the
          curtain's exit sweeps it up the full height of the screen. */}
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1 overflow-hidden bg-white/5">
        <span
          className={
            safe
              ? 'absolute inset-y-0 left-0 w-1/3 animate-indeterminate bg-gradient-to-r from-rwanda-blue via-rwanda-yellow to-brand-bright'
              : 'absolute inset-0 bg-gradient-to-r from-rwanda-blue via-rwanda-yellow to-brand-bright'
          }
        />
      </div>

      {/* The visual is decorative; this is what assistive tech is told. */}
      <span className="sr-only" role="status">
        {t('common.starting_app')}
      </span>
    </motion.div>
  );
};

export default SplashScreen;
