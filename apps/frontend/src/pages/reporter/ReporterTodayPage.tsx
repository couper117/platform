import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Radio, CalendarDays, CalendarClock, CheckCircle2, ClipboardList, Clock3,
} from 'lucide-react';
import { PageHeader, StatCard, Panel } from '../../components/admin/AdminUI';
import { MatchIdentity, MatchRow, ReadinessChips, Fact } from '../../components/reporter/ReporterUI';
import { Button, EmptyState, ErrorState, Skeleton, cn } from '../../components/ui';
import useReporterFixtures from '../../hooks/useReporterFixtures';
import { getMatch } from '../../api/endpoints/reporter';
import { isToday, timeUntil } from '../../lib/reporterMatch';
import { tickClock, stampClock, PERIOD_LABEL } from '../../utils/matchClock';

/**
 * TODAY — the reporter's home.
 *
 * A match reporter opens this standing at a ground, or in a bus on the way to
 * one, on a phone, one-handed. So the page is not a summary of everything they
 * are assigned to; it is an answer to three questions asked in a fixed order:
 *
 *   1. Am I live right now?      → the resume card, before anything else.
 *   2. What is next, and can I   → the next fixture with its readiness checklist.
 *      report it when I get there?
 *   3. What else is coming?      → the counts, then today's and this week's lists.
 *
 * That order is the DOM order at every width, so the phone reading (a single
 * column) and the desk reading (two columns) agree about what matters. The stat
 * grid deliberately sits BELOW the two answer cards: a number is a navigation
 * aid, not an answer, and a reporter whose match kicked off eight minutes ago
 * should not have to scroll past four tiles to get back into the console.
 *
 * NOTHING HERE IS INVENTED. Every value on the page comes from a field the API
 * really returns — status, matchDate, venue, league.name, the two teams and the
 * two scores — or from a bucket useReporterFixtures derived from those. There is
 * no "events published" tally and no chart, because the assignments endpoint
 * cannot answer either question and a plausible-looking number that nobody
 * measured is worse on an operational screen than no number at all.
 *
 * COLOUR. `--live` orange appears exactly once, on the resume card. It is the
 * page's alarm; the moment a second thing borrows it the alarm stops meaning
 * anything. The "Live now" stat tile is therefore pointedly NOT `tone="warn"`.
 */

/* ── the two cards that need more than a list row ─────────────────────────── */

/**
 * `GET /fixtures?reporterId=` includes homeTeam, awayTeam, league and competition
 * and nothing else — no `lineups`, no `liveState`. Two things on this page need
 * what it leaves out: readiness is computed from `lineups` (a list row would
 * always report both team sheets missing, which is a lie a reporter would act
 * on), and the ticking minute is computed from the clock the detail endpoint
 * derives from `liveState`.
 *
 * So each of those two cards asks for its own match. The key matches the live
 * console's, so opening a match the reporter has already looked at here renders
 * from cache rather than a fresh request on a district ground's 3G.
 */
const matchDetail = (id?: number) => ({
  queryKey: ['match-details', id],
  queryFn: async () => {
    const match = await getMatch(id!);
    // Stamp the reading as it arrives, so the minute is extrapolated from a known
    // instant instead of trusting this phone's wall clock to match the server's.
    return { ...match, clock: stampClock(match.clock) };
  },
  enabled: !!id,
});

const ReporterTodayPage = () => {
  const {
    live, scheduled, today, week, completed, isLoading, isError, refetch,
  } = useReporterFixtures();

  const liveMatch = live[0] || null;
  // The soonest fixture still on the schedule — which may be one whose kick-off
  // has already passed without anyone starting it. That is deliberate: an
  // un-started match is precisely the one a reporter needs pushed at them, and
  // timeUntil says "kick-off passed" rather than pretending it is ahead.
  const nextMatch = scheduled[0] || null;

  const liveDetail = useQuery(matchDetail(liveMatch?.id));
  const nextDetail = useQuery(matchDetail(nextMatch?.id));

  const [now, setNow] = useState(() => Date.now());
  const clock = liveDetail.data?.clock;

  // One interval, only while a clock is actually running — a stopped clock
  // re-rendering every second costs battery at the side of a pitch for nothing.
  useEffect(() => {
    if (!clock?.running) return undefined;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [clock?.running]);

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Today" subtitle={format(new Date(), 'EEEE d MMMM')} />
        <Skeleton className="h-44 w-full rounded-card" />
        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => <StatCard.Skeleton key={i} />)}
        </div>
        <div className="mt-4 space-y-3">
          {Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-20 w-full rounded-card" />)}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div>
        <PageHeader title="Today" subtitle={format(new Date(), 'EEEE d MMMM')} />
        <ErrorState
          title="Could not load your matches"
          hint="You are still assigned to them — this is a connection problem, not a change to your schedule."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const minute = tickClock(clock, now);
  const liveFixture = liveDetail.data || liveMatch;

  // Today's list already carries every fixture kicking off today, so repeating
  // them under "Next 7 days" would have the reporter counting the same match
  // twice. The stat tile still counts the full seven days, which is what its
  // label promises — the panel says it is showing the days after this one.
  const laterThisWeek = week.filter((f: any) => !isToday(f.matchDate));
  const recent = completed.slice(0, 5);

  const cards = [
    { icon: Radio, value: live.length, label: 'Live now', hint: 'Reporting in progress', to: '/reporter/matches?tab=live' },
    // Green marks the active state, and today's workload is what is active.
    { icon: CalendarDays, value: today.length, label: 'Today', hint: 'Kick-offs today', to: '/reporter/matches', tone: 'brand' as const },
    { icon: CalendarClock, value: week.length, label: 'Next 7 days', hint: 'Including today', to: '/reporter/matches' },
    { icon: CheckCircle2, value: completed.length, label: 'Completed', hint: 'Finished matches', to: '/reporter/results' },
  ];

  return (
    <div>
      <PageHeader
        title="Today"
        subtitle={format(new Date(), 'EEEE d MMMM')}
        actions={<Button to="/reporter/matches" variant="secondary">All matches</Button>}
      />

      {/* 1 · Am I live right now? */}
      {liveMatch && (
        <section className="rounded-card border border-live/40 bg-surface p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-live">
              <Radio size={13} className="animate-pulse" aria-hidden="true" />
              Live now
            </span>
            {/* The minute only exists once the detail request lands. A skeleton
                holds the space rather than showing a confident 0' that would be
                wrong for the whole of a first half. */}
            {clock ? (
              <p className="font-display text-2xl font-bold tabular-nums leading-none text-live">
                {minute.display}
              </p>
            ) : (
              <Skeleton className="h-6 w-12" />
            )}
          </div>

          <MatchIdentity fixture={liveFixture} size="lg" className="mt-4" />

          {/* Joined rather than assembled from spans so a missing venue cannot
              leave a stranded separator. The period is named only once the clock
              has arrived: tickClock's null reading is PRE, and labelling a
              running match "Not started" for the length of a request is worse
              than saying nothing about it. */}
          <p className="mt-3 text-center text-xs text-tertiary">
            {[
              clock ? PERIOD_LABEL[minute.period] || 'Under way' : null,
              liveFixture?.venue,
              liveFixture?.league?.name,
            ].filter(Boolean).join(' · ')}
          </p>

          <Button to={`/reporter/match/${liveMatch.id}`} block size="lg" className="mt-4">
            Resume reporting
          </Button>

          {/* A reporter covering a whole league can have two matches running at
              once. The card belongs to the first; the rest are one tap away
              rather than silently absent. */}
          {live.length > 1 && (
            <Link
              to="/reporter/matches?tab=live"
              className="mt-2 flex min-h-tap items-center justify-center text-xs font-semibold text-secondary transition-colors duration-150 ease-standard hover:text-brand-text"
            >
              {`${live.length - 1} more match${live.length - 1 === 1 ? '' : 'es'} live now`}
            </Link>
          )}
        </section>
      )}

      {/* 2 · What is next, and will I be able to report it when I get there? */}
      {nextMatch && (
        <Panel
          title="Next match"
          hint="Check the team sheets before you travel"
          action="All matches"
          actionTo="/reporter/matches"
          className={cn(liveMatch && 'mt-4')}
        >
          <MatchIdentity fixture={nextMatch} size="lg" />

          {/* The countdown is recomputed on every render against the real clock,
              not against the 1s `now` above — that timer only runs while a match
              is live, and a frozen "in 40 min" is the one thing on this card a
              reporter would plan their travel around. The assignments query
              refetches every minute, which is resolution enough for a figure
              that is already coarse past an hour. */}
          <p className="mt-3 flex flex-wrap items-center justify-center gap-x-1.5 text-center text-xs tabular-nums text-tertiary">
            <Clock3 size={12} aria-hidden="true" />
            {nextMatch.matchDate
              ? `${format(new Date(nextMatch.matchDate), 'EEE d MMM, HH:mm')} · ${timeUntil(nextMatch.matchDate)}`
              : 'Date to be confirmed'}
          </p>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <Fact label="Venue" value={nextMatch.venue || 'To be confirmed'} />
            <Fact label="Competition" value={nextMatch.league?.name} />
          </div>

          {/* Readiness comes from the DETAIL response and only from it — the list
              row has no `lineups`, so computing it from `nextMatch` would tell
              every reporter both team sheets were missing, every time. */}
          <div className="mt-4">
            {nextDetail.isLoading ? (
              <div className="flex flex-wrap gap-1.5">
                {['w-28', 'w-28', 'w-24', 'w-20'].map((w) => (
                  <Skeleton key={w} className={cn('h-5 rounded-pill', w)} />
                ))}
              </div>
            ) : nextDetail.data ? (
              <ReadinessChips fixture={nextDetail.data} />
            ) : (
              <p className="text-xs text-tertiary">
                Could not check the team sheets — open the match to see where it stands.
              </p>
            )}
          </div>

          <Button to={`/reporter/match/${nextMatch.id}`} block className="mt-4">
            Open match
          </Button>
        </Panel>
      )}

      {/* 3 · The counts. Every one of them is a question with a page for an
          answer, so every tile links — the same rule the admin dashboard follows. */}
      <div className={cn('grid grid-cols-2 gap-3 lg:grid-cols-4', (liveMatch || nextMatch) && 'mt-4')}>
        {cards.map((c) => <StatCard key={c.label} {...c} />)}
      </div>

      {/* 4 + 5 · The lists. The archive sits in its own column on a wide screen
          and falls to the bottom on a phone, where a reporter wants the work
          ahead of them long before the work behind them. */}
      <div className="mt-4 grid items-start gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <Panel title="Today's matches" action="All matches" actionTo="/reporter/matches">
            {today.length === 0 ? (
              <EmptyState
                icon={CalendarDays}
                title="Nothing today"
                hint="Matches appear here once a league admin assigns you to report on them."
              />
            ) : (
              <div className="space-y-2">
                {today.map((f: any) => (
                  <MatchRow key={f.id} fixture={f} to={`/reporter/match/${f.id}`} />
                ))}
              </div>
            )}
          </Panel>

          <Panel
            title="Next 7 days"
            hint="Not counting today"
            action="All matches"
            actionTo="/reporter/matches"
          >
            {laterThisWeek.length === 0 ? (
              <EmptyState
                icon={CalendarClock}
                title="Nothing in the next 7 days"
                hint="Fixtures show up here as soon as they are scheduled and you are assigned to them."
              />
            ) : (
              <div className="space-y-2">
                {laterThisWeek.map((f: any) => (
                  <MatchRow key={f.id} fixture={f} to={`/reporter/match/${f.id}`} />
                ))}
              </div>
            )}
          </Panel>
        </div>

        <Panel title="Recently reported" action="All results" actionTo="/reporter/results">
          {recent.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="Nothing reported yet"
              hint="Matches you finish reporting are kept here, with their final scores."
            />
          ) : (
            <div className="space-y-2">
              {recent.map((f: any) => (
                <MatchRow key={f.id} fixture={f} to="/reporter/results" />
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
};

export default ReporterTodayPage;
