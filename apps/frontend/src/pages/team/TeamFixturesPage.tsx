import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import {
  CalendarClock, CalendarRange, ClipboardCheck, ClipboardList, Radio,
} from 'lucide-react';

import { PageHeader, Panel } from '../../components/admin/AdminUI';
import { Tabs } from '../../components/reporter/ReporterUI';
import { FixtureRow } from '../../components/team/TeamUI';
import { Button, EmptyState, ErrorState, Skeleton, SkeletonList, StatusPill } from '../../components/ui';
import { useMyTeam, useTeamFixtures } from '../../hooks/useMyTeam';
import { bySoonest, byNewest, isToday } from '../../lib/coachMatch';

/**
 * Club → Matches. Every fixture this club is in, past and upcoming.
 *
 * THE CLUB-SIDE TWIN OF /reporter/matches, and built from the same parts: tabs
 * that move a window along ONE list rather than fetching four, the tab in the
 * URL, calendar-day headings, and an empty state written per tab. A coach and a
 * reporter hand work to each other all season; the two lists should not be two
 * different products.
 *
 * WHAT IT SAYS DIFFERENTLY. A reporter reads a fixture as two strangers, a coach
 * reads it as us and them — so every row is a `FixtureRow` from TeamUI, printing
 * the opponent, H or A, and whether OUR sheet is on file, rather than a neutral
 * home-v-away.
 *
 * IT COSTS NO EXTRA REQUEST. `useTeamFixtures` is the same query the dashboard
 * runs, keyed on the club, so switching between the two screens re-reads the
 * cache rather than the network — which matters on the mobile link a coach
 * actually uses.
 *
 * NOTHING IS INVENTED. Only fields a fixture LIST row really carries are read:
 * id, matchDate, status, venue, both teams, the league name and the score.
 */

/* ── tabs ──────────────────────────────────────────────────────────────── */

/**
 * Four windows onto one list, each with the sort its direction wants: what is
 * coming reads soonest-first, what is done reads newest-first.
 *
 * `empty` is per tab because "nothing here" means something different in each. A
 * club with no live match is not in the same situation as one that has not been
 * put in a schedule yet, and one generic placeholder tells both of them the
 * unhelpful half of the truth.
 */
const TABS = [
  {
    id: 'upcoming',
    label: 'Upcoming',
    bucket: 'scheduled',
    sort: bySoonest,
    icon: CalendarClock,
    empty: {
      title: 'No upcoming matches',
      hint: 'Fixtures appear here once the league publishes the next round of its schedule.',
    },
  },
  {
    id: 'live',
    label: 'Live',
    bucket: 'live',
    sort: bySoonest,
    icon: Radio,
    empty: {
      title: 'Nothing live right now',
      hint: 'A match moves here the moment the reporter at the ground kicks it off.',
    },
  },
  {
    id: 'completed',
    label: 'Completed',
    bucket: 'completed',
    sort: byNewest,
    icon: ClipboardCheck,
    empty: {
      title: 'No completed matches yet',
      hint: 'Every match your club plays through to full time is kept here.',
    },
  },
  {
    id: 'all',
    label: 'All',
    bucket: 'all',
    sort: byNewest,
    icon: CalendarRange,
    empty: {
      title: 'No matches yet',
      hint: 'Fixtures appear here once a league admin places your club in a schedule.',
    },
  },
] as const;

const DEFAULT_TAB = TABS[0].id;

/* ── ordering and grouping ─────────────────────────────────────────────── */

/**
 * Sorts, keeping undated fixtures out of the ordering.
 *
 * A fixture with no `matchDate` compares as the epoch, which would float it to
 * the top of Upcoming — the most prominent row on the page given to the one
 * fixture carrying the least information. They go last, under their own heading.
 */
const sortRows = (rows: any[], sort: (a: any, b: any) => number) => {
  const dated = rows.filter((f) => f?.matchDate);
  const undated = rows.filter((f) => !f?.matchDate);
  return [...dated].sort(sort).concat(undated);
};

/**
 * Cuts an already-sorted list into calendar days, preserving its order.
 *
 * The day heading is the page's spine: a coach scanning for "that Saturday in
 * July" reads dates, not fixtures. Grouping once here means the heading and the
 * rows under it cannot disagree.
 */
const groupByDay = (rows: any[]) => {
  const groups: Array<{ key: string; label: string; today: boolean; rows: any[] }> = [];
  const index = new Map<string, number>();

  rows.forEach((f) => {
    const key = f?.matchDate ? format(new Date(f.matchDate), 'yyyy-MM-dd') : 'tbc';
    if (!index.has(key)) {
      index.set(key, groups.length);
      groups.push({
        key,
        label: f?.matchDate ? format(new Date(f.matchDate), 'EEE d MMM') : 'Date to be confirmed',
        today: isToday(f?.matchDate),
        rows: [],
      });
    }
    groups[index.get(key)!].rows.push(f);
  });

  return groups;
};

/* ── the page ──────────────────────────────────────────────────────────── */

const TeamFixturesPage = () => {
  const { data: team, isLoading: teamLoading, isError: teamError } = useMyTeam();
  const teamId = team?.id ?? null;

  const {
    all, live, scheduled, completed, isLoading: fixturesLoading, isError: fixturesError, refetch,
  } = useTeamFixtures(teamId);

  /**
   * The tab lives in the URL so it survives a refresh, so the dashboard can point
   * straight at a view (`/team/fixtures?tab=live`), and so a coach can send an
   * assistant the list they are looking at rather than describing it.
   *
   * `replace` because a tab is a view of one page, not a place: on a phone the
   * back gesture should leave Matches, not walk back through four tabs.
   */
  const [params, setParams] = useSearchParams();
  const requested = params.get('tab');
  const tabId = TABS.some((t) => t.id === requested) ? (requested as string) : DEFAULT_TAB;
  const tab = TABS.find((t) => t.id === tabId)!;

  const setTab = (id: string) => {
    const next = new URLSearchParams(params);
    // The default needs no parameter — a clean URL is the one worth sharing.
    if (id === DEFAULT_TAB) next.delete('tab');
    else next.set('tab', id);
    setParams(next, { replace: true });
  };

  const buckets: Record<string, any[]> = { all, live, scheduled, completed };

  const groups = useMemo(
    () => groupByDay(sortRows(buckets[tab.bucket] || [], tab.sort)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [all, live, scheduled, completed, tab]
  );

  const isLoading = teamLoading || (!!teamId && fixturesLoading);
  const isError = teamError || fixturesError;
  const shown = groups.reduce((n, g) => n + g.rows.length, 0);

  /**
   * THE ONE NAG, AND WHY IT IS WORDED THE WAY IT IS.
   *
   * `GET /fixtures` (the list) returns no `lineups` — that only comes back from
   * `GET /fixtures/:id`, which is also why every `SheetChip` on this page reads
   * "No team sheet". So this page CANNOT know which upcoming fixtures are
   * actually missing a sheet, and a banner claiming "3 matches have no team
   * sheet" would be a number invented out of data the page does not hold.
   *
   * It counts SCHEDULED fixtures instead, and says only what that count really
   * means: each of these is due a sheet before kick-off, and the place to check
   * is the team-sheet screen. A true sentence about a smaller thing beats a
   * confident sentence about the wrong thing.
   */
  const dueCount = scheduled.length;

  return (
    <div>
      <PageHeader
        title="Matches"
        subtitle="Every fixture your club is in, and whether your side has been named"
      />

      <Tabs
        tabs={TABS.map((t) => ({
          id: t.id,
          label: t.label,
          badge: (buckets[t.bucket] || []).length,
        }))}
        value={tabId}
        onChange={setTab}
        label="Match list"
      />

      {!isLoading && !isError && dueCount > 0 && (
        // Quiet on purpose: a hairline card, not a warning colour. It is a
        // standing reminder of a routine job, and a page that shouts every time a
        // fixture is scheduled teaches a coach to stop reading it.
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-card border border-hairline bg-surface p-3 sm:p-4">
          <ClipboardList size={16} className="shrink-0 text-tertiary" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-primary">
              <span className="tabular-nums">{dueCount}</span>{' '}
              {dueCount === 1 ? 'upcoming match needs' : 'upcoming matches need'} a team sheet
            </p>
            <p className="mt-0.5 text-xs text-tertiary">
              Each one is due a sheet before kick-off. This list does not carry the sheets, so check
              them where they are filed.
            </p>
          </div>
          <Button variant="secondary" to="/team/formation" className="shrink-0">
            Team sheets
          </Button>
        </div>
      )}

      <div className="mt-4">
        {isLoading ? (
          // Skeleton rows, never a spinner: a placeholder matching FixtureRow's
          // metrics means nothing jumps when the real rows land.
          <SkeletonList count={5} className="space-y-2">
            <div className="flex min-h-tap items-center gap-3 rounded-card border border-hairline bg-surface p-3 sm:p-4">
              <Skeleton circle className="h-9 w-9 shrink-0" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-40 max-w-full" />
                <Skeleton className="h-3 w-56 max-w-full" />
                <Skeleton className="h-4 w-28 max-w-full" />
              </div>
              <Skeleton circle className="h-9 w-9 shrink-0" />
            </div>
          </SkeletonList>
        ) : isError ? (
          <Panel>
            <ErrorState
              title="Could not load your matches"
              hint="Your fixtures are still there. Check your connection and try again."
              onRetry={() => refetch()}
            />
          </Panel>
        ) : shown === 0 ? (
          <Panel>
            <EmptyState icon={tab.icon} title={tab.empty.title} hint={tab.empty.hint} />
          </Panel>
        ) : (
          <div className="space-y-5">
            {groups.map((group) => (
              <section key={group.key}>
                {/* Sticky so the day being read stays named while a busy Saturday
                    scrolls past. `top-14` is AdminTopBar's own height — it is
                    `sticky top-0 z-40`, so anything parked at zero slides under
                    it. And this cannot live inside a Panel: Panel is
                    `overflow-hidden`, which makes it a scroll container and
                    quietly kills `position: sticky`. */}
                <h2 className="sticky top-14 z-10 flex items-center gap-2 bg-surface-2/95 py-1.5 text-xs font-semibold text-tertiary backdrop-blur-sm">
                  <span className="tabular-nums">{group.label}</span>
                  {group.today && (
                    <span className="rounded-pill bg-brand-tint px-1.5 py-0.5 text-[11px] font-semibold text-brand-text">
                      Today
                    </span>
                  )}
                </h2>
                <ul className="mt-2 space-y-2">
                  {group.rows.map((f: any) => (
                    <li key={f.id}>
                      <FixtureRow
                        fixture={f}
                        teamId={teamId}
                        to={`/team/match/${f.id}`}
                        // A scheduled match already says "in 3 days" in its own
                        // row, so a "Scheduled" chip repeats it. Anything else —
                        // full time, postponed, abandoned — is the one thing a
                        // coach scans an archive for, so it earns the slot. LIVE
                        // is left out too: FixtureRow prints its own live pill.
                        trailing={
                          f?.status !== 'SCHEDULED' && f?.status !== 'LIVE'
                            ? <StatusPill status={f.status} />
                            : undefined
                        }
                      />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamFixturesPage;
