import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { AlertTriangle, ArrowLeft, ClipboardList, Lock, Users } from 'lucide-react';

import { PageHeader, Panel } from '../../components/admin/AdminUI';
import { CoveredBy, Fact, OpponentLine, WatchLive } from '../../components/team/TeamUI';
import { Button, ErrorState, Skeleton, StatusPill, cn } from '../../components/ui';
import { getMatch } from '../../api/endpoints/team';
import { useMyTeam } from '../../hooks/useMyTeam';
import {
  CLOSED_STATUSES, isSheetLocked, matchTasks, opponentOf, sheetFor, timeUntil,
} from '../../lib/coachMatch';
import { EVENT_LABEL, eventTone, statFieldsForSport } from '../../config/sportEvents';
import { PERIOD_LABEL, stampClock, tickClock } from '../../utils/matchClock';

/**
 * One match, read from the club's side — /team/match/:id.
 *
 * THE COUNTERPART TO /reporter/match/:id, AND DELIBERATELY NOT A COPY OF IT. The
 * reporter's console logs events, runs the clock and signs off the result. A
 * coach holds none of `fixtures.report`, so none of that is here: no capture
 * sheet, no clock controls, no result form, and no undo on the feed. Building a
 * read-only console that *looked* like the reporter's would teach a coach to
 * reach for controls the server would refuse them.
 *
 * WHAT A COACH ACTUALLY COMES HERE FOR, in the order they ask it:
 *   1. Where and when, and is it under way.
 *   2. HAVE WE FILED OUR SHEET — the one piece of work this portal owes, and the
 *      reason the page exists at all.
 *   3. Who is covering us, so a query on Saturday has a name behind it.
 *   4. Who we are up against.
 *   5. What has happened, and what the numbers say.
 *
 * IT SHARES THE REPORTER CONSOLE'S QUERY KEY (`['match-details', id]`) on
 * purpose. It is the same `GET /fixtures/:id` payload, so the cache, the
 * invalidations the lineup editor already fires, and the poll all line up rather
 * than each portal keeping its own copy of one match.
 *
 * NOTHING HERE IS INVENTED. Every field read — events, lineups, teamSheets with
 * their `submittedBy`, assignedReporters, stats, clock, league.sport — is one
 * that endpoint really returns; see api/endpoints/team.getMatch.
 */

/* ── who named this side ─────────────────────────────────────────────────── */

/**
 * The full sentence version of TeamUI's SheetChip.
 *
 * A chip in a list has room for three words; a panel has room for the truth. The
 * distinction matters most at the bottom of this list: `unknown` is a sheet
 * written before `submittedBy` existed, and the one thing the copy must never do
 * is tell a coach they filed something when the record does not say who did.
 */
const AUTHOR_LINE: Record<string, string> = {
  coach: 'Filed by your club',
  reporter: 'Recorded by the reporter at the ground',
  admin: 'Filed by a league admin',
  unknown: 'On file',
};

const teamLabel = (team: any) => team?.shortName || team?.name || '—';

/* ── a published sheet, read only ────────────────────────────────────────── */

/**
 * One club's starting side and bench.
 *
 * READ ONLY EVERYWHERE, including for the coach's own club: /team/formation owns
 * writing a sheet, and two screens that could both save one is how a sheet gets
 * overwritten by whichever tab was opened first.
 */
const SheetList = ({ sheet }: { sheet: ReturnType<typeof sheetFor> }) => {
  const row = (r: any) => (
    <li key={r.id ?? r.playerId} className="flex items-center gap-2 py-1 text-sm">
      <span className="w-7 shrink-0 text-right text-xs font-semibold tabular-nums text-tertiary">
        {r.jerseyNo != null ? r.jerseyNo : '—'}
      </span>
      <span className="min-w-0 flex-1 truncate text-primary">{r.player?.fullName || 'Unnamed player'}</span>
      {r.isCaptain && (
        <span className="shrink-0 rounded-pill border border-hairline px-1.5 text-[11px] font-semibold text-secondary">
          C
        </span>
      )}
      {r.position && <span className="shrink-0 text-xs text-tertiary">{r.position}</span>}
    </li>
  );

  return (
    <div className="min-w-0">
      <p className="text-xs text-tertiary">
        {sheet.meta?.formation ? <span className="tabular-nums">{sheet.meta.formation}</span> : 'No formation recorded'}
        {sheet.meta?.coachName ? ` · ${sheet.meta.coachName}` : ''}
      </p>

      <p className="mt-3 text-xs font-semibold text-tertiary">
        Starting <span className="tabular-nums">{sheet.starters.length}</span>
      </p>
      <ul className="mt-1">{sheet.starters.map(row)}</ul>

      {sheet.bench.length > 0 && (
        <>
          <p className="mt-3 text-xs font-semibold text-tertiary">Substitutes</p>
          <ul className="mt-1">{sheet.bench.map(row)}</ul>
        </>
      )}
    </div>
  );
};

/* ── the feed, without the reporter's controls ───────────────────────────── */

/**
 * Everything published so far, newest first.
 *
 * NO UNDO. The reporter's feed carries one per row because a mistyped tap has to
 * be correctable from the touchline; removing an event also puts back the score
 * and any suspension it caused, which is squarely `fixtures.report`. A coach
 * reads this feed and disputes it with the league, not with a button.
 *
 * The words come from config/sportEvents rather than a table written here, so a
 * basketball three-pointer reads as one and a volleyball set is not called a
 * goal — the same source the reporter's console and the public timeline use.
 */
const MatchFeed = ({ fixture, teamId }: { fixture: any; teamId?: number | null }) => {
  const events = [...(fixture.events || [])].sort((a: any, b: any) => (b.minute || 0) - (a.minute || 0));

  if (!events.length) {
    return <p className="py-6 text-center text-sm text-tertiary">Nothing published yet.</p>;
  }

  return (
    <ul className="space-y-2">
      {events.map((e: any) => {
        const meta = { label: EVENT_LABEL[e.eventType] || 'Update', ...eventTone(e.eventType) };
        // Named from the club's side: "us" is the coach's own club, and the other
        // row is whoever they are playing.
        const team =
          e.teamId === fixture.homeTeamId ? teamLabel(fixture.homeTeam)
            : e.teamId === fixture.awayTeamId ? teamLabel(fixture.awayTeam)
              : null;
        const ours = e.teamId != null && e.teamId === teamId;

        return (
          <li key={e.id} className="flex items-center gap-3 rounded-control bg-surface-2 p-2.5">
            <span
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-pill border text-xs font-semibold tabular-nums text-secondary',
                meta.ring
              )}
            >
              {e.minute != null ? `${e.minute}${e.extraTime ? `+${e.extraTime}` : ''}'` : '—'}
            </span>
            <div className="min-w-0 flex-1">
              <p className={cn('text-sm font-semibold', meta.tone)}>{meta.label}</p>
              <p className="truncate text-xs text-tertiary">
                {e.description
                  || [ours ? `${team} (us)` : team, e.player?.fullName].filter(Boolean).join(' · ')
                  || '—'}
                {e.player2?.fullName && ` ↔ ${e.player2.fullName}`}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
};

/* ── statistics, read only ───────────────────────────────────────────────── */

/**
 * Ours | label | theirs, the way a broadcast graphic reads — but with our column
 * first, because a coach compares against themselves rather than against the home
 * team's column.
 *
 * Only the fields the sport can answer (config/sportEvents) AND that somebody has
 * actually filled are rendered. A grid of eight em-dashes is not a statistic; it
 * is a page telling a coach the reporter has not been at their keyboard, and the
 * empty state below says that in one sentence instead.
 */
const StatsTable = ({ fixture, teamId }: { fixture: any; teamId?: number | null }) => {
  const fields = statFieldsForSport(fixture.league?.sport?.slug);
  const rowFor = (id: number) => (fixture.stats || []).find((s: any) => s.teamId === id) || null;

  const theirId = fixture.homeTeamId === teamId ? fixture.awayTeamId : fixture.homeTeamId;
  const ours = rowFor(teamId as number);
  const theirs = rowFor(theirId);

  const filled = fields.filter(({ key }) => ours?.[key] != null || theirs?.[key] != null);

  if (!filled.length) {
    return (
      <p className="py-6 text-center text-sm text-tertiary">
        The reporter has not filed statistics for this match yet.
      </p>
    );
  }

  const value = (row: any, key: string) => (row?.[key] == null ? '—' : row[key]);

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-x-3 gap-y-2">
      <p className="truncate text-center text-xs font-semibold text-secondary">Us</p>
      <span aria-hidden="true" />
      <p className="truncate text-center text-xs font-semibold text-secondary">
        {teamLabel(opponentOf(fixture, teamId))}
      </p>

      {filled.map(({ key, label }) => (
        <React.Fragment key={key}>
          <p className="text-center text-base font-semibold tabular-nums text-primary">{value(ours, key)}</p>
          <p className="px-1 text-center text-xs text-tertiary">{label}</p>
          <p className="text-center text-base font-semibold tabular-nums text-primary">{value(theirs, key)}</p>
        </React.Fragment>
      ))}
    </div>
  );
};

/* ── loading ─────────────────────────────────────────────────────────────── */

const MatchSkeleton = () => (
  <div className="mx-auto max-w-3xl space-y-3">
    <Skeleton className="h-9 w-48" />
    {Array.from({ length: 3 }, (_, i) => (
      <Skeleton key={i} className="h-28 w-full rounded-card" />
    ))}
  </div>
);

/* ── the page ────────────────────────────────────────────────────────────── */

const TeamMatchPage = () => {
  const { id } = useParams();
  const matchId = Number(id);

  const {
    data: team, isLoading: teamLoading, isError: teamError, refetch: refetchTeam,
  } = useMyTeam();
  const teamId = team?.id ?? null;

  const [now, setNow] = useState(() => Date.now());

  const {
    data: fixture,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    // THE SAME KEY AS THE REPORTER CONSOLE. One fixture, one cache entry: the
    // lineup editor already invalidates it, so filing a sheet and coming back
    // here shows the sheet without a second request.
    queryKey: ['match-details', matchId],
    queryFn: async () => {
      const data = await getMatch(matchId);
      // Stamp when this reading arrived so the minute below extrapolates from a
      // known instant rather than trusting the phone's wall clock.
      return { ...data, clock: stampClock(data.clock) };
    },
    enabled: Number.isFinite(matchId),
    // A 403 or a 404 is an ANSWER — not our club's match, or no such match.
    // Retrying it three times only delays saying so.
    retry: false,
    // Only while the match is under way. A scheduled fixture has nothing to poll
    // for, and a coach watching from the stand is on a mobile connection.
    refetchInterval: (query: any) => (query.state.data?.status === 'LIVE' ? 15000 : false),
  });

  // The minute is recomputed in the browser from the kick-off stamp, so the
  // display ticks without a request per second and agrees with every other screen
  // showing this match. The interval only runs while the clock is running — at
  // half time there is nothing to count, and a 1s timer in a pocket is a battery
  // cost for nothing.
  const running = !!fixture?.clock?.running;
  useEffect(() => {
    if (!running) return undefined;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [running]);

  /* -- states before the page can render -------------------------------- */

  if (!Number.isFinite(matchId)) {
    return (
      <div className="mx-auto max-w-3xl">
        <ErrorState title="That is not a match" hint="The link you followed does not name a fixture." />
        <div className="flex justify-center">
          <Button variant="secondary" to="/team/fixtures">Back to matches</Button>
        </div>
      </div>
    );
  }

  if (isLoading || teamLoading) return <MatchSkeleton />;

  // Two different failures, and they are not interchangeable: without the club we
  // cannot say which side of this fixture is ours, so every panel below would be
  // guessing. Saying which one broke is what tells a coach whether to retry or to
  // sign in again.
  if (teamError) {
    return (
      <div className="mx-auto max-w-3xl">
        <ErrorState
          title="Could not load your club"
          hint="This match is read from your club's side, so the page needs to know which club you run. Check your connection and try again."
          onRetry={() => refetchTeam()}
        />
        <div className="flex justify-center">
          <Button variant="secondary" to="/team/fixtures">Back to matches</Button>
        </div>
      </div>
    );
  }

  if (isError || !fixture) {
    const httpStatus = (error as any)?.response?.status;
    const missing = httpStatus === 404;
    const forbidden = httpStatus === 403;
    return (
      <div className="mx-auto max-w-3xl">
        <ErrorState
          title={
            missing ? 'That match no longer exists'
              : forbidden ? 'You cannot open this match'
                : 'Could not load this match'
          }
          hint={
            missing
              ? 'A league admin may have removed it. The rest of your fixtures are unaffected.'
              : forbidden
                ? 'Your club portal only opens matches your club is playing in.'
                : 'Check your connection and try again.'
          }
          onRetry={missing || forbidden ? undefined : () => refetch()}
        />
        <div className="flex justify-center">
          <Button variant="secondary" to="/team/fixtures">Back to matches</Button>
        </div>
      </div>
    );
  }

  /**
   * A REAL FIXTURE THAT IS NOT OURS.
   *
   * `GET /fixtures/:id` is a public read, so a coach who edits the id in the
   * address bar gets a perfectly valid match back — and every panel below would
   * then read "our sheet" off a club they do not run. Saying so plainly is the
   * only honest render of that state.
   */
  const isOurs = teamId != null && (fixture.homeTeamId === teamId || fixture.awayTeamId === teamId);
  if (!isOurs) {
    return (
      <div className="mx-auto max-w-3xl">
        <ErrorState
          title="Your club is not in this match"
          hint={`${teamLabel(fixture.homeTeam)} v ${teamLabel(fixture.awayTeam)} belongs to two other clubs. This portal only shows the matches ${teamLabel(team)} is playing in.`}
        />
        <div className="flex justify-center">
          <Button variant="secondary" to="/team/fixtures">Back to matches</Button>
        </div>
      </div>
    );
  }

  /* -- derived ----------------------------------------------------------- */

  const isLive = fixture.status === 'LIVE';
  const isClosed = CLOSED_STATUSES.includes(fixture.status);
  const live = tickClock(fixture.clock, now);

  const ourSheet = sheetFor(fixture, teamId);
  const theirId = fixture.homeTeamId === teamId ? fixture.awayTeamId : fixture.homeTeamId;
  const theirSheet = sheetFor(fixture, theirId);
  const opponent = opponentOf(fixture, teamId);

  const locked = isSheetLocked(fixture);
  const sheetTask = matchTasks(fixture, teamId).find((t) => t.key === 'sheet');
  const lineupsHref = `/team/formation?fixture=${fixture.id}`;

  const kickOff = fixture.matchDate ? new Date(fixture.matchDate) : null;

  const heading = isLive ? 'Match under way' : isClosed ? 'After the match' : 'Before kick-off';
  const subheading = isLive
    ? 'The reporter at the ground is publishing the feed below as it happens.'
    : isClosed
      ? 'The record of this match, as it was reported.'
      : 'What your club owes before this one kicks off, and who is covering it.';

  return (
    // No outer padding and no `min-h-screen`: TeamLayout's <main> owns the ground
    // and the gutter. `max-w-3xl` because every panel here is a column of text —
    // a team sheet stretched across 1440px is a worse read, not a fuller one.
    <div className="mx-auto max-w-3xl">
      <Link
        to="/team/fixtures"
        className="mb-2 inline-flex min-h-tap items-center gap-1.5 text-sm text-secondary transition-colors duration-150 ease-standard hover:text-primary"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        All matches
      </Link>

      <PageHeader
        title={heading}
        subtitle={subheading}
        actions={
          <StatusPill
            status={fixture.status}
            // While live the minute IS the status — a coach glancing at this
            // header wants to know how far in we are, not that it is live.
            label={isLive ? `Live ${live.display}` : undefined}
          />
        }
      />

      <div className="space-y-3">
        {/* Who, when, where. The same four facts the reporter checks on arrival,
            written from the club's side: the opponent's crest, not both. */}
        <section className="rounded-card border border-hairline bg-surface p-5">
          <OpponentLine fixture={fixture} teamId={teamId} size="lg" />

          <p className="mt-4 text-sm text-secondary">
            {kickOff ? (
              <>
                <span className="tabular-nums">{format(kickOff, 'EEE d MMM, HH:mm')}</span>
                {!isClosed && !isLive && (
                  <span className="text-tertiary"> · {timeUntil(fixture.matchDate, now)}</span>
                )}
                {isLive && (
                  <span className="text-tertiary"> · {PERIOD_LABEL[live.period] || live.period}</span>
                )}
              </>
            ) : (
              'Kick-off time to be confirmed'
            )}
          </p>

          {/* A coach cannot report their own match — they hold no
              `fixtures.report` — but somebody is reporting it, and the public
              match page is where that feed is published in full. Sending them
              there beats a second, drifting copy of it. */}
          {isLive && <WatchLive fixture={fixture} className="mt-2" />}

          <div className="mt-5 grid grid-cols-2 gap-4 border-t border-hairline pt-4 sm:grid-cols-4">
            <Fact label="Venue" value={fixture.venue || 'Not set'} />
            <Fact label="Referee" value={fixture.referee || 'Not set'} />
            <Fact label="Competition" value={fixture.competition?.name || fixture.league?.name || '—'} />
            <Fact label="Matchday" value={<span className="tabular-nums">{fixture.matchday ?? '—'}</span>} />
          </div>
        </section>

        {/* THE POINT OF THIS PAGE. Naming the side is the club's single
            responsibility in the whole reporter/coach handover, and everything
            else here is context around it. */}
        <Panel
          title="Our team sheet"
          hint={ourSheet.filed ? AUTHOR_LINE[ourSheet.author || 'unknown'] : 'Not filed yet'}
        >
          {ourSheet.filed ? (
            <>
              <SheetList sheet={ourSheet} />

              {locked ? (
                // THE LOCK IS THE SERVER'S RULE, NOT A UI PREFERENCE.
                // `PUT /fixtures/:id/lineup` returns 423 for a TEAM_MANAGER once
                // the fixture is LIVE or COMPLETED — see the comment on
                // `saveLineup` in api/endpoints/team.ts. Offering an edit button
                // here would send a coach to a screen that can only fail, so the
                // page states the rule and names who can still act instead.
                <p className="mt-4 flex items-start gap-2 border-t border-hairline pt-4 text-sm text-secondary">
                  <Lock size={15} className="mt-0.5 shrink-0 text-tertiary" aria-hidden="true" />
                  <span>
                    Your sheet is locked from kick-off. A late change — an injury in the warm-up, a
                    swapped shirt number — is recorded by the reporter at the ground.
                  </span>
                </p>
              ) : (
                <Button variant="secondary" block className="mt-5" to={lineupsHref}>
                  Change the team sheet
                </Button>
              )}
            </>
          ) : locked ? (
            <p className="flex items-start gap-2 text-sm text-secondary">
              <Lock size={15} className="mt-0.5 shrink-0 text-tertiary" aria-hidden="true" />
              <span>
                No sheet was filed, and it is locked now that the match has started. The reporter at
                the ground records the side you named on paper — until they do, a goal for your club
                cannot name the player who scored it.
              </span>
            </p>
          ) : (
            <>
              {/* The nag, once, where it can be acted on. `why` is the same
                  sentence lib/coachMatch gives the dashboard checklist, so a
                  coach is not told two different things about one job. */}
              <div className="flex items-start gap-3 rounded-control border border-live/40 bg-live/10 p-3">
                <AlertTriangle size={16} className="mt-0.5 shrink-0 text-live" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-primary">No team sheet yet</p>
                  <p className="mt-1 text-sm text-secondary">{sheetTask?.why}</p>
                </div>
              </div>
              <Button block className="mt-4" icon={ClipboardList} to={lineupsHref}>
                File the team sheet
              </Button>
            </>
          )}
        </Panel>

        {/* The club's one window onto the other portal. Before it, "who is
            covering us on Saturday?" had no answer inside the product. */}
        <Panel title="Who is covering us" hint="Assigned by the league admin.">
          <CoveredBy fixture={fixture} />
        </Panel>

        {/* Seeing the side you are up against is legitimate and it is already in
            this response — the public match page prints it too. It is stated
            NEUTRALLY: the other club's paperwork is not this coach's problem, and
            a warning colour here would invite reading it as one. */}
        <Panel title="The opposition" hint={teamLabel(opponent)}>
          {theirSheet.filed ? (
            <SheetList sheet={theirSheet} />
          ) : (
            <p className="py-2 text-sm text-tertiary">Not filed yet.</p>
          )}
        </Panel>

        <Panel
          title="Match feed"
          hint={
            isLive
              ? <span className="tabular-nums">{live.display} · newest first</span>
              : 'Newest first, as published by the reporter.'
          }
        >
          <MatchFeed fixture={fixture} teamId={teamId} />
        </Panel>

        <Panel title="Statistics" hint="Filed by the reporter, usually at half time and again at full time.">
          <StatsTable fixture={fixture} teamId={teamId} />
        </Panel>
      </div>
    </div>
  );
};

export default TeamMatchPage;
