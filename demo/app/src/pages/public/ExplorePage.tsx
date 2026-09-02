import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Radio, ArrowDown, ArrowRight, LayoutGrid } from 'lucide-react';
import { getSports } from '../../api/endpoints/sports';
import { getFixtures } from '../../api/endpoints/fixtures';
import { cover } from '../../utils/crest';
import { SPORT_THEMES } from '../../config/sportThemes';
import ClubCrest from '../../components/ui/ClubCrest';
import Button from '../../components/ui/Button';
import Seo from '../../components/shared/Seo';
import HeroStage from '../../components/home/HeroStage';
import { HERO_SLIDES, SPORT_PHOTOS } from '../../config/heroMedia';

/* Landing — the RwaSport home. Theme-aware (light + dark), fully translated
   (EN/FR/RW) via t(), and live on the real backend (/sports, /fixtures). */

/* LIVE IS ORANGE, NOT GREEN. tokens.css: "Live stays orange: it must never be
   confused with the brand." This page painted every live indicator emerald - a
   hardcoded #2FD778 that is not even the brand token - which is a large part of
   why the green read as relentless. */
const ACCENT = 'text-live';

/** Sports with a photograph on disk. See SPORT_PHOTOS in config/heroMedia.ts. */
const LOCAL_SPORT_PHOTO = SPORT_PHOTOS;

const LiveCard = ({ fx, t }) => {
  const rows = [{ team: fx.homeTeam, score: fx.homeScore }, { team: fx.awayTeam, score: fx.awayScore }];
  const lead = fx.homeScore != null && fx.awayScore != null ? (fx.homeScore >= fx.awayScore ? 0 : 1) : -1;
  const label = fx.statusLabel || (fx.liveState?.minute != null ? `${fx.liveState.minute}'` : t('match.live', 'LIVE'));
  return (
    <Link to={`/matches/${fx.id}`} className="flex w-[270px] shrink-0 snap-start flex-col rounded-xl border border-hairline bg-surface p-3.5 transition-colors hover:border-brand/40 hover:bg-surface-2 sm:w-auto sm:min-w-0 sm:flex-1 sm:shrink">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="truncate text-[10px] font-bold uppercase tracking-wider text-tertiary">{fx.league?.name}</span>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-pill bg-live px-2 py-0.5 text-xs font-semibold text-live-on">
          <span className="h-1.5 w-1.5 rounded-pill bg-current animate-live-pulse" />{label}
        </span>
      </div>
      <div className="space-y-2.5">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <ClubCrest team={r.team} size="sm" />
            <span className={`min-w-0 flex-1 truncate text-sm ${lead === i ? 'font-bold text-primary' : 'text-secondary'}`}>{r.team?.name || 'TBD'}</span>
            <span className={`shrink-0 text-sm tabular-nums ${lead === i ? 'font-bold text-primary' : 'text-secondary'}`}>{r.score ?? '-'}</span>
          </div>
        ))}
      </div>
    </Link>
  );
};

/**
 * A sport, as a photograph you can walk into.
 *
 * The old card was a 112px letterbox image over a white caption block — small
 * enough that twelve of them read as a spreadsheet with pictures, and the hover
 * stacked a `scale-110` zoom, a `-translate-y-1` lift AND a shadow on every tile
 * at once. This is one tall frame: the photograph IS the card, the name sits on it,
 * and the only hover is a slow push-in of the image inside a fixed frame, so
 * nothing on the page moves when the pointer crosses it.
 *
 * The local Rwandan hero photograph wins where there is one — those are the six
 * shots in /public/hero, and they are the same sports people actually search for.
 */
const SportCard = ({ s, t }) => {
  const isRacing = s.type === 'RACING';
  const count = s._count?.matches ?? 0;
  const themeBg = SPORT_THEMES[s.slug]?.bg;

  /**
   * A GENERATED PLACEHOLDER IS NOT A PHOTOGRAPH.
   *
   * `coverImage` used to win outright. But `utils/crest.cover()` returns an inline
   * `data:image/svg+xml` gradient, and the demo dataset fills every sport's
   * coverImage with one — so preferring it blindly buried the real Rwandan
   * photography behind a purple-to-orange gradient on the front page.
   *
   * A `data:` URI is by definition something this app drew for itself, so it loses
   * to a real file on disk. An uploaded cover from MINISPORTS arrives as an http(s)
   * URL and still wins, which is the behaviour that was actually intended.
   */
  const uploaded =
    s.coverImage && !String(s.coverImage).startsWith('data:') ? s.coverImage : null;
  const img =
    uploaded ||
    (LOCAL_SPORT_PHOTO.has(s.slug) ? `/hero/${s.slug}.jpg` : null) ||
    (themeBg ? `${themeBg}&w=800` : cover(s.slug));

  return (
    <Link
      to={`/sports/${s.slug}`}
      className="group relative flex aspect-[3/4] flex-col justify-end overflow-hidden rounded-card border border-hairline transition-colors duration-200 ease-standard hover:border-brand/50"
    >
      <img
        src={img}
        alt=""
        loading="lazy"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-standard group-hover:scale-105"
      />
      {/* Enough to carry white type at the bottom, clear enough at the top that
          you can still tell one sport from another at a glance. */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

      <div className="relative p-4">
        <h3 className="font-display text-lg font-bold leading-tight tracking-tight text-white">{s.name}</h3>
        <p className="mt-1 text-xs text-white/65">
          {count > 0
            ? `${count} ${isRacing ? t('explore.events') : t('explore.matches')}`
            : t('explore.enter')}
        </p>
      </div>
    </Link>
  );
};

const SectionLink = ({ to, children, short }) => (
  <Link to={to} className="inline-flex shrink-0 items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-secondary transition-colors hover:text-brand-text">
    <span className="hidden sm:inline">{children}</span>
    <span className="sm:hidden">{short}</span>
    <ArrowRight size={13} />
  </Link>
);

const ExplorePage = () => {
  const { t } = useTranslation();
  const { data: sportsRes, isLoading } = useQuery({ queryKey: ['explore-sports'], queryFn: getSports });
  const sports = (sportsRes?.data || []).slice().sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  const { data: liveRes } = useQuery({ queryKey: ['explore-live'], queryFn: () => getFixtures({ status: 'LIVE' }) });
  const live = liveRes?.data || [];

  return (
    <div className="min-h-screen bg-page text-primary">
      <Seo title={t('explore.pick_title')} description={t('explore.hero_subtitle')} />

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Six photographs of Rwandan sport, cross-fading every 5s, plus the scrim
            and the CC BY-SA credit. Replaces the single `/landing-hero.jpg`, which
            was an American college football game. See config/heroMedia.ts. */}
        <HeroStage />

        {/* A composed hero, not a stripped one.
            Four blocks, each doing a different job, on a deliberate vertical
            rhythm: an eyebrow that places the institution, a headline that says
            what this is, one line of what you get, and the two things a visitor
            can do next. What is NOT here is the four-up counter row — even with
            real numbers it is a marketing gesture, and on a phone it was four
            columns of 11px labels fighting the photograph.

            The headline is ONE COLOUR. It used to put half its words in #2FD778,
            a hardcoded green that is not even the brand token, which was the
            loudest thing on the page. Green is spent once, on the primary button. */}
        <div className="relative mx-auto flex min-h-[440px] max-w-6xl items-end px-5 pb-12 pt-20 sm:min-h-[540px] sm:px-8 sm:pb-16 lg:min-h-[640px] lg:pb-24">
          <div className="max-w-2xl">
            <p className="mb-5 flex items-center gap-3 whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.14em] text-white/65 sm:mb-6 sm:gap-3.5 sm:text-xs sm:tracking-[0.22em]">
              <span aria-hidden="true" className="h-px w-6 shrink-0 bg-brand sm:w-9" />
              {t('explore.hero_kicker')}
            </p>

            <h1 className="text-balance font-display text-[38px] font-extrabold leading-[1.03] tracking-[-0.035em] text-white sm:text-[52px] lg:text-[68px]">
              {t('explore.hero_title')}
            </h1>

            <p className="mt-6 max-w-lg text-base leading-relaxed text-white/75 sm:mt-7 sm:text-lg">
              {t('explore.hero_subtitle')}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3 sm:mt-10 sm:gap-4">
              <Button to="/fixtures" size="lg" icon={Radio} className="whitespace-nowrap px-6 sm:px-9">
                {t('explore.live_scores')}
              </Button>
              <Button
                href="#pick"
                variant="secondary"
                size="lg"
                icon={ArrowDown}
                iconRight
                className="whitespace-nowrap border-white/25 !bg-white/10 !text-white backdrop-blur-sm hover:!bg-white/20 px-6 sm:px-9"
              >
                {t('explore.find_your_sport')}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Live & Today */}
      <section className="mx-auto max-w-6xl px-5 pb-8 sm:px-8">
        <div className="rounded-2xl border border-hairline bg-surface-2 p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Radio size={16} className={ACCENT} />
              <h2 className="text-sm font-bold uppercase tracking-widest">{t('explore.live_today')}</h2>
              {live.length > 0 && (
                <span className="rounded-pill bg-live px-2 py-0.5 text-xs font-semibold text-live-on">{t('explore.live_count', { count: live.length })}</span>
              )}
            </div>
            <SectionLink to="/fixtures" short={t('explore.view_all')}>{t('explore.view_all_live')}</SectionLink>
          </div>
          {live.length === 0 ? (
            <p className="py-6 text-center text-sm text-tertiary">{t('explore.no_live')}</p>
          ) : (
            <div className="scroll-contain flex snap-x gap-3 overflow-x-auto pb-1 sm:overflow-visible">
              {live.slice(0, 5).map((fx) => <LiveCard key={fx.id} fx={fx} t={t} />)}
            </div>
          )}
        </div>
      </section>

      {/* Pick your sport */}
      <section id="pick" className="mx-auto max-w-6xl scroll-mt-20 px-5 pb-20 sm:px-8">
        {/* A real section head, not a label. The grid below is the reason people
            scrolled this far, so it is allowed to announce itself. */}
        <div className="mb-6 flex items-end justify-between gap-4">
          <div className="min-w-0">
            <h2 className="font-display text-2xl font-extrabold tracking-[-0.02em] sm:text-3xl">
              {t('explore.pick_title')}
            </h2>
            <p className="mt-1.5 max-w-md text-sm text-secondary sm:whitespace-nowrap lg:whitespace-normal">{t('explore.pick_subtitle')}</p>
          </div>
          <SectionLink to="#pick" short={t('explore.view_all')}>{t('explore.view_all_sports')}</SectionLink>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] animate-pulse rounded-card border border-hairline bg-surface-2" />
            ))}
          </div>
        ) : (
          /* Five across on desktop instead of seven, so each sport is a picture
             rather than a thumbnail. Two across on a phone — the old single
             scrolling row hid ten of the twelve sports off-screen. */
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
            {sports.map((s) => <SportCard key={s.id} s={s} t={t} />)}
            <Link
              to="/sports"
              className="flex aspect-[3/4] flex-col items-center justify-center gap-2.5 rounded-card border border-dashed border-hairline bg-surface-2 p-4 text-center transition-colors duration-200 ease-standard hover:border-brand/50 hover:bg-brand-tint"
            >
              <LayoutGrid size={22} className="text-tertiary" aria-hidden="true" />
              <p className="font-display text-base font-bold text-primary">{t('explore.more_sports')}</p>
              <p className="text-xs text-tertiary">{t('explore.explore_all')}</p>
            </Link>
          </div>
        )}
      </section>
    </div>
  );
};

export default ExplorePage;
