import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import {
  Users, UserSquare2, CalendarDays, CheckCircle2, Clock, Target,
  PlusCircle, ClipboardCheck, Newspaper, ChevronDown, Radio, ArrowRight,
} from 'lucide-react';
import { getLeagues, getLeague } from '../../api/endpoints/leagues';
import { getFixtures } from '../../api/endpoints/fixtures';
import useAuthStore from '../../store/authStore';
import { PageHeader, StatCard, Panel, TableWrap, Th, Td } from '../../components/admin/AdminUI';
import { Avatar, Button, ClubCrest, EmptyState, cn } from '../../components/ui';

/**
 * LEAGUE ADMIN DASHBOARD — running ONE competition.
 *
 * The operational level: fixtures, match reports, standings, top scorers, all
 * scoped to the admin's assigned league. The league resolves from the user's
 * leagueId when present, else the first available league. Standings/top-scorers
 * are computed from approved match data, so the admin never re-enters numbers;
 * live scoring belongs to the assigned Match Reporter.
 *
 * A LEAGUE_ADMIN lands here INSTEAD of AdminDashboard, so it is the same screen
 * at a league's scope: the same PageHeader, the same stat grid, the same Panel
 * rhythm and the same chart treatment, all from components/admin/AdminUI.
 */

/**
 * Win / draw / loss, in the only three treatments the token system offers for a
 * result: brand for a win, a neutral surface for a draw, danger for a loss. The
 * old map reached for `bg-gold/15` and `text-red`, neither of which is a token.
 */
const FORM_STYLE = {
  W: 'bg-brand-tint text-brand-text',
  D: 'bg-surface-2 text-secondary',
  L: 'bg-danger/10 text-danger-text',
};

const Form = ({ form = '' }) => (
  <span className="flex gap-0.5">
    {form.slice(-5).split('').map((r, i) => (
      <span
        key={i}
        className={cn(
          'flex h-5 w-5 items-center justify-center rounded-badge text-xs font-semibold',
          FORM_STYLE[r] || 'bg-surface-2 text-tertiary'
        )}
      >
        {r}
      </span>
    ))}
  </span>
);


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

  /**
   * REAL GOALS. This panel drew a sine wave — `Math.round(18 + i * 5 + Math.sin(i) * 6)`
   * over fifteen invented matchdays — on the screen a league administrator uses to
   * judge their own competition. The Fixture model has no matchday column, so the
   * honest grouping is by month of kick-off, summing the scores of matches that
   * have actually been played.
   */
  const goalsByMonth = React.useMemo(() => {
    const buckets = new Map<string, number>();
    fixtures.forEach((f) => {
      if (f.status !== 'COMPLETED' || !f.matchDate) return;
      const d = new Date(f.matchDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      buckets.set(key, (buckets.get(key) ?? 0) + (f.homeScore ?? 0) + (f.awayScore ?? 0));
    });
    return [...buckets.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, g]) => ({ md: format(new Date(`${key}-01T00:00:00`), 'MMM yyyy'), g }));
  }, [fixtures]);

  const cards = [
    { icon: Users, value: standings.length, label: t('dash.teams'), tone: 'brand' as const },
    { icon: UserSquare2, value: players, label: t('dash.players') },
    { icon: CalendarDays, value: fixtures.length, label: t('dash.fixtures') },
    { icon: CheckCircle2, value: completed.length, label: t('dash.completed') },
    { icon: Clock, value: upcoming.length, label: t('dash.upcoming') },
    { icon: Target, value: goals, label: t('dash.goals') },
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
    <div>
      <PageHeader
        title={t('dash.welcome_admin', { name: user?.fullName?.split(' ')[0] || t('dash.admin') })}
        subtitle={
          <>
            <span className="font-medium text-primary">{league.name || t('dash.your_league')}</span>
            <span className="text-tertiary"> · {t('dash.season', { season })}</span>
          </>
        }
        actions={
          <Button variant="secondary" size="sm" icon={CalendarDays}>
            {t('dash.season', { season })}
            <ChevronDown size={14} className="text-tertiary" aria-hidden="true" />
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {cards.map((c) => <StatCard key={String(c.label)} {...c} />)}
      </div>

      {/* Overview chart + upcoming + results */}
      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <Panel title={t('dash.league_overview')} hint={t('dash.league_overview_sub')}>
          {goalsByMonth.length === 0 ? (
            <EmptyState icon={Target} title={t('dash.goals')} hint={t('dash.league_overview_sub')} />
          ) : (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={goalsByMonth} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#16a34a" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#16a34a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="rgb(var(--hairline))" />
                <XAxis
                  dataKey="md" tick={{ fontSize: 11, fill: 'currentColor' }} className="text-tertiary"
                  interval="preserveStartEnd" minTickGap={24} axisLine={false} tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'currentColor' }} className="text-tertiary"
                  width={40} allowDecimals={false} axisLine={false} tickLine={false}
                />
                <Tooltip
                  cursor={{ stroke: 'rgb(var(--hairline))' }}
                  contentStyle={{
                    borderRadius: 10, fontSize: 12, padding: '6px 10px',
                    background: 'rgb(var(--surface))', border: '1px solid rgb(var(--hairline))',
                    color: 'rgb(var(--text))',
                  }}
                  labelStyle={{ color: 'rgb(var(--text-3))' }}
                />
                <Area type="monotone" dataKey="g" stroke="#16a34a" strokeWidth={2} fill="url(#lg)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          )}
        </Panel>

        {/* Upcoming fixtures */}
        <Panel title={t('dash.upcoming_fixtures')} action={t('dash.view_all')} actionTo="/admin/fixtures">
          <div className="space-y-3">
            {upcoming.slice(0, 3).map((f) => (
              <Link key={f.id} to={`/matches/${f.id}`} className="block border-b border-hairline pb-3 last:border-0 last:pb-0">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="text-xs tabular-nums text-tertiary">
                    {f.matchDate ? format(new Date(f.matchDate), 'd MMM · HH:mm') : t('common.tbd')}
                  </span>
                  {/* This said "Assigned" or "Pending" on alternating rows —
                      `i % 2 === 0` — so a league admin read an officiating status
                      off the fixture's position in the list. There is no such field
                      on a Fixture; the venue is real and is what they actually need
                      beside a kickoff time. */}
                  {f.venue && <span className="truncate text-xs text-tertiary">{f.venue}</span>}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <ClubCrest team={f.homeTeam} size="sm" />
                  <span className="min-w-0 flex-1 truncate font-medium text-primary">{f.homeTeam?.name}</span>
                  <span className="text-tertiary">{t('dash.vs')}</span>
                  <span className="min-w-0 flex-1 truncate text-right font-medium text-primary">{f.awayTeam?.name}</span>
                  <ClubCrest team={f.awayTeam} size="sm" />
                </div>
              </Link>
            ))}
          </div>
        </Panel>

        {/* Recent results */}
        <Panel title={t('dash.recent_results')} action={t('dash.view_all')} actionTo="/results">
          <div className="space-y-3">
            {completed.slice(0, 3).map((f) => (
              <Link
                key={f.id}
                to={`/matches/${f.id}`}
                className="flex items-center gap-2 border-b border-hairline pb-3 text-sm last:border-0 last:pb-0"
              >
                <ClubCrest team={f.homeTeam} size="sm" />
                <span className="min-w-0 flex-1 truncate text-primary">{f.homeTeam?.name}</span>
                <span className="shrink-0 font-semibold tabular-nums text-primary">{f.homeScore}-{f.awayScore}</span>
                <span className="min-w-0 flex-1 truncate text-right text-primary">{f.awayTeam?.name}</span>
                <ClubCrest team={f.awayTeam} size="sm" />
              </Link>
            ))}
          </div>
        </Panel>
      </div>

      {/* Standings + top scorers */}
      <div className="mt-4 grid items-start gap-4 lg:grid-cols-2">
        <Panel title={t('dash.league_standings')} action={t('dash.full_table')} actionTo={`/leagues/${leagueId}`} flush>
          <TableWrap>
            <table className="w-full min-w-[560px] text-left">
              <thead>
                <tr>
                  <Th>#</Th>
                  <Th>{t('dash.col_team')}</Th>
                  <Th align="right">{t('dash.col_p')}</Th>
                  <Th align="right">{t('dash.col_w')}</Th>
                  <Th align="right">{t('dash.col_d')}</Th>
                  <Th align="right">{t('dash.col_l')}</Th>
                  <Th align="right">{t('dash.col_gd')}</Th>
                  <Th align="right">{t('dash.col_pts')}</Th>
                  <Th>{t('dash.col_form')}</Th>
                </tr>
              </thead>
              <tbody>
                {standings.slice(0, 6).map((s, i) => {
                  const gd = (s.goalsFor ?? 0) - (s.goalsAgainst ?? 0);
                  return (
                    <tr key={s.id ?? i} className="transition-colors duration-150 ease-standard hover:bg-surface-2">
                      <Td className="tabular-nums text-tertiary">{i + 1}</Td>
                      <Td>
                        <div className="flex min-w-0 items-center gap-2">
                          <ClubCrest team={s.team} size="sm" />
                          <span className="truncate font-medium text-primary">{s.team?.name}</span>
                        </div>
                      </Td>
                      <Td align="right">{s.played}</Td>
                      <Td align="right">{s.won}</Td>
                      <Td align="right">{s.drawn}</Td>
                      <Td align="right">{s.lost}</Td>
                      <Td align="right">{gd > 0 ? `+${gd}` : gd}</Td>
                      <Td align="right" className="font-semibold text-primary">{s.points}</Td>
                      <Td><Form form={s.form} /></Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableWrap>
        </Panel>

        <Panel title={t('dash.top_scorers')} action={t('dash.view_all')} actionTo={`/leagues/${leagueId}`}>
          <ul className="space-y-1">
            {scorers.slice(0, 5).map((s, i) => (
              <li key={s.id ?? i} className="flex items-center gap-3 border-b border-hairline py-2 last:border-0">
                <span className="w-4 text-sm tabular-nums text-tertiary">{i + 1}</span>
                <Avatar src={s.player?.photo} name={s.player?.fullName} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-primary">{s.player?.fullName}</p>
                  <p className="truncate text-xs text-tertiary">{s.team?.name}</p>
                </div>
                <span className="shrink-0 font-display text-lg font-bold tabular-nums text-primary">{s.goals}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      {/* Quick actions */}
      <div className="mt-4">
        <Panel title={t('dash.quick_actions')}>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {QUICK.map((a) => (
              <Link
                key={a.label}
                to={a.to}
                className="group flex min-h-tap flex-col justify-center rounded-control border border-hairline bg-surface-2 p-3 transition-colors duration-150 ease-standard hover:border-brand/40 hover:bg-surface"
              >
                <span className="mb-2 flex h-8 w-8 items-center justify-center rounded-control bg-brand-tint text-brand-text">
                  <a.icon size={15} aria-hidden="true" />
                </span>
                <p className="text-sm font-medium text-primary">{a.label}</p>
                <p className="flex items-center gap-1 text-xs text-tertiary">
                  {a.sub}
                  <ArrowRight size={12} className="shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </p>
              </Link>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
};

export default LeagueDashboard;
