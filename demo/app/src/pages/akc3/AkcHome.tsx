import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import {
  GraduationCap, Trophy, School, Radio, MapPin, ArrowRight, Search, Users, Layers, Newspaper, ChevronRight,
} from 'lucide-react';
import {
  getSchools, getChampionships, getAkcSports, getAkcFixtures, getAkcAnnouncements,
} from '../../api/endpoints/amashuri';
import ResponsiveWrapper from '../../components/shared/ResponsiveWrapper';
import Seo from '../../components/shared/Seo';
import ClubCrest from '../../components/ui/ClubCrest';
import Button from '../../components/ui/Button';

/**
 * Amashuri Games — the digital home of Rwandan SCHOOL sports.
 *
 * Not one tournament: an umbrella ecosystem of many sports, schools, teams and
 * competitions. The homepage mirrors the main RwaSport landing (hero → live →
 * pick a sport → competitions → schools → news) but scoped to schools and wearing
 * a gold accent to set the school ecosystem apart from the green main platform.
 * Every number and card is data-driven from the /akc3 API.
 */

const GOLD = '#F5B301';

/* ── live school match card (sport-aware status) ────────────────────────────── */
const LiveSchoolCard = ({ fx }) => {
  const rows = [
    { s: fx.homeTeam?.school, score: fx.homeScore },
    { s: fx.awayTeam?.school, score: fx.awayScore },
  ];
  const lead = fx.homeScore != null && fx.awayScore != null ? (fx.homeScore >= fx.awayScore ? 0 : 1) : -1;
  return (
    <Link
      to={`/amashuri/matches/${fx.id}`}
      className="flex w-[280px] shrink-0 snap-start flex-col rounded-2xl border border-hairline bg-surface p-4 transition-colors hover:border-[#F5B301]/50 sm:w-auto sm:min-w-0 sm:flex-1 sm:shrink"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="truncate text-[10px] font-bold uppercase tracking-wider text-tertiary">{fx.competition?.name}</span>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-red/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red" /> {fx.statusLabel || 'Live'}
        </span>
      </div>
      <div className="space-y-2.5">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <ClubCrest team={r.s} size="sm" />
            <span className={`min-w-0 flex-1 truncate text-sm ${lead === i ? 'font-bold text-primary' : 'text-secondary'}`}>{r.s?.name || 'TBD'}</span>
            <span className={`shrink-0 text-sm tabular-nums ${lead === i ? 'font-bold text-primary' : 'text-secondary'}`}>{r.score ?? '-'}</span>
          </div>
        ))}
      </div>
      {fx.venue && <p className="mt-2.5 flex items-center gap-1 truncate text-[11px] text-tertiary"><MapPin size={11} /> {fx.venue}</p>}
    </Link>
  );
};

/* ── sport card ─────────────────────────────────────────────────────────────── */
const SportCard = ({ s }) => (
  <Link
    to="/amashuri/fixtures"
    className="group flex w-[40vw] shrink-0 flex-col items-center gap-2 rounded-2xl border border-hairline bg-surface p-4 text-center transition-all hover:-translate-y-1 hover:border-[#F5B301]/50 sm:w-auto"
  >
    <span className="text-3xl transition-transform group-hover:scale-110" aria-hidden="true">{s.icon}</span>
    <div>
      <p className="text-sm font-bold text-primary">{s.name}</p>
      <p className="text-[11px] text-tertiary">{s.competitions} competitions</p>
    </div>
  </Link>
);

/* ── competition card ───────────────────────────────────────────────────────── */
const CompetitionCard = ({ c }) => {
  const stats = c.regions != null
    ? [[c.regions, 'Regions'], [c.events, 'Events'], [c.athletes, 'Athletes']]
    : [[c.schools, 'Schools'], [c.groups, 'Groups'], [c.matches, 'Matches']];
  return (
    <Link
      to="/amashuri/fixtures"
      className="group flex w-[80vw] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-hairline bg-surface transition-all hover:-translate-y-1 hover:border-[#F5B301]/50 sm:w-auto"
    >
      <div className="relative h-28 overflow-hidden">
        {c.coverImage && <img src={c.coverImage} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <span className="absolute left-3 top-3 rounded-md bg-[#F5B301] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-black">{c.sportName}</span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-bold leading-tight text-primary group-hover:text-brand-text">{c.name}</h3>
        <p className="mt-1 flex flex-wrap items-center gap-x-2 text-[11px] text-tertiary">
          <span>{c.levelLabel}</span><span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-0.5"><MapPin size={10} /> {c.location}</span>
        </p>
        <div className="mt-auto grid grid-cols-3 gap-2 pt-3">
          {stats.map(([v, label]) => (
            <div key={label} className="rounded-lg bg-surface-2 py-2 text-center">
              <p className="font-display text-lg font-bold tabular-nums text-primary">{v}</p>
              <p className="text-[9px] font-bold uppercase tracking-wider text-tertiary">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </Link>
  );
};

const SectionHead = ({ icon: Icon, title, to, viewLabel = 'View all' }) => (
  <div className="mb-4 flex items-center justify-between gap-3">
    <h2 className="flex items-center gap-2 text-lg font-extrabold uppercase tracking-tight text-primary sm:text-xl">
      {Icon && <Icon size={18} style={{ color: GOLD }} />} {title}
    </h2>
    {to && (
      <Link to={to} className="inline-flex shrink-0 items-center gap-1 text-xs font-bold uppercase tracking-wider text-brand-text">
        {viewLabel} <ArrowRight size={13} />
      </Link>
    )}
  </div>
);

const AkcHome = () => {
  const { t } = useTranslation();
  const { data: schoolsRes } = useQuery({ queryKey: ['ama-schools'], queryFn: () => getSchools(), retry: false });
  const { data: compsRes } = useQuery({ queryKey: ['ama-comps'], queryFn: () => getChampionships(), retry: false });
  const { data: sportsRes } = useQuery({ queryKey: ['ama-sports'], queryFn: () => getAkcSports(), retry: false });
  const { data: fixturesRes } = useQuery({ queryKey: ['ama-fixtures'], queryFn: () => getAkcFixtures(), retry: false });
  const { data: newsRes } = useQuery({ queryKey: ['ama-news'], queryFn: () => getAkcAnnouncements(), retry: false });

  const schools = schoolsRes?.data || [];
  const competitions = compsRes?.data || [];
  const sports = sportsRes?.data || [];
  const live = (fixturesRes?.data || []).filter((f) => f.status === 'ONGOING');
  const news = (newsRes?.data || []).slice(0, 3);

  // Dynamic stats — real counts from the /akc3 data, never hardcoded.
  const stats = [
    { icon: Layers, value: sports.length, label: 'Sports' },
    { icon: School, value: schools.length, label: 'Schools' },
    { icon: Trophy, value: competitions.length, label: 'Competitions' },
    { icon: Radio, value: live.length, label: 'Live matches' },
  ];

  return (
    <div className="min-h-screen bg-page">
      <Seo title={t('seo.amashuri_home_title')} description={t('seo.amashuri_home_desc')} />

      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden bg-[#062a19] text-white">
        <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(70% 80% at 75% 20%, rgba(16,120,60,0.45), transparent 60%)' }} />
        <ResponsiveWrapper className="relative z-10 grid items-center gap-6 py-8 lg:grid-cols-2 lg:py-12">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider">
              <GraduationCap size={14} style={{ color: GOLD }} /> Rwanda Inter-School Sports
            </p>
            <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl">
              Rwandan School Sports,<br />All in <span style={{ color: GOLD }}>One Place</span>
            </h1>
            <p className="mt-4 max-w-md text-base leading-relaxed text-white/70">
              Follow school competitions, teams, athletes, fixtures, results and championships across Rwanda.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link to="/amashuri/championships" className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-bold text-black transition-transform hover:-translate-y-0.5" style={{ background: GOLD }}>
                Explore competitions <ArrowRight size={16} />
              </Link>
              <Link to="/amashuri/schools" className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur-sm transition-colors hover:bg-white/20">
                <School size={16} /> Find a school
              </Link>
            </div>
          </div>
          {/* Multi-sport visual — swap in /amashuri-hero.png for real athletes. */}
          <div className="hidden lg:block">
            <div className="relative mx-auto flex aspect-[5/4] max-w-md items-center justify-center gap-4">
              <div className="absolute inset-0" style={{ background: `radial-gradient(50% 50% at 55% 45%, ${GOLD}22, transparent 70%)` }} />
              {['⚽', '🏀', '🏐', '🏃'].map((b, i) => (
                <span key={b} className="relative text-6xl drop-shadow-[0_0_24px_rgba(245,179,1,0.35)]" style={{ transform: `translateY(${[10, -20, -6, 14][i]}px)` }}>{b}</span>
              ))}
            </div>
          </div>
        </ResponsiveWrapper>

        {/* Stats bar */}
        <ResponsiveWrapper className="relative z-10 pb-6">
          <div className="grid grid-cols-2 gap-3 rounded-2xl border border-white/10 bg-black/25 p-4 sm:grid-cols-4">
            {stats.map(({ icon: Icon, value, label }) => (
              <div key={label} className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/5"><Icon size={17} style={{ color: GOLD }} /></span>
                <div>
                  <p className="font-display text-xl font-extrabold leading-none tabular-nums">{value}</p>
                  <p className="mt-0.5 text-[11px] text-white/55">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </ResponsiveWrapper>
      </section>

      <ResponsiveWrapper className="space-y-10 py-8 lg:py-10">
        {/* ─── LIVE SCHOOL SPORTS ─── */}
        {live.length > 0 && (
          <section>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-lg font-extrabold uppercase tracking-tight text-primary sm:text-xl">
                <Radio size={18} className="text-red" /> Live School Sports
                <span className="rounded-full bg-red/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red">{live.length} Live</span>
              </h2>
              <Link to="/amashuri/fixtures" className="inline-flex shrink-0 items-center gap-1 text-xs font-bold uppercase tracking-wider text-brand-text">
                <span className="hidden sm:inline">View all live matches</span><span className="sm:hidden">View all</span> <ArrowRight size={13} />
              </Link>
            </div>
            <div className="scroll-contain flex snap-x gap-3 overflow-x-auto pb-1 sm:overflow-visible">
              {live.map((fx) => <LiveSchoolCard key={fx.id} fx={fx} />)}
            </div>
          </section>
        )}

        {/* ─── PICK A SPORT ─── */}
        {sports.length > 0 && (
          <section>
            <SectionHead title="Pick a sport" to="/amashuri/fixtures" viewLabel="View all sports" />
            <div className="scroll-contain flex gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-4 sm:overflow-visible lg:grid-cols-8">
              {sports.map((s) => <SportCard key={s.slug} s={s} />)}
              <Link to="/amashuri/fixtures" className="flex w-[40vw] shrink-0 flex-col items-center justify-center gap-2 rounded-2xl border border-hairline bg-surface p-4 text-center hover:border-[#F5B301]/50 sm:w-auto">
                <ChevronRight size={22} className="text-tertiary" />
                <p className="text-sm font-bold text-primary">More sports</p>
                <p className="text-[11px] text-tertiary">View all</p>
              </Link>
            </div>
          </section>
        )}

        {/* ─── POPULAR COMPETITIONS ─── */}
        {competitions.length > 0 && (
          <section>
            <SectionHead title="Popular competitions" to="/amashuri/championships" viewLabel="View all competitions" />
            <div className="scroll-contain flex snap-x gap-4 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-4">
              {competitions.map((c) => <CompetitionCard key={c.id} c={c} />)}
            </div>
          </section>
        )}

        {/* ─── DISCOVER SCHOOLS + LATEST NEWS ─── */}
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          <section>
            <SectionHead icon={School} title="Discover schools" to="/amashuri/schools" viewLabel="View directory" />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {schools.slice(0, 4).map((s) => (
                <Link key={s.id} to={`/amashuri/schools/${s.id}`} className="group flex items-center gap-3 rounded-2xl border border-hairline bg-surface p-4 transition-all hover:-translate-y-0.5 hover:border-[#F5B301]/50">
                  <ClubCrest team={s} size="lg" />
                  <div className="min-w-0">
                    <p className="truncate font-bold text-primary group-hover:text-brand-text">{s.name}</p>
                    <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-tertiary">
                      <MapPin size={11} /> {s.sector || s.province || 'Rwanda'} · {s.category}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section id="news" className="rounded-2xl border border-hairline bg-surface p-5">
            <div className="mb-4 flex items-center gap-2">
              <Newspaper size={16} style={{ color: GOLD }} />
              <h2 className="text-sm font-bold uppercase tracking-widest text-primary">Latest news</h2>
            </div>
            {news.length === 0 ? (
              <p className="py-4 text-sm text-tertiary">No school-sports news yet.</p>
            ) : (
              <div className="space-y-4">
                {news.map((a) => (
                  <div key={a.id} className="border-b border-hairline/60 pb-3 last:border-0 last:pb-0">
                    <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: GOLD }}>{String(a.category || 'News').replace(/_/g, ' ')}</p>
                    <p className="text-sm font-semibold leading-snug text-primary">{a.title}</p>
                    {a.createdAt && <p className="mt-0.5 text-[11px] text-tertiary">{format(new Date(a.createdAt), 'd MMM yyyy')}</p>}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </ResponsiveWrapper>
    </div>
  );
};

export default AkcHome;
