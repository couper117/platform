import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  AlertTriangle, Check, ChevronRight, Clock3, FileText, MapPin, Radio, Users,
} from 'lucide-react';
import { Panel } from '../../components/admin/AdminUI';
import SeasonStrip, { SeasonStripSkeleton } from '../../components/team/SeasonStrip';
import { OpponentLine, CoveredBy, FixtureRow, WatchLive, Fact } from '../../components/team/TeamUI';
import { FormStrip } from '../../components/match/StandingsTable';
import { Button, ClubCrest, EmptyState, ErrorState, Skeleton, StatusPill, cn } from '../../components/ui';
import useMyTeam, { useTeamFixtures } from '../../hooks/useMyTeam';
import { getMatch, getDocumentRequirements } from '../../api/endpoints/team';
import { getLeague } from '../../api/endpoints/leagues';
import {
  homeOrAway, matchTasks, missingDocuments, opponentOf, timeUntil,
} from '../../lib/coachMatch';
import { tickClock, stampClock, PERIOD_LABEL } from '../../utils/matchClock';

/**
 * THE CLUB — the coach's home.
 *
 * WHAT THIS REPLACED, AND WHY IT WAS WRONG. The first version of this screen was
 * the reporter's "Today" with club data poured into it: a live card, a next
 * match, four counting tiles, two lists. That is the right shape for somebody
 * whose question is "what am I covering today", and the wrong one for somebody
 * who runs a football club. A coach opening this on a Tuesday saw an empty live
 * slot, a match four days off, and four admin figures.
 *
 * The question a coach actually opens with is "where are we, and are we ready" —
 * and the first half of that was NOWHERE on the page, even though `/teams/my`
 * has been returning the full league table the whole time. So:
 *
 *   1 · Where are we      → SeasonStrip: position, points, record, form.
 *   2 · What is next, and → the match card: opponent, countdown, the team sheet,
 *       are we ready         and who is covering it.
 *   3 · Can we field a    → squad and documents, counted as PLAYERS not as rows,
 *       team                 because a coach counts people.
 *   4 · How is it going   → the table around us, and the last five results.
 *
 * POSITION COMES FROM THE LEAGUE ENDPOINT, NOT FROM ARITHMETIC HERE.
 * `/teams/my` includes the standings but in no particular order and without the
 * other clubs' names, so ranking them on this page would mean re-implementing
 * the server's comparator — and the first time the two drifted, a coach would
 * read 3rd here and 4th on the public table. `GET /leagues/:id` already sorts
 * them and attaches `rank`, so this asks for that and trusts it.
 *
 * WHY THERE IS NO "AVAILABLE PLAYERS" FIGURE. A squad-wide count would have to
 * exclude suspended players, and a ban is only readable one player at a time:
 * `GET /players/:id` carries it (a TEAM_MANAGER is in the server's
 * PERSONAL_DATA_ROLES) but the players LIST does not, so an honest figure here
 * would cost one request per player. The player profile shows a ban properly;
 * this page does not print a number that would quietly exclude what it cannot
 * see.
 */

/* ── the club's side of the next match ───────────────────────────────────── */

/** A tick or a warning, and the sentence that says what it costs. */
const TaskRow = ({ task }: { task: any }) => (
  <div className="flex items-start gap-2.5">
    <span
      className={cn(
        'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-pill',
        task.done ? 'bg-brand-tint text-brand-text' : 'bg-live/10 text-live'
      )}
    >
      {task.done ? <Check size={12} aria-hidden="true" /> : <AlertTriangle size={12} aria-hidden="true" />}
    </span>
    <div className="min-w-0">
      <p className="text-sm font-medium text-primary">{task.label}</p>
      {!task.done && <p className="mt-0.5 text-sm text-secondary">{task.why}</p>}
    </div>
  </div>
);

/* ── a counting card that counts people ──────────────────────────────────── */

const CountCard = ({
  icon: Icon,
  value,
  label,
  hint,
  to,
  warn = false,
}: {
  icon: any;
  value: React.ReactNode;
  label: string;
  hint?: React.ReactNode;
  to: string;
  warn?: boolean;
}) => (
  <Link
    to={to}
    className="group block rounded-card border border-hairline bg-surface p-4 transition-colors duration-150 ease-standard hover:border-brand/40 hover:bg-surface-2"
  >
    <div className="flex items-start justify-between gap-3">
      <p className="font-display text-3xl font-bold tabular-nums leading-none text-primary">{value}</p>
      <span
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-control',
          warn ? 'bg-live/10 text-live' : 'bg-surface-2 text-tertiary'
        )}
      >
        <Icon size={16} aria-hidden="true" />
      </span>
    </div>
    <p className="mt-3 text-sm font-medium text-primary">{label}</p>
    {hint && <p className="mt-0.5 text-xs text-tertiary">{hint}</p>}
  </Link>
);

/* ── the table, around us ────────────────────────────────────────────────── */

/**
 * Three rows: the club, and the one directly above and below it.
 *
 * A coach does not need the whole table on a dashboard — they need to know who
 * they are chasing and who is chasing them, which is the only part of it that
 * changes what they do this week. The full table is one tap away.
 */
const TableAround = ({ rows, teamId }: { rows: any[]; teamId?: number | null }) => {
  const index = rows.findIndex((r: any) => r.teamId === teamId);
  if (index === -1) return null;
  const slice = rows.slice(Math.max(0, index - 1), index + 2);

  return (
    <ul className="divide-y divide-hairline">
      {slice.map((row: any) => {
        const ours = row.teamId === teamId;
        const gd = (row.goalsFor ?? 0) - (row.goalsAgainst ?? 0);
        return (
          <li
            key={row.teamId}
            className={cn('flex items-center gap-3 px-1 py-2.5', ours && 'bg-brand-tint/40')}
          >
            <span className={cn('w-6 shrink-0 text-center text-sm tabular-nums', ours ? 'font-bold text-brand-text' : 'text-tertiary')}>
              {row.rank}
            </span>
            <ClubCrest team={row.team} size="md" />
            <span className={cn('min-w-0 flex-1 truncate text-sm', ours ? 'font-semibold text-primary' : 'text-secondary')}>
              {row.team?.shortName || row.team?.name || '—'}
            </span>
            <span className="w-8 shrink-0 text-right text-xs tabular-nums text-tertiary">
              {gd > 0 ? `+${gd}` : gd}
            </span>
            <span className={cn('w-7 shrink-0 text-right text-sm font-semibold tabular-nums', ours ? 'text-brand-text' : 'text-primary')}>
              {row.points ?? 0}
            </span>
          </li>
        );
      })}
    </ul>
  );
};

/* ── the page ────────────────────────────────────────────────────────────── */

const TeamDashboard = () => {
  const teamQuery = useMyTeam();
  const team = teamQuery.data;
  const teamId = team?.id ?? null;

  const fixtures = useTeamFixtures(teamId);
  const { live, scheduled, week, completed } = fixtures;

  // Every competition the club is entered in. Nearly always one.
  const leagues = useMemo(
    () => (team?.leagues || []).map((row: any) => row.league).filter(Boolean),
    [team]
  );
  const [leagueId, setLeagueId] = useState<number | null>(null);
  const activeLeagueId = leagueId ?? leagues[0]?.id ?? null;

  // The ranked table, from the endpoint that ranks it. See the header comment.
  const leagueQuery = useQuery({
    queryKey: ['league', activeLeagueId],
    queryFn: () => getLeague(activeLeagueId!),
    enabled: !!activeLeagueId,
    staleTime: 5 * 60 * 1000,
  });
  const standings = leagueQuery.data?.data?.standings || [];
  const ourRow = standings.find((r: any) => r.teamId === teamId) || null;

  const liveMatch = live[0] || null;
  const nextMatch = scheduled[0] || null;
  const focus = liveMatch || nextMatch;

  /**
   * The focused match in full.
   *
   * A fixture LIST row carries no `lineups` and no `liveState`, so neither the
   * readiness of our team sheet nor a ticking minute can be read from it. Same
   * query key as the coach's match page and the reporter's console, so opening
   * either renders from cache.
   */
  const focusDetail = useQuery({
    queryKey: ['match-details', focus?.id],
    queryFn: async () => {
      const match = await getMatch(focus!.id);
      return { ...match, clock: stampClock(match.clock) };
    },
    enabled: !!focus?.id,
  });
  const detail = focusDetail.data;

  const requirements = useQuery({
    queryKey: ['document-requirements'],
    queryFn: getDocumentRequirements,
    staleTime: 10 * 60 * 1000,
  });

  const [now, setNow] = useState(() => Date.now());
  const clock = detail?.clock;
  // One interval, only while a clock is actually running.
  useEffect(() => {
    if (!clock?.running) return undefined;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [clock?.running]);

  if (teamQuery.isLoading) {
    return (
      <div>
        <SeasonStripSkeleton />
        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
          <Skeleton className="h-64 w-full rounded-card" />
          <div className="space-y-4">
            <Skeleton className="h-32 w-full rounded-card" />
            <Skeleton className="h-32 w-full rounded-card" />
          </div>
        </div>
      </div>
    );
  }

  if (teamQuery.isError) {
    return (
      <ErrorState
        title="Could not load your club"
        hint="This is a connection problem, not a change to your club."
        onRetry={() => teamQuery.refetch()}
      />
    );
  }

  // A manager whose club was deactivated, or who has not been attached to one.
  if (!team) {
    return (
      <EmptyState
        icon={Users}
        title="No club on this account"
        hint="A league admin attaches a manager to a club. Until that happens there is nothing here to run."
      />
    );
  }

  const docs = missingDocuments(team.players || [], requirements.data?.requiredDocTypes || []);
  const minute = tickClock(clock, now);
  const tasks = detail ? matchTasks(detail, teamId) : [];
  const recent = completed.slice(0, 5);

  return (
    <div>
      {/* 1 · Where are we. */}
      {leagueQuery.isLoading && activeLeagueId ? (
        <SeasonStripSkeleton />
      ) : (
        <SeasonStrip
          team={team}
          league={leagues.find((l: any) => l.id === activeLeagueId) || null}
          standing={ourRow}
          rankOf={ourRow?.rank ?? null}
          leagues={leagues}
          activeLeagueId={activeLeagueId}
          onSelectLeague={setLeagueId}
        />
      )}

      <div className="mt-4 grid items-start gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        {/* 2 · What is next, and are we ready. */}
        <section
          className={cn(
            'rounded-card border bg-surface p-4 sm:p-5',
            liveMatch ? 'border-live/40' : 'border-hairline'
          )}
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-tertiary">
              {liveMatch ? (
                <span className="inline-flex items-center gap-1.5 text-live">
                  <Radio size={13} className="animate-pulse" aria-hidden="true" />
                  Playing now
                </span>
              ) : (
                'Next match'
              )}
            </p>
            {liveMatch && (clock
              ? (
                <p className="font-display text-2xl font-bold tabular-nums leading-none text-live">
                  {minute.display}
                </p>
              )
              // The minute lives on the detail response. A confident 0' would be
              // wrong for the length of a first half.
              : <Skeleton className="h-6 w-12" />)}
          </div>

          {focus ? (
            <>
              <OpponentLine fixture={focus} teamId={teamId} size="lg" className="mt-4" />

              <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-tertiary">
                <span className="inline-flex items-center gap-1 tabular-nums">
                  <Clock3 size={13} aria-hidden="true" />
                  {focus.matchDate
                    ? liveMatch
                      ? PERIOD_LABEL[minute.period] || 'Under way'
                      : `${format(new Date(focus.matchDate), 'EEE d MMM, HH:mm')} · ${timeUntil(focus.matchDate)}`
                    : 'Date to be confirmed'}
                </span>
                {focus.venue && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={13} aria-hidden="true" />
                    {focus.venue}
                  </span>
                )}
                <span className="rounded-pill border border-hairline px-1.5 text-xs">
                  {homeOrAway(focus, teamId) === 'H' ? 'Home' : 'Away'}
                </span>
              </p>

              {/* Readiness comes from the DETAIL response and only from it — a
                  list row has no line-ups, so computing it here would tell every
                  club their sheet was missing, every time. */}
              <div className="mt-4 border-t border-hairline pt-4">
                {focusDetail.isLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : tasks.length ? (
                  <div className="space-y-3">
                    {tasks.map((task: any) => <TaskRow key={task.key} task={task} />)}
                  </div>
                ) : null}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button to={`/team/match/${focus.id}`}>Open match</Button>
                {tasks.some((t: any) => !t.done && t.to) && (
                  <Button variant="secondary" to={tasks.find((t: any) => !t.done && t.to)!.to!}>
                    File team sheet
                  </Button>
                )}
                {liveMatch && <WatchLive fixture={focus} className="ml-auto" />}
              </div>

              {/* Who is covering us — the club's window onto the other portal. */}
              <div className="mt-4 border-t border-hairline pt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-tertiary">
                  Covered by
                </p>
                {focusDetail.isLoading
                  ? <Skeleton className="h-10 w-40" />
                  : <CoveredBy fixture={detail} />}
              </div>
            </>
          ) : (
            <EmptyState
              icon={Clock3}
              title="No match scheduled"
              hint="Fixtures appear here as soon as the league publishes them."
            />
          )}
        </section>

        {/* 3 · Can we field a team. Counted as PEOPLE — a coach counts players,
            not document rows, so the documents card leads with how many players
            are short rather than how many pieces of paper are. */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-1">
          <CountCard
            icon={Users}
            value={team.players?.length ?? 0}
            label="Registered players"
            hint={team.sport?.name ? `${team.sport.name} squad` : undefined}
            to="/team/players"
          />
          {requirements.isPending ? (
            <div className="rounded-card border border-hairline bg-surface p-4">
              <Skeleton className="h-8 w-14" />
              <Skeleton className="mt-3 h-4 w-28" />
            </div>
          ) : (
            <CountCard
              icon={FileText}
              value={docs.players.length}
              label="Players not cleared"
              hint={docs.missing > 0 ? `${docs.missing} documents outstanding` : 'Everyone is cleared to play'}
              to="/team/players"
              warn={docs.players.length > 0}
            />
          )}
        </div>
      </div>

      {/* 4 · How is it going. */}
      <div className="mt-4 grid items-start gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <Panel
          title="Around us"
          hint={ourRow ? 'Who you are chasing, and who is chasing you' : undefined}
          action="Full table"
          actionTo={activeLeagueId ? `/leagues/${activeLeagueId}` : undefined}
          flush
        >
          {leagueQuery.isLoading ? (
            <div className="space-y-2 p-4">
              {[0, 1, 2].map((i) => <Skeleton key={i} className="h-8 w-full" />)}
            </div>
          ) : ourRow ? (
            <div className="px-3 py-1">
              <TableAround rows={standings} teamId={teamId} />
            </div>
          ) : (
            <p className="p-4 text-sm text-tertiary">
              No table for this competition yet.
            </p>
          )}
        </Panel>

        <Panel title="Last 5" action="All matches" actionTo="/team/fixtures">
          {recent.length === 0 ? (
            <p className="py-2 text-sm text-tertiary">No results yet this season.</p>
          ) : (
            <ul className="space-y-2">
              {recent.map((f: any) => {
                const side = homeOrAway(f, teamId);
                const ours = side === 'H' ? f.homeScore : f.awayScore;
                const theirs = side === 'H' ? f.awayScore : f.homeScore;
                const result = ours > theirs ? 'W' : ours < theirs ? 'L' : 'D';
                return (
                  <li key={f.id}>
                    <Link
                      to={`/team/match/${f.id}`}
                      className="group flex min-h-tap items-center gap-2.5 rounded-control px-1 transition-colors duration-150 ease-standard hover:bg-surface-2"
                    >
                      <span
                        className={cn(
                          'flex h-6 w-6 shrink-0 items-center justify-center rounded-pill text-xs font-bold',
                          result === 'W' ? 'bg-brand-tint text-brand-text'
                            : result === 'L' ? 'bg-danger/10 text-danger-text'
                              : 'bg-surface-2 text-secondary'
                        )}
                      >
                        {result}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm text-secondary">
                        v {opponentOf(f, teamId)?.shortName || opponentOf(f, teamId)?.name || '—'}
                        <span className="ml-1 text-xs text-tertiary">({side})</span>
                      </span>
                      <span className="shrink-0 text-sm font-semibold tabular-nums text-primary">
                        {ours}-{theirs}
                      </span>
                      <ChevronRight
                        size={14}
                        className="shrink-0 text-tertiary transition-transform group-hover:translate-x-0.5"
                        aria-hidden="true"
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>

      {/* The week, once everything above is answered. */}
      <Panel className="mt-4" title="Next 7 days" action="All matches" actionTo="/team/fixtures">
        {!week?.length ? (
          <p className="py-2 text-sm text-tertiary">Nothing scheduled in the next seven days.</p>
        ) : (
          <div className="space-y-2">
            {week.map((f: any) => (
              <FixtureRow key={f.id} fixture={f} teamId={teamId} to={`/team/match/${f.id}`} />
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
};

export default TeamDashboard;
