import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Search, ArrowRight, ArrowDown, ChevronDown, Compass, Trophy, Users, CalendarDays, Radio,
} from 'lucide-react';
import { getSports } from '../../api/endpoints/sports';
import { sportTheme, HERO_BG } from '../../config/sportThemes';
import SportIcon from '../../components/shared/SportIcon';
import HeroVideo from '../../components/shared/HeroVideo';
import LiveTodayStrip from '../../components/public/LiveTodayStrip';
import responsiveImage from '../../utils/responsiveImage';
import Seo from '../../components/shared/Seo';
import { Button, EmptyState, Input, Skeleton } from '../../components/ui';

// Keys, not labels — resolved through t() at render so the type reads in the
// visitor's language like the rest of the card.
const TYPE_LABEL = {
  TEAM: 'explore.type_TEAM',
  RACING: 'explore.type_RACING',
  COMBAT: 'explore.type_COMBAT',
  RACKET: 'explore.type_RACKET',
};

/**
 * Landing page — choose a sport.
 *
 * HERO
 * Cinematic, following the reference: full-bleed background, pill badge, a heavy
 * display headline, one line of copy, and the search field. It sits BEHIND the fixed
 * header (`-mt-nav pt-nav`), which is how the reference gets its edge-to-edge look —
 * PublicLayout pushes content clear of the bar, and the hero deliberately undoes
 * that for itself.
 *
 * It is 72vh, not 100vh. A full-viewport hero means a visitor scrolls before seeing
 * a single sport, and the whole job of this page is to get them into one. 72vh keeps
 * the top of the sport grid visible on a laptop, which is what makes the page read
 * as a chooser rather than a poster.
 *
 * THE BACKGROUND VIDEO is wired but has no footage yet — see HeroVideo. Drop files
 * into apps/frontend/public/ and the hero lights up with no further changes; until then
 * every visitor gets the poster with a slow zoom, which is also exactly what phones,
 * data-saver users and reduced-motion users get permanently.
 *
 * CARDS
 * The reference's category card: photograph on top, an icon circle overlapping it,
 * then title and meta on white, with the whole card lifting and the image zooming on
 * hover. Replaces a 4:5 photo tile with white text burned over the image, which was
 * unreadable whenever the photo behind it was pale.
 */
const ExplorePage = () => {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const { data, isLoading } = useQuery({ queryKey: ['explore-sports'], queryFn: getSports });
  const all = data?.data || [];
  const sports = all.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen scroll-smooth bg-page">
      <Seo
        title="Explore Sports"
        description="Explore every sport on the Rwanda National Sports Platform — pick a sport to see its leagues, fixtures and live scores."
      />

      {/* ─── hero ─── */}
      <HeroVideo
        // No footage in the repo yet. Add /hero.webm and /hero.mp4 to
        // apps/frontend/public/ and pass them here — nothing else needs to change.
        sources={[]}
        poster={HERO_BG}
        className="-mt-14 flex min-h-[72vh] items-end md:-mt-nav"
        /* TWO gradient layers, because one cannot do both jobs. The text is
           left-aligned over a stadium whose stands are bright, so the horizontal
           layer carries its contrast; the vertical layer darkens the bottom edge so
           the scroll cue stays legible. A single top-to-bottom scrim strong enough
           for the copy would have flattened the whole photograph. */
        overlayClassName="bg-[linear-gradient(to_right,rgb(0_0_0/0.88)_0%,rgb(0_0_0/0.6)_45%,rgb(0_0_0/0.15)_100%),linear-gradient(to_top,rgb(0_0_0/0.7)_0%,transparent_55%)]"
      >
        <div className="mx-auto max-w-6xl px-5 pb-24 pt-24 sm:px-8 md:pt-nav lg:pb-28">
          <p className="mb-5 inline-flex items-center gap-2 rounded-pill border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-sm">
            <Compass size={13} aria-hidden="true" />
            Rwanda · MINISPORTS
          </p>

          {/* A claim, not an instruction. "Choose your sport" told people to do a
              chore; this says what the product is and why it is worth their time. */}
          <h1 className="max-w-3xl text-4xl font-extrabold leading-[1.05] text-white sm:text-5xl lg:text-hero">
            {t('explore.hero_title_pre')}{' '}
            <span className="text-brand-bright">{t('explore.hero_title_accent')}</span>
          </h1>

          <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/85">
            {t('explore.hero_subtitle')}
          </p>

          {/* Two ways in, both pointing DOWN the page rather than into a filter box.
              The primary one scrolls; it does not navigate away. */}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button href="#sports" size="lg" icon={ArrowDown} iconRight>
              {t('explore.find_your_sport')}
            </Button>
            <Button to="/fixtures" variant="onDark" size="lg" icon={Radio}>
              {t('explore.live_scores')}
            </Button>
          </div>

          {/* Three numbers, because a chooser should say how much there is to choose
              from. Counts come from the same payload as the grid — no extra request. */}
          {!isLoading && all.length > 0 && (
            <dl className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
              {[
                [Trophy, all.length, all.length === 1 ? t('explore.stat_sport') : t('explore.stat_sports')],
                [Users, all.reduce((n, s) => n + (s._count?.teams ?? 0), 0), t('explore.stat_teams')],
                [CalendarDays, all.reduce((n, s) => n + (s._count?.leagues ?? 0), 0), t('explore.stat_leagues')],
              ].map(([Icon, value, label]) => (
                <div key={label} className="flex items-center gap-2.5">
                  <Icon size={16} className="text-brand-bright" aria-hidden="true" />
                  <dt className="sr-only">{label}</dt>
                  <dd className="flex items-baseline gap-1.5">
                    <span className="font-display text-xl font-extrabold tabular-nums text-white">
                      {value}
                    </span>
                    <span className="text-sm text-white/55">{label}</span>
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>

        {/* Scroll cue. The single most direct way to tell someone there is more —
            an explicit label plus a nudging chevron. Centred and low, where the eye
            lands after reading the block above. CSS animation, so the global
            prefers-reduced-motion rule stills it. */}
        <a
          href="#sports"
          className="absolute inset-x-0 bottom-5 z-10 mx-auto flex w-fit flex-col items-center gap-1 text-xs font-bold uppercase tracking-wider text-white/60 transition-colors hover:text-white"
        >
          {t('explore.scroll_cue')}
          <ChevronDown size={18} aria-hidden="true" className="animate-bounce" />
        </a>
      </HeroVideo>

      {/* Live scores, immediately under the hero — the fastest thing a returning
          visitor wants, without making them choose a sport first. */}
      <LiveTodayStrip />

      {/* ─── sport grid ─── */}
      {/* `scroll-mt-nav` so the fixed header never covers the heading when the hero's
          links jump here. */}
      <section id="sports" className="mx-auto max-w-6xl scroll-mt-nav px-5 py-12 sm:px-8 lg:py-16">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-xl">
            <h2 className="text-2xl font-extrabold text-primary">{t('explore.pick_title')}</h2>
            <p className="mt-1.5 text-base text-secondary">{t('explore.pick_subtitle')}</p>
          </div>

          {/* Search lives here, not in the hero. In the hero it was a dead end — you
              type, the list filters somewhere below, and you never scroll. Beside the
              grid it filters what you can actually see. */}
          {all.length > 4 && (
            <div className="relative w-full md:w-72">
              <Search
                size={17}
                aria-hidden="true"
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-tertiary"
              />
              <label htmlFor="sport-search" className="sr-only">
                {t('explore.search_label')}
              </label>
              <Input
                id="sport-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('explore.search')}
                className="rounded-pill pl-10"
              />
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-card border border-hairline bg-surface">
                <Skeleton className="h-44 rounded-none" />
                <div className="space-y-2 p-5">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ))}
          </div>
        ) : sports.length === 0 ? (
          <EmptyState
            icon={Search}
            title={search ? t('explore.no_match', { q: search }) : t('explore.no_sports_yet')}
            hint={search ? t('explore.no_match_hint') : t('explore.no_sports_hint')}
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {sports.map((s) => {
              const theme = sportTheme(s.slug);
              const bg = s.coverImage || theme.bg;
              return (
                <Link
                  key={s.id}
                  to={`/sports/${s.slug}`}
                  className="group flex flex-col overflow-hidden rounded-card border border-hairline bg-surface shadow-md transition-all duration-300 ease-standard hover:-translate-y-1.5 hover:border-brand/30 hover:shadow-lg"
                >
                  <div className="relative h-44 overflow-hidden">
                    {bg ? (
                      <>
                        <img
                          {...responsiveImage(bg, { sizes: '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw' })}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover transition-transform duration-500 ease-standard group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
                      </>
                    ) : (
                      /* No photograph — a branded panel with the sport's mark rather
                         than a broken frame or a wrong stock image. Every sport
                         MINISPORTS adds starts here until a cover image is uploaded. */
                      <div className="flex h-full w-full items-center justify-center bg-brand-tint">
                        <SportIcon
                          slug={s.slug}
                          size={64}
                          className="text-brand/25 transition-transform duration-500 ease-standard group-hover:scale-110"
                        />
                      </div>
                    )}
                  </div>

                  {/* The reference's icon circle, straddling the image edge. */}
                  <div className="relative -mt-7 px-5">
                    <span className="flex h-14 w-14 items-center justify-center rounded-pill bg-brand text-white shadow-brand">
                      <SportIcon slug={s.slug} size={22} />
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col p-5 pt-4">
                    {/* Only when the API actually reports a type. It was falling back
                        to the literal word "Sport", which printed on every card in the
                        grid and said nothing. */}
                    {TYPE_LABEL[s.type] && (
                      <p className="text-xs font-bold uppercase tracking-wider text-tertiary">
                        {t(TYPE_LABEL[s.type])}
                      </p>
                    )}
                    <h3 className="text-lg font-extrabold text-primary">{s.name}</h3>
                    <p className="mt-1 text-sm text-secondary">
                      {s._count?.leagues ?? 0}{' '}
                      {s._count?.leagues === 1 ? t('explore.competition') : t('explore.competitions')}
                      {s._count?.teams ? ` · ${s._count.teams} ${t('explore.teams')}` : ''}
                    </p>

                    <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-brand-text">
                      {t('explore.enter_hub')}
                      <ArrowRight
                        size={14}
                        aria-hidden="true"
                        className="transition-transform duration-200 ease-standard group-hover:translate-x-1"
                      />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default ExplorePage;
