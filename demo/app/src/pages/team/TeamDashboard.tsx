import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { differenceInCalendarDays, format } from 'date-fns';
import {
  Users, CalendarDays, ClipboardList, FileText, MessageSquare, ShieldCheck, Clock,
  UserPlus, ImageIcon, AlertTriangle, ArrowRight, Shield, Users2, LayoutTemplate, Newspaper, Settings, Activity,
} from 'lucide-react';
import apiClient from '../../api/client';
import { getFixtures } from '../../api/endpoints/fixtures';
import { getLeague } from '../../api/endpoints/leagues';
import ClubCrest from '../../components/ui/ClubCrest';

/**
 * TEAM ADMIN DASHBOARD — the club-management portal for ONE team (APR FC here).
 *
 * Everything is scoped to the admin's assigned team (teamId from the token in
 * the real app). The Team Admin prepares lineups and manages the squad, staff,
 * content and news — but NEVER modifies official fixtures, scores or standings
 * (those come from the competition system, read-only here).
 */

const TEAM_ID = 1;

const Stat = ({ icon: Icon, value, label, sub, tone }) => (
  <div className="rounded-2xl border border-hairline bg-surface p-4">
    <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-tertiary">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/10 text-brand"><Icon size={14} /></span>{label}
    </div>
    <p className={`font-display text-2xl font-bold ${tone === 'ok' ? 'text-brand-text' : 'text-primary'}`}>{value}</p>
    {sub && <p className="mt-0.5 text-[11px] text-tertiary">{sub}</p>}
  </div>
);

const MANAGE = [
  { label: 'Team Profile', sub: 'Team information & branding', icon: Shield, to: '/team/profile' },
  { label: 'Players', sub: 'View and manage your squad', icon: Users, to: '/team/players' },
  { label: 'Staff Management', sub: 'Coaches & team officials', icon: Users2, to: '/team/staff' },
  { label: 'Documents', sub: 'Upload & manage documents', icon: FileText, to: '/team/documents' },
  { label: 'Media Library', sub: 'Photos, videos & media', icon: ImageIcon, to: '/team/media' },
  { label: 'Lineups', sub: 'Create & submit lineups', icon: ClipboardList, to: '/team/lineups' },
  { label: 'Fixtures', sub: 'View fixtures & results', icon: CalendarDays, to: '/team/fixtures' },
  { label: 'Team Content', sub: 'Manage your public page', icon: LayoutTemplate, to: '/team/content' },
  { label: 'News', sub: 'Publish news & updates', icon: Newspaper, to: '/team/news' },
  { label: 'Settings', sub: 'Team preferences', icon: Settings, to: '/team/settings' },
];

const TeamDashboard = () => {
  const { data: teamRes } = useQuery({ queryKey: ['tm-me'], queryFn: async () => (await apiClient.get('/teams/my')).data });
  const { data: fixturesRes } = useQuery({ queryKey: ['tm-fixtures'], queryFn: () => getFixtures({ teamId: TEAM_ID }) });
  const { data: leagueRes } = useQuery({ queryKey: ['tm-standings'], queryFn: () => getLeague(1) });
  const { data: activityRes } = useQuery({ queryKey: ['tm-activity'], queryFn: async () => (await apiClient.get('/activity', { params: { limit: 5 } })).data });

  const team = teamRes?.data || {};
  const players = team.players || [];
  const fixtures = fixturesRes?.data || [];
  const standings = leagueRes?.data?.standings || [];
  const activity = activityRes?.data || [];

  const next = fixtures.filter((f) => f.status === 'SCHEDULED').sort((a, b) => new Date(a.matchDate) - new Date(b.matchDate))[0];
  const opponent = next ? (next.homeTeamId === TEAM_ID ? next.awayTeam : next.homeTeam) : null;
  const daysToNext = next?.matchDate ? Math.max(0, differenceInCalendarDays(new Date(next.matchDate), new Date())) : null;
  const verified = (team.status || 'VERIFIED') === 'VERIFIED';

  const cards = [
    { icon: Users, value: players.length || 24, label: 'Players', sub: 'Active squad' },
    { icon: CalendarDays, value: daysToNext != null ? `${daysToNext} days` : '—', label: 'Upcoming Match', sub: opponent ? `vs ${opponent.name}` : 'No match' },
    { icon: ClipboardList, value: 1, label: 'Pending Lineup', sub: 'Needs confirmation' },
    { icon: FileText, value: 2, label: 'Documents', sub: 'Pending verification' },
    { icon: MessageSquare, value: 3, label: 'Messages', sub: 'Unread messages' },
    { icon: ShieldCheck, value: verified ? 'Verified' : 'Pending', label: 'Team Status', sub: verified ? 'Team verified' : 'Awaiting review', tone: verified ? 'ok' : undefined },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl uppercase tracking-tight text-primary sm:text-3xl">Welcome back, {team.name || 'APR FC'}! <span aria-hidden="true">👋</span></h1>
        <p className="mt-1 text-sm text-tertiary">Manage your team, players, fixtures and match preparations.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {cards.map((c) => <Stat key={c.label} {...c} />)}
      </div>

      {/* Activity + Next fixture + Standings */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Recent activity */}
        <div className="rounded-2xl border border-hairline bg-surface p-5">
          <div className="mb-4 flex items-center justify-between"><h2 className="font-display text-lg uppercase tracking-tight text-primary">Recent Activity</h2><Link to="/team/players" className="text-[11px] font-bold uppercase tracking-wider text-brand-text">View all</Link></div>
          <div className="space-y-3">
            {activity.slice(0, 5).map((log) => (
              <div key={log.id} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-tertiary"><Activity size={13} /></span>
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-primary">{String(log.action || '').replace(/_/g, ' ')}</p><p className="truncate text-[11px] text-tertiary">{log.detail || log.pagePath}</p></div>
                <span className="shrink-0 text-[10px] text-tertiary">{log.createdAt ? format(new Date(log.createdAt), 'HH:mm') : ''}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Next fixture */}
        <div className="rounded-2xl border border-hairline bg-surface p-5">
          <div className="mb-3 flex items-center justify-between"><h2 className="font-display text-lg uppercase tracking-tight text-primary">Next Fixture</h2><Link to="/team/fixtures" className="text-[11px] font-bold uppercase tracking-wider text-brand-text">Calendar</Link></div>
          {next ? (
            <>
              <p className="mb-3 text-center text-[10px] font-bold uppercase tracking-widest text-tertiary">{next.league?.name}</p>
              <div className="flex items-center justify-around gap-2">
                <div className="flex flex-col items-center gap-1.5"><ClubCrest team={next.homeTeam} size="lg" /><span className="max-w-[80px] truncate text-xs font-bold text-primary">{next.homeTeam?.name}</span></div>
                <span className="font-display text-lg text-tertiary">VS</span>
                <div className="flex flex-col items-center gap-1.5"><ClubCrest team={next.awayTeam} size="lg" /><span className="max-w-[80px] truncate text-xs font-bold text-primary">{next.awayTeam?.name}</span></div>
              </div>
              <div className="mt-3 flex flex-wrap justify-center gap-x-3 gap-y-1 text-[11px] text-tertiary">
                <span>{next.matchDate ? format(new Date(next.matchDate), 'd MMM yyyy') : 'TBD'}</span>
                <span>{next.matchDate ? format(new Date(next.matchDate), 'HH:mm') : ''}</span>
                <span>{next.venue}</span>
              </div>
              <div className="mt-3 flex items-start gap-2 rounded-xl bg-gold/10 p-2.5 text-[11px] text-gold">
                <AlertTriangle size={13} className="mt-0.5 shrink-0" /> <span><b>Lineup not submitted.</b> Please submit your starting lineup before match day.</span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Link to="/team/lineups" className="rounded-xl bg-brand-strong py-2 text-center text-sm font-bold text-white">Prepare Lineup</Link>
                <Link to={`/matches/${next.id}`} className="rounded-xl border border-hairline py-2 text-center text-sm font-semibold text-secondary">Match Details</Link>
              </div>
            </>
          ) : <p className="py-6 text-center text-sm text-tertiary">No upcoming fixtures.</p>}
        </div>

        {/* League standings */}
        <div className="rounded-2xl border border-hairline bg-surface p-5">
          <div className="mb-3 flex items-center justify-between"><h2 className="font-display text-lg uppercase tracking-tight text-primary">League Standings</h2><Link to="/leagues/1" className="text-[11px] font-bold uppercase tracking-wider text-brand-text">Full table</Link></div>
          <table className="w-full text-left">
            <thead><tr className="text-[9px] font-bold uppercase tracking-widest text-tertiary"><th className="pb-2 pr-2">#</th><th className="pb-2">Team</th><th className="pb-2 text-right">P</th><th className="pb-2 pl-2 text-right">Pts</th></tr></thead>
            <tbody>
              {standings.slice(0, 5).map((s, i) => (
                <tr key={s.id ?? i} className={`border-t border-hairline/60 ${s.team?.id === TEAM_ID ? 'font-bold' : ''}`}>
                  <td className="py-2 pr-2 text-sm tabular-nums text-tertiary">{i + 1}</td>
                  <td className="py-2"><div className="flex min-w-0 items-center gap-2"><ClubCrest team={s.team} size="sm" /><span className="truncate text-sm text-primary">{s.team?.name}</span></div></td>
                  <td className="py-2 text-right text-sm tabular-nums text-secondary">{s.played}</td>
                  <td className="py-2 pl-2 text-right text-sm font-bold tabular-nums text-primary">{s.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Team management grid */}
      <div>
        <h2 className="mb-3 font-display text-lg uppercase tracking-tight text-primary">Team Management</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {MANAGE.map((m) => (
            <Link key={m.label} to={m.to} className="group flex flex-col items-center gap-2 rounded-2xl border border-hairline bg-surface p-5 text-center transition-all hover:-translate-y-0.5 hover:border-brand/40">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/10 text-brand transition-transform group-hover:scale-110"><m.icon size={20} /></span>
              <p className="text-sm font-bold text-primary">{m.label}</p>
              <p className="text-[11px] leading-tight text-tertiary">{m.sub}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TeamDashboard;
