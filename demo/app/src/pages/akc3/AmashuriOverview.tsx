import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import {
  GraduationCap, Trophy, School, Radio, MapPin, ArrowRight, Layers, Newspaper, ChevronRight,
} from 'lucide-react';
import { getAkcAnnouncements } from '../../api/endpoints/amashuri';
import { useEnumLabel } from '../../i18n/enums';
import useSportLookup from '../../hooks/useSportLookup';
import { AMASHURI_GAMES, competitionCover, schoolCover } from '../../config/amashuriMedia';
import { useAmashuri } from './AmashuriLayout';
import useMediaQuery from '../../hooks/useMediaQuery';
import ClubCrest from '../../components/ui/ClubCrest';
import SportIcon from '../../components/shared/SportIcon';
import { Badge, EmptyState, ErrorState, SectionHeading, Skeleton, StatusPill } from '../../components/ui';
import cn from '../../components/ui/cn';
import AdSlot from '../../components/shared/AdSlot';

/**
 * Amashuri Games — the overview tab.
 *
 * IT IS A SUMMARY NOW, NOT THE WHOLE SECTION. This page used to be everything:
 * live matches, every sport, every competition, every school and the news, on one
 * scroll, with the sibling routes reachable only through small "view all" links
 * that looked like they led somewhere else entirely. Championships, fixtures,
 * results, standings and schools are tabs of AmashuriLayout now, and this tab
 * shows the first of each and hands off.
 *
 * IT DOES NOT FETCH THE SHARED DATA. Schools, competitions, sports and fixtures
 * come from the layout through `useAmashuri`, so opening a second tab does not
 * re-request the same four endpoints. Only the announcements are this tab's own.
 */

/* ── header stat, same anatomy as SportLayout's Stat ─────────────────────── */
const Stat = ({ icon: Icon, value, label, live = false }: { icon: any; value: any; label: any; live?: boolean }) => (
  <span className="flex items-center gap-1.5">
    <Icon size={14} aria-hidden="true" className={live ? 'text-live' : 'text-tertiary'} />
    <span className={cn('text-sm font-semibold tabular-nums', live ? 'text-live' : 'text-primary')}>{value}</span>
    <span className="text-sm text-tertiary">{label}</span>
  </span>
);

/* ── live school match card — same anatomy as AmashuriFixtureCard/MatchTile ── */
const LiveSchoolCard = ({ fx, t }: { fx: any; t: any }) => {
  const rows = [
    { school: fx.homeTeam?.school, score: fx.homeScore },
    { school: fx.awayTeam?.school, score: fx.awayScore },
  ];
  const lead = fx.homeScore != null && fx.awayScore != null ? (fx.homeScore >= fx.awayScore ? 0 : 1) : -1;
  return (
    <Link
      to={`/amashuri/matches/${fx.id}`}
      className="flex flex-col gap-3 rounded-card border border-hairline bg-surface p-3 transition-colors duration-150 ease-standard hover:bg-surface-2"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="min-w-0 flex-1 truncate text-xs text-tertiary">{fx.competition?.name}</span>
        <StatusPill status="ONGOING" label={fx.statusLabel || t('match.live')} className="shrink-0" />
      </div>
      <div className="flex flex-col gap-1.5">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center gap-2">
            <ClubCrest team={r.school} size="sm" />
            <span className={cn('min-w-0 flex-1 truncate text-sm', lead === i ? 'font-semibold text-primary' : 'text-secondary')}>
              {r.school?.name || t('common.tbd')}
            </span>
            <span className={cn('shrink-0 text-sm tabular-nums', lead === i ? 'font-semibold text-primary' : 'text-secondary')}>
              {r.score ?? 0}
            </span>
          </div>
        ))}
      </div>
      {fx.venue && (
        <p className="flex items-center gap-1 truncate text-xs text-tertiary">
          <MapPin size={11} className="shrink-0" aria-hidden="true" /> {fx.venue}
        </p>
      )}
    </Link>
  );
};

/* ── sport tile ────────────────────────────────────────────────────────────
   ONE TREATMENT FOR ALL OF THEM, and it is not a photograph.

   These tiles used to pull /hero/<slug>.jpg — the NATIONAL league photography —
   for the five sports that have a file and fall back to a brand-tinted icon panel
   for the two that do not. Three things were wrong with that. The photographs are
   senior professional sport standing in for school sport, which is the one
   distinction this whole section exists to make. They are landscape frames cropped
   to 3:4, so the football tile rendered as the trees behind Kigali Pelé Stadium and
   the basketball tile as an empty stretch of court. And five photo tiles beside two
   icon tiles is not a row, it is two designs sharing a grid.

   A sport here is its icon, its name and how many competitions it runs. Uniform,
   legible at 90px, and honest about being a category rather than a picture. ── */
const SportCard = ({ s, t }: { s: any; t: any }) => (
  <Link
    to="/amashuri/fixtures"
    className="group flex aspect-[3/4] flex-col items-center justify-center gap-2 rounded-card border border-hairline bg-surface p-3 text-center transition-colors duration-200 ease-standard hover:border-brand/40 hover:bg-brand-tint"
  >
    <SportIcon slug={s.slug} size={26} className="text-brand-text" />
    <div className="min-w-0">
      <p className="truncate font-display text-sm font-bold leading-tight text-primary">{s.name}</p>
      <p className="mt-0.5 text-xs text-tertiary">{t('amashuri.comp_count', { count: s.competitions })}</p>
    </div>
  </Link>
);

/* ── competition tile ──────────────────────────────────────────────────────
   A generated gradient (utils/crest.cover(), a `data:` URI) is a placeholder
   this app drew for itself, so it loses to a real file: the sport's photo
   from /public/hero first, then a genuinely uploaded (non-`data:`) cover,
   then no band at all — never the gradient. Same precedence as ExplorePage's
   `uploaded` const / LeagueCard's sportPhoto(). ────────────────────────── */
const CompetitionCard = ({ c, t }: { c: any; t: any }) => {
  const { bySportId } = useSportLookup();
  const sport = bySportId(c.sportId);
  const img = competitionCover(c);
  const stats = c.regions != null
    ? [[c.regions, t('amashuri.col_regions')], [c.events, t('amashuri.col_events')], [c.athletes, t('amashuri.col_athletes')]]
    : [[c.schools, t('amashuri.col_schools')], [c.groups, t('amashuri.col_groups')], [c.matches, t('amashuri.col_matches')]];
  return (
    <Link
      to="/amashuri/fixtures"
      className="group flex flex-col overflow-hidden rounded-card border border-hairline bg-surface transition-colors duration-150 ease-standard hover:border-brand/40 hover:bg-surface-2"
    >
      <div className="aspect-[16/9] overflow-hidden bg-surface-2">
        <img
          src={img}
          alt=""
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-700 ease-standard group-hover:scale-105"
        />
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        {c.sportName && (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-tertiary">
            {sport?.slug && <SportIcon slug={sport.slug} size={12} className="shrink-0" />}
            {c.sportName}
          </span>
        )}
        <h3 className="font-display text-base font-semibold leading-tight text-primary transition-colors duration-150 ease-standard group-hover:text-brand-text">
          {c.name}
        </h3>
        <p className="flex flex-wrap items-center gap-x-2 text-xs text-tertiary">
          <span>{c.levelLabel}</span>
          {c.location && (
            <>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1"><MapPin size={11} aria-hidden="true" /> {c.location}</span>
            </>
          )}
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2 border-t border-hairline pt-3">
          {stats.map(([v, label]) => (
            <div key={label} className="text-center">
              <p className="font-display text-lg font-bold tabular-nums text-primary">{v}</p>
              <p className="text-xs text-tertiary">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </Link>
  );
};

/* ── school card ───────────────────────────────────────────────────────────
   A CREST ON A PLAIN PANEL IS NOT A SCHOOL. Forty schools rendered as forty
   identical bordered rows read as a database table, which is exactly what a
   directory should not feel like. Each card carries a real Rwandan campus
   photograph — the school's own when it has one, a stable stand-in when it does
   not (see config/amashuriMedia) — with the crest overlapping the bottom edge the
   way a club badge sits on a club page. ─────────────────────────────────────── */
const SchoolCard = ({ s, t, enumLabel }: { s: any; t: any; enumLabel: any }) => (
  <Link
    to={`/amashuri/schools/${s.id}`}
    className="group flex flex-col overflow-hidden rounded-card border border-hairline bg-surface transition-colors duration-150 ease-standard hover:border-brand/40 hover:bg-surface-2"
  >
    <div className="relative aspect-[16/9] overflow-hidden bg-surface-2">
      <img
        src={schoolCover(s)}
        alt=""
        loading="lazy"
        decoding="async"
        className="h-full w-full object-cover transition-transform duration-700 ease-standard group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
      <div className="absolute bottom-2 left-3">
        <ClubCrest team={s} size="lg" />
      </div>
    </div>
    <div className="min-w-0 p-3">
      <p className="truncate text-sm font-semibold text-primary transition-colors duration-150 ease-standard group-hover:text-brand-text">
        {s.name}
      </p>
      <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-tertiary">
        <MapPin size={11} className="shrink-0" aria-hidden="true" />
        {s.sector || s.province || t('sporthub.rwanda')} · {enumLabel('school_category', s.category)}
      </p>
    </div>
  </Link>
);

const AmashuriOverview = () => {
  const { t } = useTranslation();
  const enumLabel = useEnumLabel();

  const { schools, competitions, sports, live, isPending, isError, refetchAll } = useAmashuri();

  /**
   * A PHONE GETS A PREVIEW OF EACH SECTION, NOT ALL OF IT.
   *
   * On a desktop the overview is four tidy grids. Stacked into one 390px column it
   * came to 5,700px — five live cards, eight sport tiles, four competition cards
   * with photographs, four school cards and the news, one under another, and the
   * reader has to scroll past every one of them to reach the next heading. Each
   * section already carries a "view all" to its own tab; on a phone that link is
   * the section's continuation rather than a footnote to it.
   *
   * Gated on the QUERY rather than with `hidden`, because a hidden card still
   * mounts, still decodes its photograph and still costs the mobile data.
   */
  const isWide = useMediaQuery('(min-width: 640px)');
  const cap = (list: any[], n: number) => (isWide ? list : list.slice(0, n));
  const newsQ = useQuery({ queryKey: ['ama-news'], queryFn: () => getAkcAnnouncements(), retry: false });

  const isLoading = isPending || newsQ.isLoading;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-3 px-4 pt-6 lg:max-w-6xl lg:px-6">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-40 w-full rounded-card" />
        <Skeleton className="h-40 w-full rounded-card" />
      </div>
    );
  }

  if (isError || newsQ.isError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 lg:max-w-6xl lg:px-6">
        <ErrorState title={t('amashuri.error_title')} hint={t('amashuri.error_hint')} onRetry={refetchAll} />
      </div>
    );
  }

  const news = (newsQ.data?.data || []).slice(0, 3);

  return (
    <>
      {/* NO HORIZONTAL SCROLLERS ON A PHONE.
          Live matches, the sport tiles and the competitions were each their own
          side-scrolling row, so the page was four separate carousels stacked up,
          every one of them sliced off at the right edge with no sign there was
          more. They stack and grid now — the whole section is on the page. */}
      <div className="mx-auto max-w-3xl space-y-8 px-4 pb-10 pt-2 lg:max-w-6xl lg:px-6 lg:pb-14">
        {/* ─── LIVE SCHOOL SPORTS ─── */}
        {live.length > 0 && (
          <section>
            <SectionHeading
              title={t('amashuri.live_school_sports')}
              accent={t('amashuri.live_count', { count: live.length })}
              action={t('amashuri.view_all_live')}
              actionTo="/amashuri/fixtures"
              className="mb-4"
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {cap(live, 3).map((fx: any) => <LiveSchoolCard key={fx.id} fx={fx} t={t} />)}
            </div>
          </section>
        )}

        {/* ─── PICK A SPORT ─── */}
        {sports.length > 0 && (
          <section>
            <SectionHeading title={t('amashuri.pick_sport')} action={t('amashuri.view_all_sports')} actionTo="/amashuri/fixtures" className="mb-4" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
              {sports.map((s: any) => <SportCard key={s.slug} s={s} t={t} />)}
              <Link
                to="/amashuri/fixtures"
                className="flex aspect-[3/4] flex-col items-center justify-center gap-2 rounded-card border border-hairline bg-surface p-3 text-center transition-colors duration-150 ease-standard hover:border-brand/40 hover:bg-surface-2"
              >
                <ChevronRight size={22} className="text-tertiary" aria-hidden="true" />
                <p className="text-sm font-semibold text-primary">{t('amashuri.more_sports')}</p>
                <p className="text-xs text-tertiary">{t('amashuri.view_all')}</p>
              </Link>
            </div>
          </section>
        )}

        {/* ─── POPULAR COMPETITIONS ─── */}
        {competitions.length > 0 && (
          <section>
            <SectionHeading title={t('amashuri.popular_comps')} action={t('amashuri.view_all_comps')} actionTo="/amashuri/championships" className="mb-4" />
            {/* FOUR, NOT ALL OF THEM. The championships tab is the list; this is
                the trailer for it. Showing every competition here is what made the
                overview the whole section. */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {cap(competitions.slice(0, 4), 2).map((c: any) => <CompetitionCard key={c.id} c={c} t={t} />)}
            </div>
          </section>
        )}

        {/* ─── WHAT THE GAMES ARE ───
            A photograph of an actual school games day, between the competitions
            and the directory. The section is about children competing for their
            schools and it went twelve screens without showing one. */}
        <section className="relative overflow-hidden rounded-card border border-hairline">
          <img
            src={AMASHURI_GAMES.src}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-[180px] w-full object-cover sm:h-[240px]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
            <h2 className="max-w-lg font-display text-lg font-extrabold leading-tight text-white sm:text-2xl">
              {t('amashuri.banner_title')}
            </h2>
            <p className="mt-1 max-w-md text-sm text-white/75">{t('amashuri.banner_body')}</p>
          </div>
          {AMASHURI_GAMES.credit && (
            <span className="pointer-events-none absolute right-3 top-3 text-[10px] text-white/40">
              {t('explore.photo_credit', { author: AMASHURI_GAMES.credit })}
            </span>
          )}
        </section>

        {/* ─── DISCOVER SCHOOLS + LATEST NEWS ─── */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section>
            <SectionHeading title={t('amashuri.discover_schools')} action={t('amashuri.view_directory')} actionTo="/amashuri/schools" className="mb-4" />
            {schools.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {cap(schools.slice(0, 4), 2).map((s: any) => (
                  <SchoolCard key={s.id} s={s} t={t} enumLabel={enumLabel} />
                ))}
              </div>
            ) : (
              <EmptyState icon={School} title={t('amashuri.no_schools')} hint={t('amashuri.no_schools_hint')} />
            )}
          </section>

          <div className="space-y-4">
          <section className="rounded-card border border-hairline bg-surface p-4 sm:p-5">
            <div className="mb-4 flex items-center gap-2">
              <Newspaper size={16} className="text-tertiary" aria-hidden="true" />
              <h2 className="font-display text-lg font-semibold text-primary">{t('amashuri.latest_news')}</h2>
            </div>
            {news.length === 0 ? (
              <p className="py-4 text-sm text-tertiary">{t('amashuri.no_news')}</p>
            ) : (
              <div className="space-y-4">
                {news.map((a: any) => (
                  <div key={a.id} className="border-b border-hairline pb-3 last:border-0 last:pb-0">
                    <p className="text-xs text-tertiary">{String(a.category || t('amashuri.news_default')).replace(/_/g, ' ')}</p>
                    <p className="text-sm font-semibold leading-snug text-primary">{a.title}</p>
                    {a.createdAt && <p className="mt-0.5 text-xs text-tertiary">{format(new Date(a.createdAt), 'd MMM yyyy')}</p>}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* The rail's own unit. A 300x250 under the news column is the one
              placement on this page that costs the content nothing — desktop
              only, because on a phone this column stacks under the schools and
              the page already carries a banner at its foot. */}
          <AdSlot position="amashuri-rail" variant="sidebar" className="hidden lg:block" />
          </div>
        </div>
      </div>
    </>
  );
};

export default AmashuriOverview;
