import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import SportIcon from './SportIcon';
import { useMotionSafe, EASE } from '../../lib/motion';
import cn from '../ui/cn';

/**
 * A ball that bounces and changes sport.
 *
 * Two things are happening, and they are deliberately on separate clocks:
 *   Â· a 900ms bounce loop â€” up on ease-out, down on ease-in, so it accelerates
 *     into the floor the way a ball does, with a squash on contact and a shadow
 *     that spreads and darkens as it lands
 *   Â· a 2.4s cycle swapping the glyph, so the mark says "every sport" rather than
 *     "football"
 *
 * The swap is timed to land mid-air, at the apex, where the ball is smallest and
 * moving slowest â€” a cross-fade at floor level reads as a glitch.
 *
 * THIS IS AN AMBIENT LOOP, NOT A TRANSITION, so the system's 240ms budget does not
 * apply to it â€” the same exemption the live pulse and the skeleton shimmer get. It
 * is decoration on an otherwise empty auth screen, which is the one place in the
 * product where decoration is the point.
 *
 * Under prefers-reduced-motion it renders a single static ball. `useMotionSafe`
 * gates it in JS because Framer drives transforms outside CSS, so the global
 * reduced-motion rule in index.css would not stop it on its own.
 */

/** Falls back to a fixed list so it animates before the sports query resolves. */
const DEFAULT_SLUGS = ['football', 'basketball', 'volleyball', 'athletics', 'cycling', 'rugby'];

const BOUNCE_MS = 900;
const SWAP_MS = 2400;

const SportBounce = ({ slugs = DEFAULT_SLUGS, size = 34, className = '' }) => {
  const safe = useMotionSafe();
  const [i, setI] = useState(0);
  const list = slugs.length ? slugs : DEFAULT_SLUGS;

  useEffect(() => {
    if (!safe || list.length < 2) return undefined;
    const t = setInterval(() => setI((n) => (n + 1) % list.length), SWAP_MS);
    return () => clearInterval(t);
  }, [safe, list.length]);

  const slug = list[i % list.length];

  if (!safe) {
    return (
      <div className={cn('flex h-20 items-center justify-center', className)} aria-hidden="true">
        <SportIcon slug={slug} size={size} className="text-brand" />
      </div>
    );
  }

  return (
    <div className={cn('relative flex h-20 items-end justify-center', className)} aria-hidden="true">
      {/* Shadow: widest and darkest at the moment of contact. */}
      <motion.span
        className="absolute bottom-1 h-1.5 w-10 rounded-pill bg-primary/20 blur-[2px]"
        animate={{ scaleX: [1, 0.55, 1], opacity: [0.9, 0.25, 0.9] }}
        transition={{
          duration: BOUNCE_MS / 1000,
          times: [0, 0.5, 1],
          repeat: Infinity,
          ease: ['easeOut', 'easeIn'],
        }}
      />

      {/* Vertical travel. */}
      <motion.div
        className="relative mb-3"
        animate={{ y: [0, -30, 0] }}
        transition={{
          duration: BOUNCE_MS / 1000,
          times: [0, 0.5, 1],
          repeat: Infinity,
          ease: ['easeOut', 'easeIn'],
        }}
      >
        {/* Squash, kept on its own element so it composes with the travel above
            instead of fighting it for the transform. */}
        <motion.div
          animate={{ scaleX: [1, 1, 1.18, 1], scaleY: [1, 1, 0.82, 1] }}
          transition={{
            duration: BOUNCE_MS / 1000,
            times: [0, 0.86, 0.96, 1],
            repeat: Infinity,
            ease: 'easeOut',
          }}
          style={{ transformOrigin: 'bottom center' }}
        >
          {/* A fixed box with the glyphs stacked absolutely inside it.
              `mode="wait"` was used here and it was wrong: it finishes the exit
              before starting the enter, so for ~220ms every swap rendered NO ball
              at all â€” just a shadow bouncing on its own. Overlapping them gives a
              true cross-fade, and absolute positioning keeps the swap from
              nudging the layout. */}
          <div className="relative" style={{ width: size, height: size }}>
            <AnimatePresence initial={false}>
              <motion.div
                key={slug}
                initial={{ opacity: 0, scale: 0.6, rotate: -40 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.6, rotate: 40 }}
                transition={{ duration: 0.22, ease: EASE }}
                className="absolute inset-0 flex items-center justify-center text-brand"
              >
                <SportIcon slug={slug} size={size} />
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default SportBounce;
