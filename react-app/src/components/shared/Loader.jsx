import React, { useEffect, useState } from 'react';
import SportBounce from './SportBounce';
import cn from '../ui/cn';

/**
 * The loader. One component, used for the app splash and for route/Suspense waits.
 *
 * IT REUSES THE BOUNCING BALL from the auth screens rather than inventing another
 * mark. A product should have one loading gesture, and this one is already the
 * thing people see on the way in — a ball that bounces and changes sport says
 * "Rwandan sport, all of it" without a word of copy.
 *
 * WHAT MAKES A LOADER PROFESSIONAL IS MOSTLY RESTRAINT
 *
 * `delay` (default 180ms) — nothing renders at all for the first 180ms. Most
 * navigations resolve faster than that, and a loader that flashes up and vanishes
 * reads as a glitch and makes a fast app feel unstable. If the wait is short, the
 * user never learns there was one.
 *
 * The bar is honestly INDETERMINATE. We have no idea how far along a lazy chunk or
 * a query is, so it does not pretend: a segment travels across a track instead of
 * filling to a fake percentage. Faking progress is the single most common way
 * loaders lie.
 *
 * role="status" with a screen-reader-only label, so assistive tech is told the
 * region is busy rather than reading out a bouncing ball. `aria-hidden` on the
 * decoration for the same reason.
 *
 * Under prefers-reduced-motion SportBounce goes static and the bar stops (the
 * global rule in index.css neutralises its CSS animation), leaving a calm, still
 * card that still says "loading".
 */
const Loader = ({
  label = 'Loading',
  sublabel,
  delay = 180,
  fullscreen = false,
  brand = false,
  className,
}) => {
  const [show, setShow] = useState(delay === 0);

  useEffect(() => {
    if (delay === 0) return undefined;
    const t = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  if (!show) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex flex-col items-center justify-center gap-1',
        fullscreen
          ? 'fixed inset-0 z-[150] bg-page/95 backdrop-blur-sm animate-in fade-in duration-200'
          : 'py-16',
        className
      )}
    >
      {/* The wordmark, on the splash only — a route change does not need re-branding. */}
      {brand && (
        <p className="mb-1 font-display text-2xl font-extrabold tracking-tight text-primary">
          Rwa<span className="text-brand-text">Sport</span>
        </p>
      )}

      <SportBounce size={brand ? 34 : 26} />

      {/* Indeterminate. A travelling segment, not a fill — see the note above. */}
      <div
        aria-hidden="true"
        className="relative mt-2 h-0.5 w-32 overflow-hidden rounded-pill bg-surface-2"
      >
        <span className="absolute inset-y-0 left-0 w-2/5 animate-indeterminate rounded-pill bg-brand" />
      </div>

      <span className="sr-only">{label}</span>
      {sublabel && <p className="mt-3 text-sm text-secondary">{sublabel}</p>}
    </div>
  );
};

export default Loader;
