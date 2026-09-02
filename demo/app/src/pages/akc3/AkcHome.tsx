import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import {
  GraduationCap, Trophy, School, Radio, MapPin, ArrowRight, Layers, Newspaper, ChevronRight,
} from 'lucide-react';
import {
  getSchools, getChampionships, getAkcSports, getAkcFixtures, getAkcAnnouncements,
} from '../../api/endpoints/amashuri';
import { useEnumLabel } from '../../i18n/enums';
import useSportLookup from '../../hooks/useSportLookup';
import { SPORT_PHOTOS } from '../../config/heroMedia';
import Seo from '../../components/shared/Seo';
import ClubCrest from '../../components/ui/ClubCrest';
import SportIcon from '../../components/shared/SportIcon';
import { Badge, EmptyState, ErrorState, SectionHeading, Skeleton, StatusPill } from '../../components/ui';
import cn from '../../components/ui/cn';

/**
 * Amashuri Games — the digital home of Rwandan SCHOOL sports.
 *
 * Not one tournament: an umbrella ecosystem of many sports, schools, teams and
 * competitions. The homepage mirrors the main RwaSport landing (header → live →
 * pick a sport → competitions → schools → news), now on the same plain-header,
 * token-driven system every other page uses — no photo hero, no dark gradient
 * banner, no gold accent colour. Live on the real /akc3 API and fully
 * translated (EN/FR/RW) — every label goes through t(); only data (school,
 * competition names) stays data.
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
      className="flex w-[280px] shrink-0 snap-start flex-col gap-3 rounded-card border border-hairline bg-surface p-3 transition-colors duration-150 ease-standard hover:bg-surface-2 sm:w-auto sm:min-w-0"
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
   A sport is a photograph everywhere else in this app (see SportsIndexPage).
   The old tile was a grey circle holding one letter — an unloaded-avatar
   look, not a placeholder anyone chose on purpose. A sport with a shipped
   photo in /public/hero gets the same full-bleed treatment as the sports
   catalogue; a sport with none (rugby, table tennis) gets a brand-tinted
   panel carrying its icon — never a letter, never a bare grey box. ────── */
const SportCard = ({ s, t }: { s: any; t: any }) => {
  const hasPhoto = SPORT_PHOTOS.has(s.slug);
  return (
    <Link
      to="/amashuri/fixtures"
      className="group relative flex aspect-[3/4] w-[40vw] shrink-0 flex-col justify-end overflow-hidden rounded-card border border-hairline transition-colors duration-200 ease-standard hover:border-brand/50 sm:w-auto"
    >
      {hasPhoto ? (
        <>
          <img
            src={`/hero/${s.slug}.jpg`}
            alt=""
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-standard group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
          <div className="relative p-3">
            <p className="font-display text-sm font-bold leading-tight text-white">{s.name}</p>
            <p className="mt-0.5 text-xs text-white/65">{t('amashuri.comp_count', { count: s.competitions })}</p>
          </div>
        </>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-brand-tint p-3 text-center transition-colors duration-200 ease-standard group-hover:bg-brand/20">
          <SportIcon slug={s.slug} size={26} className="text-brand-text" />
          <div>
            <p className="font-display text-sm font-bold leading-tight text-brand-text">{s.name}</p>
            <p className="mt-0.5 text-xs text-brand-text/70">{t('amashuri.comp_count', { count: s.competitions })}</p>
          </div>
        </div>
      )}
    </Link>
  );
};

/* ── competition tile ──────────────────────────────────────────────────────
   A generated gradient (utils/crest.cover(), a `data:` URI) is a placeholder
   this app drew for itself, so it loses to a real file: the sport's photo
   from /public/hero first, then a genuinely uploaded (non-`data:`) cover,
   then no band at all — never the gradient. Same precedence as ExplorePage's
   `uploaded` const / LeagueCard's sportPhoto(). ────────────────────────── */
const CompetitionCard = ({ c, t }: { c: any; t: any }) => {
  const { bySportId } = useSportLookup();
  const sport = bySportId(c.sportId);
  const uploaded = c.coverImage && !String(c.coverImage).startsWith('data:') ? c.coverImage : null;
  const img = (sport?.slug && SPORT_PHOTOS.has(sport.slug) ? `/hero/${sport.slug}.jpg` : null) || uploaded;
  const stats = c.regions != null
    ? [[c.regions, t('amashuri.col_regions')], [c.events, t('amashuri.col_events')], [c.athletes, t('amashuri.col_athletes')]]
    : [[c.schools, t('amashuri.col_schools')], [c.groups, t('amashuri.col_groups')], [c.matches, t('amashuri.col_matches')]];
  return (
    <Link
      to="/amashuri/fixtures"
      className="group flex w-[80vw] shrink-0 snap-start flex-col overflow-hidden rounded-card border border-hairline bg-surface transition-colors duration-150 ease-standard hover:border-brand/40 hover:bg-surface-2 sm:w-auto"
    >
      {img && (
        <div className="aspect-[16/9] overflow-hidden bg-surface-2">
          <img src={img} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
        </div>
      )}
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

const AkcHome = () => {
  const { t } = useTranslation();
  const enumLabel = useEnumLabel();

  const schoolsQ = useQuery({ queryKey: ['ama-schools'], queryFn: () => getSchools(), retry: false });
  const compsQ = useQuery({ queryKey: ['ama-comps'], queryFn: () => getChampionships(), retry: false });
  const sportsQ = useQuery({ queryKey: ['ama-sports'], queryFn: () => getAkcSports(), retry: false });
  const fixturesQ = useQuery({ queryKey: ['ama-fixtures'], queryFn: () => getAkcFixtures(), retry: false });
  const newsQ = useQuery({ queryKey: ['ama-news'], queryFn: () => getAkcAnnouncements(), retry: false });

  const isLoading = schoolsQ.isLoading || compsQ.isLoading || sportsQ.isLoading || fixturesQ.isLoading || newsQ.isLoading;
  const isError = schoolsQ.isError || compsQ.isError || sportsQ.isError || fixturesQ.isError || newsQ.isError;
  const refetchAll = () => {
    schoolsQ.refetch();
    compsQ.refetch();
    sportsQ.refetch();
    fixturesQ.refetch();
    newsQ.refetch();
  };

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

  if (isError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 lg:max-w-6xl lg:px-6">
        <ErrorState title={t('amashuri.error_title')} hint={t('amashuri.error_hint')} onRetry={refetchAll} />
      </div>
    );
  }

  const schools = schoolsQ.data?.data || [];
  const competitions = compsQ.data?.data || [];
  const sports = sportsQ.data?.data || [];
  const live = (fixturesQ.data?.data || []).filter((f: any) => f.status === 'ONGOING');
  const news = (newsQ.data?.data || []).slice(0, 3);

  return (
    <div className="min-h-screen bg-page">
      <Seo title={t('seo.amashuri_home_title')} description={t('seo.amashuri_home_desc')} />

      <div className="mx-auto max-w-3xl px-4 pt-4 lg:max-w-6xl lg:px-6 lg:pt-6">
        <div className="mb-2 flex items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control border border-hairline bg-surface-2 text-primary">
            <GraduationCap size={16} aria-hidden="true" />
          </span>
          <Badge>{t('amashuri.tagline')}</Badge>
        </div>
        <h1 className="mb-3 font-display text-xl font-extrabold tracking-[-0.02em] text-primary sm:mb-4 sm:text-3xl">
          {t('amashuri.home_title_line1')} {t('amashuri.home_title_pre')}{t('amashuri.home_title_accent')}
        </h1>
        <p className="mb-4 max-w-xl text-sm text-secondary sm:mb-6">{t('amashuri.home_subtitle')}</p>

        <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2 sm:mb-6">
          <Link
            to="/amashuri/championships"
            className="inline-flex min-h-tap items-center gap-1.5 text-sm font-semibold text-secondary transition-colors duration-150 ease-standard hover:text-brand-text"
          >
            {t('amashuri.home_explore_comps')}
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
          <Link
            to="/amashuri/schools"
            className="inline-flex min-h-tap items-center gap-1.5 text-sm font-semibold text-secondary transition-colors duration-150 ease-standard hover:text-brand-text"
          >
            <School size={14} aria-hidden="true" />
            {t('amashuri.home_find_school')}
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-hairline pb-4 pt-4">
          <Stat icon={Layers} value={sports.length} label={t('amashuri.stat_sports')} />
          <Stat icon={School} value={schools.length} label={t('amashuri.stat_schools')} />
          <Stat icon={Trophy} value={competitions.length} label={t('amashuri.stat_competitions')} />
          <Stat icon={Radio} value={live.length} label={t('amashuri.stat_live')} live={live.length > 0} />
        </div>
      </div>

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
            <div className="scroll-contain flex snap-x gap-3 overflow-x-auto pb-1 sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-3">
              {live.map((fx: any) => <LiveSchoolCard key={fx.id} fx={fx} t={t} />)}
            </div>
          </section>
        )}

        {/* ─── PICK A SPORT ─── */}
        {sports.length > 0 && (
          <section>
            <SectionHeading title={t('amashuri.pick_sport')} action={t('amashuri.view_all_sports')} actionTo="/amashuri/fixtures" className="mb-4" />
            <div className="scroll-contain flex gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-4 sm:overflow-visible lg:grid-cols-8">
              {sports.map((s: any) => <SportCard key={s.slug} s={s} t={t} />)}
              <Link
                to="/amashuri/fixtures"
                className="flex aspect-[3/4] w-[40vw] shrink-0 flex-col items-center justify-center gap-2 rounded-card border border-hairline bg-surface p-3 text-center transition-colors duration-150 ease-standard hover:border-brand/40 hover:bg-surface-2 sm:w-auto"
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
            <div className="scroll-contain flex snap-x gap-4 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-4">
              {competitions.map((c: any) => <CompetitionCard key={c.id} c={c} t={t} />)}
            </div>
          </section>
        )}

        {/* ─── DISCOVER SCHOOLS + LATEST NEWS ─── */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section>
            <SectionHeading title={t('amashuri.discover_schools')} action={t('amashuri.view_directory')} actionTo="/amashuri/schools" className="mb-4" />
            {schools.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {schools.slice(0, 4).map((s: any) => (
                  <Link
                    key={s.id}
                    to={`/amashuri/schools/${s.id}`}
                    className="group flex items-center gap-3 rounded-card border border-hairline bg-surface p-4 transition-colors duration-150 ease-standard hover:border-brand/40 hover:bg-surface-2"
                  >
                    <ClubCrest team={s} size="lg" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-primary transition-colors duration-150 ease-standard group-hover:text-brand-text">
                        {s.name}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-tertiary">
                        <MapPin size={11} aria-hidden="true" /> {s.sector || s.province || t('sporthub.rwanda')} · {enumLabel('school_category', s.category)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState icon={School} title={t('amashuri.no_schools')} hint={t('amashuri.no_schools_hint')} />
            )}
          </section>

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
        </div>
      </div>
    </div>
  );
};

export default AkcHome;
