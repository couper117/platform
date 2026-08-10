import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useMotionSafe } from '../../lib/motion';

/**
 * Cold-start curtain, modelled on the reference's preloader.
 *
 * THE MOVES, all from Tembera's #preloader:
 *   · a full-bleed matte-dark panel above everything
 *   · "Rwa" filled, "Sport" drawn as OUTLINED text that then fills left-to-right
 *     behind a bright cursor edge
 *   · a line that grows underneath
 *   · and the signature exit: the whole panel slides UP like a curtain, revealing
 *     the app behind it, then unmounts
 *
 * WHERE IT DIFFERS, and why
 * The reference holds its curtain for a flat 3000ms via setTimeout, then leaves. This
 * one leaves when the app is READY — `document.fonts.ready` — with a 1400ms floor so
 * the fill animation is actually seen rather than cut off mid-stroke, and a 3000ms
 * ceiling so a failed font request can never trap someone behind it. Fast machine:
 * ~1.4s. Slow connection: as long as it genuinely needs, and no longer.
 *
 * COLD START ONLY. This is an entrance, not a loading indicator — route waits use
 * Loader, which is quiet, unbranded and usually invisible. Playing a 1.4s title
 * sequence on every navigation would be intolerable.
 *
 * Under prefers-reduced-motion the text is simply present, the line is full, and the
 * panel fades rather than sliding. Nothing draws itself.
 *
 * The stroke-then-fill is built from two stacked spans rather than the reference's
 * ::before, because a pseudo-element cannot be animated from React — the outlined
 * copy sits underneath and a clipped, width-animated copy fills over it.
 */

const MIN_MS = 1400; // long enough to watch the fill finish
const MAX_MS = 3000; // safety net if fonts never resolve

const SplashScreen = ({ onReady }) => {
  const safe = useMotionSafe();

  /**
   * Decide WHEN to go; AnimatePresence in App.jsx owns the going.
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
      <h1 className="flex flex-col items-center gap-1 text-center font-display font-extrabold leading-none">
        <motion.span
          initial={safe ? { opacity: 0, y: 20 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.1, ease: 'easeOut' }}
          className="text-[clamp(3rem,11vw,6rem)] tracking-tight text-white"
        >
          Rwa
        </motion.span>

        {/* Outlined, then filled. */}
        <motion.span
          initial={safe ? { opacity: 0, y: 20 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.25, ease: 'easeOut' }}
          className="relative text-[clamp(3rem,11vw,6rem)] tracking-tight"
        >
          {/* The outline underneath. */}
          <span
            aria-hidden="true"
            className="text-transparent"
            style={{ WebkitTextStroke: '2px rgb(var(--brand-bright))' }}
          >
            Sport
          </span>

          {/* The fill, clipped and swept across, with a bright leading edge. */}
          <motion.span
            aria-hidden="true"
            initial={safe ? { width: '0%' } : { width: '100%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 1, delay: 0.5, ease: [0.19, 1, 0.22, 1] }}
            className="absolute inset-0 overflow-hidden whitespace-nowrap text-brand-bright"
            style={{ borderRight: safe ? '3px solid rgba(255,255,255,0.9)' : 'none' }}
          >
            Sport
          </motion.span>
        </motion.span>
      </h1>

      {/* The growing line. */}
      <motion.span
        aria-hidden="true"
        initial={safe ? { width: 0, opacity: 0 } : { width: 160, opacity: 1 }}
        animate={{ width: 160, opacity: 1 }}
        transition={{ duration: 1.3, ease: 'easeInOut' }}
        className="mt-8 h-1 rounded-pill bg-white/85"
      />

      <p className="mt-6 text-xs font-bold uppercase tracking-[0.35em] text-white/40">
        Rwanda · MINISPORTS
      </p>

      {/* The visual is decorative; this is what assistive tech is told. */}
      <span className="sr-only" role="status">
        Starting RwaSport
      </span>
    </motion.div>
  );
};

export default SplashScreen;
