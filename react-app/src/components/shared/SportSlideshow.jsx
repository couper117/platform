import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { sportTheme } from '../../config/sportThemes';
import responsiveImage from '../../utils/responsiveImage';
import { useMotionSafe, EASE } from '../../lib/motion';
import cn from '../ui/cn';

/**
 * Cross-fading slideshow of sport photographs, with a caption that follows.
 *
 * Used where no single sport is the right one to show — registering a new club, or a
 * visitor who has not chosen a favourite yet. Cycling through them says "all of
 * Rwandan sport" in a way one still cannot.
 *
 * SPORTS WITHOUT A PHOTOGRAPH ARE SKIPPED. `sportThemes` deliberately holds `bg:
 * null` for sports whose stock image was wrong, and a slideshow that faded to a
 * blank panel every third slide would look broken. Filtering here means the slot
 * self-heals as real cover images are uploaded.
 *
 * THE NEXT IMAGE IS PRELOADED one slide ahead, so the cross-fade never lands on a
 * half-decoded frame. Without it the first pass through the list flashes.
 *
 * Under prefers-reduced-motion it renders a single static frame and never advances —
 * the cross-fade is the whole mechanism, so there is nothing to degrade to.
 */
const SLIDE_MS = 5000;

const SportSlideshow = ({ sports = [], interval = SLIDE_MS, className, children }) => {
  const safe = useMotionSafe();

  // Only sports we actually have a picture for, paired with their label.
  const slides = useMemo(
    () =>
      sports
        .map((s) => ({
          slug: s.slug,
          name: s.name,
          image: s.coverImage || sportTheme(s.slug).bg,
        }))
        .filter((s) => !!s.image),
    [sports]
  );

  const [i, setI] = useState(0);

  useEffect(() => {
    if (!safe || slides.length < 2) return undefined;
    const t = setInterval(() => setI((n) => (n + 1) % slides.length), interval);
    return () => clearInterval(t);
  }, [safe, slides.length, interval]);

  // Warm the next frame so the cross-fade has something decoded to fade to.
  useEffect(() => {
    if (slides.length < 2) return;
    const next = slides[(i + 1) % slides.length];
    const img = new Image();
    img.src = responsiveImage(next.image, { sizes: '50vw' }).src;
  }, [i, slides]);

  if (slides.length === 0) return null;

  const current = slides[i % slides.length];

  return (
    <div className={cn('relative overflow-hidden', className)}>
      <AnimatePresence initial={false}>
        <motion.img
          key={current.slug}
          {...responsiveImage(current.image, { sizes: '50vw' })}
          alt=""
          initial={safe ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          exit={safe ? { opacity: 0 } : undefined}
          // Long, because this is a slow ambient dissolve rather than a UI
          // transition — the 240ms budget covers things a user is waiting on.
          transition={{ duration: 1.1, ease: EASE }}
          className="absolute inset-0 h-full w-full animate-slow-zoom object-cover"
        />
      </AnimatePresence>

      {/* Scrims match the auth panels: clear at the top, heavy where copy sits. */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 via-40% to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-br from-brand-bright/15 via-transparent to-transparent" />

      {/* The caption is the caller's, but the sport name comes from the slide, so it
          is handed back rather than duplicated. */}
      <div className="relative h-full">{children?.(current)}</div>

      {/* Progress dots. They tell you the panel is a sequence rather than a glitch,
          and how far through it you are. Decorative — the panel is not a control. */}
      {slides.length > 1 && safe && (
        <div className="absolute bottom-5 right-5 z-10 flex gap-1.5" aria-hidden="true">
          {slides.map((s, n) => (
            <span
              key={s.slug}
              className={cn(
                'h-1.5 rounded-pill transition-all duration-500 ease-standard',
                n === i % slides.length ? 'w-5 bg-brand-bright' : 'w-1.5 bg-white/35'
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SportSlideshow;
