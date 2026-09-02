import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useHeroRotation from '../../hooks/useHeroRotation';
import { HERO_SLIDES, heroSrc } from '../../config/heroMedia';
import cn from '../ui/cn';

/**
 * The hero's photography layer: a cross-fading stack of Rwandan sport, plus the
 * caption that names and credits whichever photograph is showing.
 *
 * WHY THIS IS A COMPONENT AND NOT MORE MARKUP IN THE PAGE
 * The hero's copy, buttons and stats stay where they were in ExplorePage — this
 * only replaces the single `<img src="/landing-hero.jpg">` behind them. Keeping
 * the rotation, the timer and the credit in one place is what stops the page from
 * growing a second copy of them later.
 *
 * THE SCRIM HAS TO EARN EVERY PERCENT. Two stacked gradients multiply, so a heavy
 * left wash under a heavy bottom wash crushes the picture to a black slab — and a
 * photograph nobody can see is just an expensive dark rectangle. These are weighted
 * to the left, where the copy sits, and leave the right two-thirds of the frame
 * nearly clear so the sport actually reads.
 *
 * 5s, WITH A 900ms CROSS-FADE. lib/motion caps interactions at 240ms; this is not
 * an interaction, it is ambient background — the same exemption tailwind.config.js
 * already grants `slow-zoom`. The timer itself lives in useHeroRotation, which the
 * sign-in panel shares; it holds still for reduced motion, Save-Data, a hidden tab
 * or a single photograph.
 *
 * CREDIT IS NOT OPTIONAL. Most of these are CC BY-SA, which requires attribution.
 * The caption is the attribution, which is why it is rendered rather than buried in
 * a file. Once MINISPORTS supplies its own photography, set `credit: null` in
 * config/heroMedia.ts and the credit half of the line disappears on its own.
 */

const HeroStage = () => {
  const { t } = useTranslation();
  const slides = HERO_SLIDES;
  const { index, still } = useHeroRotation(slides.length);
  const current = slides[index];

  return (
    <>
      <div className="absolute inset-0" aria-hidden="true">
        {/* A slab under the stack so the scrim has something to sit on for the
            frame before the first photograph decodes. */}
        <div className="absolute inset-0 bg-[#0F0F0F]" />

        {slides.map((slide, i) => (
          <img
            key={slide.id}
            src={heroSrc(slide)}
            alt=""
            // The first frame is this route's LCP candidate; the rest must not
            // compete with it, or with the fixture list, for bandwidth on a phone.
            loading={i === 0 ? 'eager' : 'lazy'}
            fetchpriority={i === 0 ? 'high' : 'low'}
            decoding="async"
            className={cn(
              'absolute inset-0 h-full w-full object-cover object-center',
              'transition-opacity duration-[900ms] ease-standard motion-reduce:transition-none',
              i === index ? 'opacity-100' : 'opacity-0'
            )}
          />
        ))}

        {/* Theme-independent by design: these sit on a photograph, not on the page
            surface, so they must not follow the light/dark tokens. */}

        {/* A flat grey veil across the whole frame. The directional gradients below
            darken the corners the copy sits in, but they leave the middle of the
            picture at full saturation, so a bright shot still fought the type. This
            takes the whole image down a stop evenly — it mutes rather than darkens,
            which is why it is grey and not more black. */}
        <div className="absolute inset-0 bg-[#5A5A5A]/15 dark:bg-[#5A5A5A]/25" />

        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />

        {/* Fades the photograph into the page instead of stopping dead against it.
            The hero used to end on a hard horizontal line where the image met the
            surface below, which read as two pages stacked rather than one. Uses the
            `page` token, so it lands on white in light and near-black in dark. */}
        {/* THE FADE IS SHORTER IN LIGHT THAN IN DARK, and it has to be.
            In dark the page is near-black and the scrimmed photograph is already
            dark, so a long fade is invisible — it just dissolves. In light the
            same fade has to travel from a dark photograph to WHITE, and over
            140px that reads as fog laid across the picture rather than an edge
            softening. Light gets just enough to kill the hard line; dark keeps
            the long, seamless one. */}
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-page to-transparent sm:h-14 dark:h-28 sm:dark:h-36" />
      </div>

      {/* Caption + credit, bottom right, out of the copy's way. */}
      {current && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 hidden justify-end px-5 pb-5 sm:flex sm:px-8">
          <div className="pointer-events-auto flex flex-col items-end gap-2">
            <Link
              to={current.to}
              className="text-right text-xs font-semibold uppercase tracking-[0.14em] text-white/80 transition-colors duration-150 ease-standard hover:text-white"
            >
              {t(current.labelKey)}
            </Link>
            {current.credit && (
              <span className="text-right text-[11px] font-normal text-white/45">
                {t('explore.photo_credit', { author: current.credit })}
              </span>
            )}
            {!still && (
              <div className="flex gap-1.5" aria-hidden="true">
                {slides.map((s, i) => (
                  <span
                    key={s.id}
                    className={cn(
                      'h-0.5 w-5 rounded-pill transition-colors duration-300 ease-standard',
                      i === index ? 'bg-white' : 'bg-white/30'
                    )}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default HeroStage;
