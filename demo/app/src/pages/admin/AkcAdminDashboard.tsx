import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  School, Users, Medal, Trophy, Radio, CalendarDays, GraduationCap,
  PlusCircle, UserPlus, UserSquare2, Newspaper, CheckCircle2,
} from 'lucide-react';
import {
  getSchools, getChampionships, getAkcSports, getAkcFixtures, getAkcTeams,
} from '../../api/endpoints/amashuri';

/**
 * AMASHURI ADMIN DASHBOARD — the school-sports ECOSYSTEM, not one cup.
 *
 * Oversees schools, sports, teams, competitions, matches, live scores, athletes
 * and news. Everything is driven by the same /akc3 data the public Amashuri
 * pages use, so an admin change surfaces publicly. Gold accent marks the school
 * ecosystem. (Full CRUD + backend enforcement land in the port.)
 */

const GOLD = '#F5B301';
const isToday = (d) => { if (!d) return false; return new Date(d).toDateString() === new Date().toDateString(); };

const Stat = ({ icon: Icon, value, label, tint }) => (
  <div className="rounded-2xl border border-hairline bg-surface p-4">
    <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: `${tint || GOLD}1a`, color: tint || GOLD }}><Icon size={17} /></div>
    <p className="font-display text-2xl font-bold tabular-nums text-primary">{value}</p>
    <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-tertiary">{label}</p>
  </div>
);

const MatchRow = ({ fx }) => (
  <Link to={`/amashuri/matches/${fx.id}`} className="flex items-center gap-3 rounded-xl border border-hairline bg-surface-2 p-3 hover:border-[#F5B301]/50">
    <div className="min-w-0 flex-1">
      <p className="truncate text-[10px] font-bold uppercase tracking-wider text-tertiary">{fx.competition?.name}</p>
      <p className="truncate text-sm font-semibold text-primary">
        {fx.homeTeam?.school?.name} <span className="text-tertiary">vs</span> {fx.awayTeam?.school?.name}
      </p>
    </div>
    <div className="shrink-0 text-right">
      {fx.status === 'ONGOING' ? (
        <span className="inline-flex items-center gap-1 text-xs font-bold text-red"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red" />{fx.statusLabel || 'LIVE'}</span>
      ) : fx.status === 'COMPLETED' ? (
        <span className="text-xs font-bold text-tertiary">FT</span>
      ) : (
        <span className="text-xs font-semibold text-secondary">{fx.matchDate ? format(new Date(fx.matchDate), 'HH:mm') : 'TBD'}</span>
      )}
      {fx.homeScore != null && <p className="font-display text-sm font-bold tabular-nums text-primary">{fx.homeScore}-{fx.awayScore}</p>}
    </div>
  </Link>
);

const QUICK = [
  { label: 'Create Competition', icon: PlusCircle, to: '/admin/championships' },
  { label: 'Add School', icon: School, to: '/admin/amashuri/schools' },
  { label: 'Register Team', icon: UserPlus, to: '/admin/amashuri/teams' },
  { label: 'Add Athlete', icon: UserSquare2, to: '/admin/amashuri/athletes' },
  { label: 'Schedule Match', icon: CalendarDays, to: '/admin/amashuri/fixtures' },
  { label: 'Create News', icon: Newspaper, to: '/admin/news' },
];

const AkcAdminDashboard = () => {
  const { data: schoolsRes } = useQuery({ queryKey: ['aa-schools'], queryFn: () => getSchools(), retry: false });
  const { data: teamsRes } = useQuery({ queryKey: ['aa-teams'], queryFn: () => getAkcTeams(), retry: false });
  const { data: sportsRes } = useQuery({ queryKey: ['aa-sports'], queryFn: () => getAkcSports(), retry: false });
  const { data: compsRes } = useQuery({ queryKey: ['aa-comps'], queryFn: () => getChampionships(), retry: false });
  const { data: fixturesRes } = useQuery({ queryKey: ['aa-fixtures'], queryFn: () => getAkcFixtures(), retry: false });

  const schools = schoolsRes?.data || [];
  const teams = teamsRes?.data || [];
  const sports = sportsRes?.data || [];
  const comps = compsRes?.data || [];
  const fixtures = fixturesRes?.data || [];

  const live = fixtures.filter((f) => f.status === 'ONGOING');
  const today = fixtures.filter((f) => isToday(f.matchDate));
  const upcoming = fixtures.filter((f) => f.status === 'SCHEDULED');
  const completed = fixtures.filter((f) => f.status === 'COMPLETED');
  // Athletes awaiting document verification — a real pending count from the data.
  const pendingAthletes = teams.reduce((n, t) => n + (t.players || []).filter((p) => !p.docVerified).length, 0);
  const pending = [
    { label: 'Schools', value: schools.filter((s) => s.active === false).length, icon: School },
    { label: 'Teams', value: teams.filter((t) => t.status === 'PENDING').length, icon: Users },
    { label: 'Athletes', value: pendingAthletes, icon: UserSquare2 },
  ];

  const cards = [
    { icon: School, value: schools.length, label: 'Schools' },
    { icon: Users, value: teams.length, label: 'Teams', tint: '#7c3aed' },
    { icon: Medal, value: sports.length, label: 'Sports', tint: '#0d9488' },
    { icon: Trophy, value: comps.length, label: 'Competitions', tint: GOLD },
    { icon: Radio, value: live.length, label: 'Live Matches', tint: '#dc2626' },
    { icon: CalendarDays, value: today.length, label: "Today's Matches", tint: '#16a34a' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: `${GOLD}1a`, color: GOLD }}><GraduationCap size={22} /></span>
        <div>
          <h1 className="font-display text-2xl uppercase tracking-tight text-primary sm:text-3xl">Amashuri Admin</h1>
          <p className="mt-0.5 text-sm text-tertiary">The digital home of Rwandan school sports</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {cards.map((c) => <Stat key={c.label} {...c} />)}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        {/* Today's matches */}
        <div className="rounded-2xl border border-hairline bg-surface p-5">
          <h2 className="mb-4 flex items-center gap-2 font-display text-lg uppercase tracking-tight text-primary"><CalendarDays size={18} style={{ color: GOLD }} /> Today's Matches</h2>
          {fixtures.length === 0 ? (
            <p className="py-4 text-sm text-tertiary">No matches scheduled.</p>
          ) : (
            <div className="space-y-4">
              {live.length > 0 && <div><p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-red">Live</p><div className="space-y-2">{live.map((f) => <MatchRow key={f.id} fx={f} />)}</div></div>}
              {upcoming.length > 0 && <div><p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-tertiary">Upcoming</p><div className="space-y-2">{upcoming.slice(0, 3).map((f) => <MatchRow key={f.id} fx={f} />)}</div></div>}
              {completed.length > 0 && <div><p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-tertiary">Completed</p><div className="space-y-2">{completed.slice(0, 2).map((f) => <MatchRow key={f.id} fx={f} />)}</div></div>}
            </div>
          )}
        </div>

        {/* Pending approvals */}
        <div className="rounded-2xl border border-hairline bg-surface p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg uppercase tracking-tight text-primary">Pending Approvals</h2>
            <Link to="/admin/amashuri/approvals" className="text-[11px] font-bold uppercase tracking-wider text-brand-text">View all</Link>
          </div>
          <div className="space-y-2">
            {pending.map((p) => (
              <div key={p.label} className="flex items-center gap-3 rounded-xl bg-surface-2 p-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg text-tertiary"><p.icon size={16} /></span>
                <span className="flex-1 text-sm font-semibold text-primary">{p.label}</span>
                <span className="font-display text-lg font-bold tabular-nums" style={{ color: p.value > 0 ? GOLD : undefined }}>{p.value}</span>
              </div>
            ))}
          </div>
          {pending.every((p) => p.value === 0) && <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-tertiary"><CheckCircle2 size={13} className="text-green" /> Nothing awaiting review</p>}
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="mb-3 font-display text-lg uppercase tracking-tight text-primary">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {QUICK.map((a) => (
            <Link key={a.label} to={a.to} className="group rounded-2xl border border-hairline bg-surface p-4 transition-colors hover:border-[#F5B301]/50">
              <span className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: `${GOLD}1a`, color: GOLD }}><a.icon size={16} /></span>
              <p className="text-sm font-semibold text-primary">{a.label}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AkcAdminDashboard;
