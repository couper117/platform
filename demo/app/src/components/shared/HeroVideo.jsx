import React, { useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import responsiveImage from '../../utils/responsiveImage';
import cn from '../ui/cn';

/**
 * Background video for a hero, with a poster image that is always the first thing
 * painted.
 *
 * A background video is easy to do badly, so this handles all of it in one place:
 *
 * THE POSTER IS THE PRODUCT. It renders immediately as a normal responsive <img>
 * with srcSet, so the hero is complete and readable before a single byte of video
 * arrives. The video fades in over it only once it can actually play. If the file
 * is missing, 404s, or the codec is unsupported, nothing happens — you keep the
 * poster. That is why this component is safe to ship before any footage exists.
 *
 * IT REFUSES TO LOAD VIDEO WHEN IT WOULD BE RUDE:
 *   · prefers-reduced-motion         — motion is the whole point, so skip it
 *   · navigator.connection.saveData  — the user has asked for less data
 *   · effectiveType 2g / slow-2g     — it would stall and cost money
 *   · viewport under `minWidth`      — phones default to poster-only, because a
 *                                      multi-megabyte loop on Rwandan mobile data
 *                                      is a real cost to a real person
 * Each of these is checked before the <video> element is even created, so the
 * bytes are never requested rather than merely paused.
 *
 * IT STOPS WHEN NOBODY IS LOOKING. An IntersectionObserver pauses it once the hero
 * scrolls away, and a visibilitychange listener pauses it when the tab is hidden —
 * decoding video for a background nobody can see wastes battery on a phone.
 *
 * IT CAN BE STOPPED BY HAND. WCAG 2.2.2 requires a control for motion that runs
 * more than five seconds, and a looping background runs forever. The pause button
 * is real, labelled, and remembers nothing — it is a moment-to-moment control.
 *
 * TO ADD FOOTAGE: drop the files in apps/frontend/public/ and pass their paths, e.g.
 *   <HeroVideo sources={[{ src: '/hero.webm', type: 'video/webm' },
 *                        { src: '/hero.mp4',  type: 'video/mp4' }]} poster={...} />
 * WebM first — browsers pick the first type they support, and VP9/AV1 is typically
 * 30-50% smaller than the H.264 equivalent. Aim for under ~3MB, 10-15s, no audio
 * track at all (a muted track is still bytes), and 1280px wide is plenty behind a
 * scrim.
 */
const HeroVideo = ({
  sources = [],
  poster,
  minWidth = 1024,
  className,
  overlayClassName,
  children,
}) => {
  const videoRef = useRef(null);
  const wrapRef = useRef(null);
  const [allowed, setAllowed] = useState(false);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(true);

  // Decide ONCE whether this visitor should get video at all. Everything here is a
  // reason not to spend their bytes.
  useEffect(() => {
    if (sources.length === 0) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const narrow = window.matchMedia(`(max-width: ${minWidth - 1}px)`).matches;
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const stingy = !!conn?.saveData || /^(slow-)?2g$/.test(conn?.effectiveType || '');

    if (!reduced && !narrow && !stingy) setAllowed(true);
  }, [sources.length, minWidth]);

  // Pause off-screen and on a hidden tab.
  useEffect(() => {
    const el = videoRef.current;
    if (!el || !allowed) return undefined;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && playing) el.play().catch(() => {});
        else el.pause();
      },
      { threshold: 0.1 }
    );
    if (wrapRef.current) io.observe(wrapRef.current);

    const onVisibility = () => {
      if (document.hidden) el.pause();
      else if (playing) el.play().catch(() => {});
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      io.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [allowed, playing]);

  const toggle = () => {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) {
      el.play().catch(() => {});
      setPlaying(true);
    } else {
      el.pause();
      setPlaying(false);
    }
  };

  return (
    <div ref={wrapRef} className={cn('relative overflow-hidden', className)}>
      {/* Always painted. `animate-slow-zoom` gives the still some life on the
          devices that never receive the video — which is most of them. */}
      {poster && (
        <img
          {...responsiveImage(poster, { sizes: '100vw' })}
          alt=""
          loading="eager"
          // lowercase: React 18 does not recognise the camelCase form
          fetchpriority="high"
          className={cn(
            'absolute inset-0 h-full w-full object-cover',
            !ready && 'animate-slow-zoom'
          )}
        />
      )}

      {allowed && (
        <video
          ref={videoRef}
          poster={undefined /* the <img> above is the poster; a second one would double-fetch */}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
          tabIndex={-1}
          onCanPlay={() => setReady(true)}
          onError={() => setReady(false)}
          className={cn(
            'absolute inset-0 h-full w-full object-cover',
            'transition-opacity duration-700 ease-standard',
            ready ? 'opacity-100' : 'opacity-0'
          )}
        >
          {sources.map((s) => (
            <source key={s.src} src={s.src} type={s.type} />
          ))}
        </video>
      )}

      {/* Scrim. Owned by the caller so each hero can tune its own contrast. */}
      <div className={cn('absolute inset-0', overlayClassName)} />

      <div className="relative">{children}</div>

      {/* WCAG 2.2.2 — only rendered when there is actually motion to stop. */}
      {allowed && ready && (
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? 'Pause background video' : 'Play background video'}
          className={cn(
            'absolute bottom-4 right-4 z-20 inline-flex h-9 w-9 items-center justify-center',
            'rounded-pill border border-white/25 bg-black/40 text-white backdrop-blur-sm',
            'transition-colors duration-150 ease-standard hover:bg-black/60'
          )}
        >
          {playing ? <Pause size={14} aria-hidden="true" /> : <Play size={14} aria-hidden="true" />}
        </button>
      )}
    </div>
  );
};

export default HeroVideo;
