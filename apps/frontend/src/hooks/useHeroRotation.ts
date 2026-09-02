import { useEffect, useState } from 'react';
import { useMotionSafe } from '../lib/motion';
import { HERO_INTERVAL } from '../config/heroMedia';

/**
 * The index of the photograph currently showing in a cross-fading stack.
 *
 * WHY THIS IS A HOOK AND NOT MORE CODE IN EACH PANEL. HeroStage carried this
 * timer inline with a note that keeping the rotation in one place "is what stops
 * the page from growing a second copy of them later". The sign-in panel is that
 * second place, so the timer moved here instead of being pasted.
 *
 * IT STOPS COMPLETELY when the visitor prefers reduced motion, when the browser
 * reports Save-Data or a 2g-class connection, when the tab is hidden, or when
 * there is only one usable photograph. Nothing is lost when it holds still: no
 * text moves and the motion carries no information.
 *
 * `still` is returned as well as the index, because a caller that draws progress
 * ticks needs to know not to draw them when nothing is going to advance.
 */

/** Reads Save-Data / effective connection type once, defensively. */
const prefersLightMedia = () => {
  try {
    const c = (navigator as any).connection;
    if (!c) return false;
    return !!c.saveData || /(^|-)2g$/.test(c.effectiveType || '');
  } catch {
    return false;
  }
};

const useHeroRotation = (length: number, interval = HERO_INTERVAL) => {
  const motionSafe = useMotionSafe();
  const [index, setIndex] = useState(0);
  const still = !motionSafe || length < 2 || prefersLightMedia();

  useEffect(() => {
    if (still) return undefined;
    let timer: number | null = null;
    const stop = () => {
      if (timer) window.clearInterval(timer);
      timer = null;
    };
    const start = () => {
      stop();
      timer = window.setInterval(() => setIndex((i) => (i + 1) % length), interval);
    };
    // A hidden tab keeps its timers running; decoding a new photograph every five
    // seconds behind another tab is battery spent on nothing anyone can see.
    const onVisibility = () => (document.hidden ? stop() : start());

    start();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [still, length, interval]);

  // A shorter list than last render must never leave the index past its end.
  return { index: length > 0 ? index % length : 0, still };
};

export default useHeroRotation;
