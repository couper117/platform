import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, ArrowRight, Compass, Trophy, Users, CalendarDays } from 'lucide-react';
import { getSports } from '../../api/endpoints/sports';
import { sportTheme, HERO_BG } from '../../config/sportThemes';
import SportIcon from '../../components/shared/SportIcon';
import HeroVideo from '../../components/shared/HeroVideo';
import LiveTodayStrip from '../../components/public/LiveTodayStrip';
import responsiveImage from '../../utils/responsiveImage';
import Seo from '../../components/shared/Seo';
import { EmptyState, Input, Skeleton } from '../../components/ui';

const TYPE_LABEL = { TEAM: 'Team sport', RACING: 'Racing', COMBAT: 'Combat', RACKET: 'Racket' };

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
 * into react-app/public/ and the hero lights up with no further changes; until then
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
  const [search, setSearch] = useState('');
  const { data, isLoading } = useQuery({ queryKey: ['explore-sports'], queryFn: getSports });
  const all = data?.data || [];
  const sports = all.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-page">
      <Seo
        title="Explore Sports"
        description="Explore every sport on the Rwanda National Sports Platform — pick a sport to see its leagues, fixtures and live scores."
      />

      {/* ─── hero ─── */}
      <HeroVideo
        // No footage in the repo yet. Add /hero.webm and /hero.mp4 to
        // react-app/public/ and pass them here — nothing else needs to change.
        sources={[]}
        poster={HERO_BG}
        className="-mt-14 flex min-h-[72vh] items-end md:-mt-nav"
        overlayClassName="bg-gradient-to-t from-black/90 via-black/55 to-black/40"
      >
        <div className="mx-auto max-w-6xl px-5 pb-12 pt-24 sm:px-8 md:pt-nav lg:pb-16">
          <p className="mb-5 inline-flex items-center gap-2 rounded-pill border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-sm">
            <Compass size={13} aria-hidden="true" />
            Rwanda · MINISPORTS
          </p>

          <h1 className="max-w-3xl text-4xl font-extrabold leading-[1.05] text-white sm:text-5xl lg:text-hero">
            Choose your <span className="text-brand-bright">sport</span>
          </h1>

          <p className="mt-4 max-w-lg text-base text-white/70">
            Every league, every match, every athlete. Pick a sport to open its hub —
            fixtures, live scores, standings and the match centre.
          </p>

          <div className="relative mt-8 max-w-md">
            <Search
              size={18}
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-tertiary"
            />
            <label htmlFor="sport-search" className="sr-only">
              Search a sport
            </label>
            <Input
              id="sport-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search a sport…"
              className="h-[52px] rounded-pill pl-11 shadow-lg"
            />
          </div>

          {/* Three numbers, because a chooser should say how much there is to choose
              from. Counts come from the same payload as the grid — no extra request. */}
          {!isLoading && all.length > 0 && (
            <dl className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
              {[
                [Trophy, all.length, all.length === 1 ? 'Sport' : 'Sports'],
                [Users, all.reduce((n, s) => n + (s._count?.teams ?? 0), 0), 'Teams'],
                [CalendarDays, all.reduce((n, s) => n + (s._count?.leagues ?? 0), 0), 'Leagues'],
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
      </HeroVideo>

      {/* Live scores, immediately under the hero — the fastest thing a returning
          visitor wants, without making them choose a sport first. */}
      <LiveTodayStrip />

      {/* ─── sport grid ─── */}
      <section className="mx-auto max-w-6xl px-5 py-12 sm:px-8 lg:py-16">
        <div className="mb-8 max-w-xl">
          <h2 className="text-2xl font-extrabold text-primary">Browse by sport</h2>
          <p className="mt-1.5 text-base text-secondary">
            Each hub carries its own competitions, fixtures and standings.
          </p>
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
            title={search ? `No sports match “${search}”` : 'No sports published yet'}
            hint={
              search
                ? 'Try a different spelling, or clear the search to see everything.'
                : 'Competitions appear here as federations set them up.'
            }
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
                        {TYPE_LABEL[s.type]}
                      </p>
                    )}
                    <h3 className="text-lg font-extrabold text-primary">{s.name}</h3>
                    <p className="mt-1 text-sm text-secondary">
                      {s._count?.leagues ?? 0}{' '}
                      {s._count?.leagues === 1 ? 'competition' : 'competitions'}
                      {s._count?.teams ? ` · ${s._count.teams} teams` : ''}
                    </p>

                    <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-brand-text">
                      Enter hub
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
