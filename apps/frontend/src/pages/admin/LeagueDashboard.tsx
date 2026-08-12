import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import {
  Users, UserSquare2, CalendarDays, CheckCircle2, Clock, Target,
  PlusCircle, ClipboardCheck, Newspaper, ChevronDown, Radio,
} from 'lucide-react';
import { getLeagues, getLeague } from '../../api/endpoints/leagues';
import { getFixtures } from '../../api/endpoints/fixtures';
import apiClient from '../../api/client';
import useAuthStore from '../../store/authStore';
import ClubCrest from '../../components/ui/ClubCrest';
import Avatar from '../../components/ui/Avatar';

/**
 * LEAGUE ADMIN DASHBOARD — running ONE competition.
 *
 * The operational level: fixtures, match reports, standings, top scorers, all
 * scoped to the admin's assigned league. The league resolves from the user's
 * leagueId when present, else the first available league. Standings/top-scorers
 * are computed from approved match data, so the admin never re-enters numbers;
 * live scoring belongs to the assigned Match Reporter.
 */

const FORM_STYLE = { W: 'bg-brand/15 text-brand-text', D: 'bg-gold/15 text-gold', L: 'bg-red/15 text-red' };

const Stat = ({ icon: Icon, value, label, tint }) => (
  <div className="rounded-2xl border border-hairline bg-surface p-4">
    <div className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-tertiary">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: `${tint || '#16a34a'}1a`, color: tint || '#16a34a' }}><Icon size={14} /></span>
      {label}
    </div>
    <p className="font-display text-2xl font-bold tabular-nums text-primary">{value}</p>
  </div>
);

const Form = ({ form = '' }) => (
  <span className="flex gap-0.5">
    {form.slice(-5).split('').map((r, i) => (
      <span key={i} className={`flex h-4 w-4 items-center justify-center rounded text-[9px] font-bold ${FORM_STYLE[r] || 'bg-surface-2 text-tertiary'}`}>{r}</span>
    ))}
  </span>
);

const CHART = Array.from({ length: 15 }, (_, i) => ({ md: `MD ${i * 2 + 1}`, g: Math.round(18 + i * 5 + Math.sin(i) * 6) }));

const LeagueDashboard = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();

  // Resolve the admin's league: their assigned leagueId, else the first league.
  const { data: leaguesRes } = useQuery({ queryKey: ['la-leagues'], queryFn: () => getLeagues() });
  const leagueId = user?.leagueId ?? leaguesRes?.data?.[0]?.id ?? null;

  const { data: leagueRes } = useQuery({ queryKey: ['la-league', leagueId], queryFn: () => getLeague(leagueId), enabled: !!leagueId });
  const { data: fixturesRes } = useQuery({ queryKey: ['la-fixtures', leagueId], queryFn: () => getFixtures({ leagueId }), enabled: !!leagueId });

  const league = leagueRes?.data || {};
  const standings = league.standings || [];
  const scorers = league.topScorers || [];
  const fixtures = fixturesRes?.data || [];

  const completed = fixtures.filter((f) => f.status === 'COMPLETED');
  const upcoming = fixtures.filter((f) => f.status === 'SCHEDULED');
  const goals = standings.reduce((n, s) => n + (s.goalsFor ?? 0), 0);
  const players = standings.reduce((n, s) => n + (s.team?._count?.players ?? 0), 0);
  const season = league.season || '2025/2026';

  const cards = [
    { icon: Users, value: standings.length, label: t('dash.teams'), tint: '#16a34a' },
    { icon: UserSquare2, value: players, label: t('dash.players'), tint: '#2563eb' },
    { icon: CalendarDays, value: fixtures.length, label: t('dash.fixtures'), tint: '#7c3aed' },
    { icon: CheckCircle2, value: completed.length, label: t('dash.completed'), tint: '#16a34a' },
    { icon: Clock, value: upcoming.length, label: t('dash.upcoming'), tint: '#f5b301' },
    { icon: Target, value: goals, label: t('dash.goals'), tint: '#dc2626' },
  ];

  const QUICK = [
    { label: t('dash.q_create_fixture'), sub: t('dash.q_add_match'), icon: PlusCircle, to: '/admin/fixtures' },
    { label: t('dash.q_assign_reporter'), sub: t('dash.q_assign_match'), icon: Radio, to: '/admin/fixtures' },
    { label: t('dash.q_review_reports'), sub: t('dash.q_pending_reports'), icon: ClipboardCheck, to: '/admin/fixtures' },
    { label: t('dash.q_manage_teams'), sub: t('dash.q_participating_teams'), icon: Users, to: '/admin/teams' },
    { label: t('dash.q_manage_players'), sub: t('dash.q_league_players'), icon: UserSquare2, to: '/admin/players' },
    { label: t('dash.q_create_news'), sub: t('dash.q_publish_news'), icon: Newspaper, to: '/admin/news' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-2xl uppercase tracking-tight text-primary sm:text-3xl">{t('dash.welcome_admin', { name: user?.fullName?.split(' ')[0] || t('dash.admin') })} <span aria-hidden="true">👋</span></h1>
          <p className="mt-1 text-sm"><span className="font-semibold text-brand-text">{league.name || t('dash.your_league')}</span> <span className="text-tertiary">· {t('dash.season', { season })}</span></p>
        </div>
        <button className="inline-flex w-fit items-center gap-2 rounded-xl border border-hairline bg-surface px-3 py-2 text-sm font-semibold text-secondary">
          <CalendarDays size={15} /> {t('dash.season', { season })} <ChevronDown size={14} className="opacity-50" />
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {cards.map((c) => <Stat key={c.label} {...c} />)}
      </div>

      {/* Overview chart + upcoming + results */}
      <div className="grid gap-4 lg:grid-cols-[1fr_320px_320px]">
        <div className="rounded-2xl border border-hairline bg-surface p-5">
          <div className="mb-3"><h2 className="font-display text-lg uppercase tracking-tight text-primary">{t('dash.league_overview')}</h2><p className="text-xs text-tertiary">{t('dash.league_overview_sub')}</p></div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={CHART} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs><linearGradient id="lg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#16a34a" stopOpacity={0.35} /><stop offset="100%" stopColor="#16a34a" stopOpacity={0} /></linearGradient></defs>
                <XAxis dataKey="md" tick={{ fontSize: 9, fill: 'currentColor' }} className="text-tertiary" interval={2} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                <Area type="monotone" dataKey="g" stroke="#16a34a" strokeWidth={2} fill="url(#lg)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Upcoming fixtures */}
        <div className="rounded-2xl border border-hairline bg-surface p-5">
          <div className="mb-3 flex items-center justify-between"><h2 className="font-display text-lg uppercase tracking-tight text-primary">{t('dash.upcoming_fixtures')}</h2><Link to="/admin/fixtures" className="text-[11px] font-bold uppercase tracking-wider text-brand-text">{t('dash.view_all')}</Link></div>
          <div className="space-y-3">
            {upcoming.slice(0, 3).map((f, i) => (
              <Link key={f.id} to={`/matches/${f.id}`} className="block border-b border-hairline/60 pb-3 last:border-0 last:pb-0">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-[11px] tabular-nums text-tertiary">{f.matchDate ? format(new Date(f.matchDate), 'd MMM · HH:mm') : 'TBD'}</span>
                  <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase ${i % 2 === 0 ? 'bg-brand/10 text-brand-text' : 'bg-gold/10 text-gold'}`}>{i % 2 === 0 ? t('dash.assigned') : t('dash.pending')}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <ClubCrest team={f.homeTeam} size="sm" /><span className="min-w-0 flex-1 truncate font-semibold text-primary">{f.homeTeam?.name}</span>
                  <span className="text-tertiary">{t('dash.vs')}</span>
                  <span className="min-w-0 flex-1 truncate text-right font-semibold text-primary">{f.awayTeam?.name}</span><ClubCrest team={f.awayTeam} size="sm" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent results */}
        <div className="rounded-2xl border border-hairline bg-surface p-5">
          <div className="mb-3 flex items-center justify-between"><h2 className="font-display text-lg uppercase tracking-tight text-primary">{t('dash.recent_results')}</h2><Link to="/results" className="text-[11px] font-bold uppercase tracking-wider text-brand-text">{t('dash.view_all')}</Link></div>
          <div className="space-y-3">
            {completed.slice(0, 3).map((f) => (
              <Link key={f.id} to={`/matches/${f.id}`} className="flex items-center gap-2 border-b border-hairline/60 pb-3 text-sm last:border-0 last:pb-0">
                <ClubCrest team={f.homeTeam} size="sm" /><span className="min-w-0 flex-1 truncate text-primary">{f.homeTeam?.name}</span>
                <span className="shrink-0 font-display font-bold tabular-nums text-primary">{f.homeScore}-{f.awayScore}</span>
                <span className="min-w-0 flex-1 truncate text-right text-primary">{f.awayTeam?.name}</span><ClubCrest team={f.awayTeam} size="sm" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Standings + top scorers */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-hairline bg-surface p-5">
          <div className="mb-4 flex items-center justify-between"><h2 className="font-display text-lg uppercase tracking-tight text-primary">{t('dash.league_standings')}</h2><Link to={`/leagues/${leagueId}`} className="text-[11px] font-bold uppercase tracking-wider text-brand-text">{t('dash.full_table')}</Link></div>
          <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full min-w-[520px] text-left">
              <thead><tr className="text-[9px] font-bold uppercase tracking-widest text-tertiary"><th className="pb-2 pr-2">#</th><th className="pb-2">{t('dash.col_team')}</th><th className="pb-2 px-1 text-center">{t('dash.col_p')}</th><th className="pb-2 px-1 text-center">{t('dash.col_w')}</th><th className="pb-2 px-1 text-center">{t('dash.col_d')}</th><th className="pb-2 px-1 text-center">{t('dash.col_l')}</th><th className="pb-2 px-1 text-center">{t('dash.col_gd')}</th><th className="pb-2 px-1 text-center">{t('dash.col_pts')}</th><th className="pb-2 pl-2">{t('dash.col_form')}</th></tr></thead>
              <tbody>
                {standings.slice(0, 6).map((s, i) => {
                  const gd = (s.goalsFor ?? 0) - (s.goalsAgainst ?? 0);
                  return (
                    <tr key={s.id ?? i} className="border-t border-hairline/60">
                      <td className="py-2 pr-2 text-sm tabular-nums text-tertiary">{i + 1}</td>
                      <td className="py-2"><div className="flex min-w-0 items-center gap-2"><ClubCrest team={s.team} size="sm" /><span className="truncate text-sm font-medium text-primary">{s.team?.name}</span></div></td>
                      <td className="py-2 px-1 text-center text-sm tabular-nums text-secondary">{s.played}</td>
                      <td className="py-2 px-1 text-center text-sm tabular-nums text-secondary">{s.won}</td>
                      <td className="py-2 px-1 text-center text-sm tabular-nums text-secondary">{s.drawn}</td>
                      <td className="py-2 px-1 text-center text-sm tabular-nums text-secondary">{s.lost}</td>
                      <td className="py-2 px-1 text-center text-sm tabular-nums text-secondary">{gd > 0 ? `+${gd}` : gd}</td>
                      <td className="py-2 px-1 text-center text-sm font-bold tabular-nums text-primary">{s.points}</td>
                      <td className="py-2 pl-2"><Form form={s.form} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-hairline bg-surface p-5">
          <div className="mb-4 flex items-center justify-between"><h2 className="font-display text-lg uppercase tracking-tight text-primary">{t('dash.top_scorers')}</h2><Link to={`/leagues/${leagueId}`} className="text-[11px] font-bold uppercase tracking-wider text-brand-text">{t('dash.view_all')}</Link></div>
          <div className="space-y-1">
            {scorers.slice(0, 5).map((s, i) => (
              <div key={s.id ?? i} className="flex items-center gap-3 border-b border-hairline/60 py-2 last:border-0">
                <span className="w-4 text-sm tabular-nums text-tertiary">{i + 1}</span>
                <Avatar src={s.player?.photo} name={s.player?.fullName} size="sm" />
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-primary">{s.player?.fullName}</p><p className="truncate text-[11px] text-tertiary">{s.team?.name}</p></div>
                <span className="shrink-0 font-display text-lg font-bold tabular-nums text-primary">{s.goals}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="mb-3 font-display text-lg uppercase tracking-tight text-primary">{t('dash.quick_actions')}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {QUICK.map((a) => (
            <Link key={a.label} to={a.to} className="group relative rounded-2xl border border-hairline bg-surface p-4 transition-colors hover:border-brand/40">
              <span className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10 text-brand"><a.icon size={16} /></span>
              <p className="text-sm font-semibold text-primary">{a.label}</p>
              <p className="text-[11px] text-tertiary">{a.sub}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LeagueDashboard;
