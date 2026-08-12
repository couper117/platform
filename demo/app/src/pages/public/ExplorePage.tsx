import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Trophy, Users, CalendarDays, Radio, ArrowDown, ArrowRight, Compass, LayoutGrid } from 'lucide-react';
import { getSports } from '../../api/endpoints/sports';
import { getFixtures } from '../../api/endpoints/fixtures';
import ClubCrest from '../../components/ui/ClubCrest';
import Button from '../../components/ui/Button';
import Seo from '../../components/shared/Seo';

/* Landing page — the pitch design, theme-aware so it works in dark AND light.
   Colours come from the design-system tokens (bg-page / text-primary / surface /
   hairline); the one accent green is written per-theme so dark keeps the bright
   spring-green of the reference while light uses a readable emerald. */

// Accent that reads in both themes: emerald in light, the reference green in dark.
const ACCENT = 'text-emerald-600 dark:text-[#2FD778]';

/* ── hero visual (desktop only) ──────────────────────────────────────────
   Uses /hero.png if present (drop the real athletes cut-out into public/), else a
   generated green-glow fallback so the page never shows a broken frame offline. */
const HeroArt = () => {
  const [ok, setOk] = useState(true);
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[520px] lg:aspect-[5/4]">
      <div className="absolute inset-0 opacity-70 dark:opacity-100" style={{ background: 'radial-gradient(55% 55% at 62% 42%, rgba(34,197,94,0.25), transparent 72%)' }} />
      <svg viewBox="0 0 400 360" className="absolute inset-0 h-full w-full opacity-40" aria-hidden="true">
        <path d="M40 300 C140 260 150 120 250 90 C300 75 330 140 360 120" fill="none" stroke="#2FD778" strokeWidth="2" opacity="0.5" />
      </svg>
      {ok ? (
        <img
          src="/hero.png"
          alt="Rwandan athletes across football, basketball and volleyball"
          onError={() => setOk(false)}
          className="relative z-10 h-full w-full object-contain"
        />
      ) : (
        <div className="relative z-10 flex h-full items-center justify-center gap-4 sm:gap-7">
          {['⚽', '🏀', '🏐'].map((b, i) => (
            <span key={b} className="text-6xl drop-shadow-[0_0_28px_rgba(47,215,120,0.4)] sm:text-7xl" style={{ transform: `translateY(${i === 1 ? -26 : i === 0 ? 8 : -6}px)` }}>
              {b}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

/* ── one live match card ─────────────────────────────────────────────────── */
const LiveCard = ({ fx }) => {
  const live = fx.status === 'LIVE';
  const rows = [
    { team: fx.homeTeam, score: fx.homeScore },
    { team: fx.awayTeam, score: fx.awayScore },
  ];
  const lead = live && fx.homeScore != null && fx.awayScore != null ? (fx.homeScore >= fx.awayScore ? 0 : 1) : -1;
  return (
    <Link
      to={`/matches/${fx.id}`}
      className="flex w-[270px] shrink-0 snap-start flex-col rounded-xl border border-hairline bg-surface p-3.5 transition-colors hover:border-brand/40 hover:bg-surface-2 sm:w-auto sm:min-w-0 sm:flex-1 sm:shrink"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="truncate text-[10px] font-bold uppercase tracking-wider text-tertiary">{fx.league?.name}</span>
        {fx.statusLabel && (
          <span className={`inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${live ? `bg-emerald-500/10 dark:bg-[#2FD778]/15 ${ACCENT}` : 'text-tertiary'}`}>
            {live && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500 dark:bg-[#2FD778]" />}
            {fx.statusLabel}
          </span>
        )}
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

/* ── one sport card ──────────────────────────────────────────────────────── */
const SportCard = ({ s }) => {
  const isRacing = s.type === 'RACING';
  const count = s._count?.matches ?? 0;
  return (
    <Link
      to={`/sports/${s.slug}`}
      className="group flex w-[44vw] shrink-0 flex-col overflow-hidden rounded-xl border border-hairline bg-surface transition-all hover:-translate-y-1 hover:border-brand/40 hover:shadow-md sm:w-52 lg:w-auto"
    >
      <div className="relative h-28 overflow-hidden">
        <img src={s.coverImage} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>
      <div className="p-3.5">
        <h3 className="font-bold text-primary">{s.name}</h3>
        <p className={`mt-1 text-xs font-semibold ${ACCENT}`}>{count} {isRacing ? 'events' : 'matches'}</p>
        <p className="text-xs text-tertiary">{s._count?.leagues ?? 0} competitions</p>
      </div>
    </Link>
  );
};

const SectionLink = ({ to, children, short = 'View all' }) => (
  <Link to={to} className="inline-flex shrink-0 items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-secondary transition-colors hover:text-brand-text">
    <span className="hidden sm:inline">{children}</span>
    <span className="sm:hidden">{short}</span>
    <ArrowRight size={13} />
  </Link>
);

const ExplorePage = () => {
  const { data: sportsRes, isLoading } = useQuery({ queryKey: ['explore-sports'], queryFn: getSports });
  const sports = (sportsRes?.data || []).slice().sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  const { data: liveRes } = useQuery({ queryKey: ['explore-live'], queryFn: () => getFixtures({ status: 'LIVE' }) });
  const live = liveRes?.data || [];

  const stats = [
    { icon: Trophy, value: sports.length, label: 'Sports' },
    { icon: Users, value: sports.reduce((n, s) => n + (s._count?.teams ?? 0), 0), label: 'Teams' },
    { icon: CalendarDays, value: sports.reduce((n, s) => n + (s._count?.leagues ?? 0), 0), label: 'Leagues' },
    { icon: Radio, value: live.length, label: 'Live now' },
  ];

  return (
    <div className="min-h-screen bg-page text-primary">
      <Seo title="Explore Sports" description="All of Rwandan sport in one place — leagues, fixtures, live scores and every athlete." />

      {/* ─── hero ─── */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-60 dark:opacity-100" style={{ background: 'radial-gradient(80% 60% at 70% 10%, rgba(16,110,60,0.22), transparent 60%)' }} />
        <div className="relative mx-auto grid max-w-6xl items-center gap-6 px-5 pb-8 pt-8 sm:px-8 lg:grid-cols-2 lg:gap-8 lg:pb-12 lg:pt-14">
          <div>
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-hairline bg-surface px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-secondary">
              <Compass size={13} aria-hidden="true" /> Rwanda · MINISPORTS
            </p>
            <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              All of Rwandan sport,{' '}
              <span className={ACCENT}>in one place</span>
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-secondary sm:text-lg">
              From the national leagues to the Amashuri school games — every fixture, every result,
              every athlete. Follow your sport all season, and never miss a kick-off.
            </p>

            <div className="mt-7 flex items-center gap-3">
              <Button href="#pick" size="lg" icon={ArrowDown} iconRight className="flex-1 whitespace-nowrap px-4 text-sm sm:flex-none sm:px-10 sm:text-base">Find your sport</Button>
              <Button to="/live" variant="secondary" size="lg" icon={Radio} className="flex-1 whitespace-nowrap px-4 text-sm sm:flex-none sm:px-10 sm:text-base">Live scores</Button>
            </div>

            <dl className="mt-8 grid grid-cols-4 gap-3 sm:flex sm:flex-wrap sm:gap-x-7 sm:gap-y-4">
              {stats.map(({ icon: Icon, value, label }) => (
                <div key={label} className="flex items-start gap-2 sm:gap-2.5">
                  <Icon size={17} className={`mt-1 shrink-0 ${ACCENT}`} aria-hidden="true" />
                  <div>
                    <dd className="font-display text-2xl font-extrabold leading-none tabular-nums">{value}</dd>
                    <dt className="mt-1 text-xs text-tertiary">{label}</dt>
                  </div>
                </div>
              ))}
            </dl>
          </div>

          {/* Desktop flourish only — the mobile hero is compact text (see note in
              the git history). */}
          <div className="hidden lg:order-last lg:block">
            <HeroArt />
          </div>
        </div>
      </section>

      {/* ─── LIVE & TODAY ─── */}
      <section className="mx-auto max-w-6xl px-5 pb-8 sm:px-8">
        <div className="rounded-2xl border border-hairline bg-surface-2 p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Radio size={16} className={ACCENT} />
              <h2 className="text-sm font-bold uppercase tracking-widest">Live &amp; Today</h2>
              {live.length > 0 && (
                <span className={`rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider dark:bg-[#2FD778]/15 ${ACCENT}`}>
                  {live.length} Live
                </span>
              )}
            </div>
            <SectionLink to="/live">View all live matches</SectionLink>
          </div>

          {live.length === 0 ? (
            <p className="py-6 text-center text-sm text-tertiary">No live matches right now — check the fixtures.</p>
          ) : (
            <div className="scroll-contain flex snap-x gap-3 overflow-x-auto pb-1 sm:overflow-visible">
              {live.slice(0, 5).map((fx) => <LiveCard key={fx.id} fx={fx} />)}
            </div>
          )}
        </div>
      </section>

      {/* ─── PICK YOUR SPORT ─── */}
      <section id="pick" className="mx-auto max-w-6xl scroll-mt-20 px-5 pb-16 sm:px-8">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-xl font-extrabold sm:text-2xl">Pick your sport</h2>
          <SectionLink to="#pick">View all sports</SectionLink>
        </div>

        {isLoading ? (
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-44 w-52 shrink-0 animate-pulse rounded-xl border border-hairline bg-surface" />
            ))}
          </div>
        ) : (
          <div className="scroll-contain flex gap-4 overflow-x-auto pb-2 lg:grid lg:grid-cols-7 lg:overflow-visible">
            {sports.map((s) => <SportCard key={s.id} s={s} />)}
            <Link
              to="#pick"
              className="flex w-[44vw] shrink-0 flex-col items-center justify-center gap-2 rounded-xl border border-hairline bg-surface p-4 text-center transition-colors hover:border-brand/40 sm:w-52 lg:w-auto"
            >
              <LayoutGrid size={24} className="text-tertiary" />
              <p className="text-sm font-bold text-primary">More sports</p>
              <p className="text-xs text-tertiary">Explore all</p>
            </Link>
          </div>
        )}
      </section>
    </div>
  );
};

export default ExplorePage;
