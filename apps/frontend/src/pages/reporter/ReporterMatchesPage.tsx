import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CalendarClock, CalendarRange, ClipboardCheck, FilterX, Radio, Search, SearchX } from 'lucide-react';
import { format } from 'date-fns';
import { Panel, PageHeader } from '../../components/admin/AdminUI';
import { MatchRow, MatchStatusChip, Tabs } from '../../components/reporter/ReporterUI';
import { Button, EmptyState, ErrorState, Input, Select, Skeleton, SkeletonList } from '../../components/ui';
import useReporterFixtures from '../../hooks/useReporterFixtures';
import { bySoonest, byNewest, isToday } from '../../lib/reporterMatch';

/**
 * Reporter → My matches. Every fixture this reporter is assigned to, ever.
 *
 * WHY ONE PAGE AND NOT TWO. "What am I down for this month" and "where is that
 * match I covered in July" look like different questions, but they are the same
 * list read from opposite ends — and a reporter who has to remember which of two
 * screens holds a fixture will look in the wrong one. Tabs move the window along
 * one list; they do not fetch four different things.
 *
 * EVERYTHING HERE IS CLIENT-SIDE, DELIBERATELY. `useReporterFixtures` already
 * holds the whole assignment list (the same query Today's screen uses, so this
 * page costs no extra request), and there is no search endpoint behind it. A
 * search box wired to nothing but hope would be a lie: filtering in the browser
 * is honest about what it can see, and at an assignment list's size — a season of
 * one reporter's matches, not a league's — it is also instant.
 *
 * NOTHING IS INVENTED. Only the fields a fixture LIST row really carries are read
 * here: id, matchDate, status, venue, both teams, league name and the score.
 * Readiness deliberately does not appear — `lineups` only comes back from
 * GET /fixtures/:id, so a team-sheet chip on this page would be reporting on data
 * it does not have.
 */

/* ── tabs ──────────────────────────────────────────────────────────────── */

/**
 * The four windows onto the list, each with the sort that suits its direction:
 * what is coming reads soonest-first, what is done reads newest-first. "All" is
 * an archive, so it takes the archive's order.
 *
 * `empty` is per tab because "nothing here" means something different in each.
 * A reporter with no live match is not in the same situation as one with no
 * assignments at all, and one generic placeholder would tell both of them the
 * unhelpful half of the truth.
 */
const TABS = [
  {
    id: 'upcoming',
    label: 'Upcoming',
    bucket: 'scheduled',
    sort: bySoonest,
    icon: CalendarClock,
    noun: 'upcoming matches',
    empty: {
      title: 'No upcoming matches',
      hint: 'Matches appear here once a league admin assigns you.',
    },
  },
  {
    id: 'live',
    label: 'Live',
    bucket: 'live',
    sort: bySoonest,
    icon: Radio,
    noun: 'live matches',
    empty: {
      title: 'Nothing live right now',
      hint: 'A match moves here the moment you kick it off from its console.',
    },
  },
  {
    id: 'completed',
    label: 'Completed',
    bucket: 'completed',
    sort: byNewest,
    icon: ClipboardCheck,
    noun: 'completed matches',
    empty: {
      title: 'No completed matches yet',
      hint: 'Every match you report through to full time is kept here.',
    },
  },
  {
    id: 'all',
    label: 'All',
    bucket: 'all',
    sort: byNewest,
    icon: CalendarRange,
    noun: 'assigned matches',
    empty: {
      title: 'No matches assigned to you',
      hint: 'Matches appear here once a league admin assigns you.',
    },
  },
] as const;

const DEFAULT_TAB = TABS[0].id;

/* ── filtering and grouping ────────────────────────────────────────────── */

/**
 * What the search box looks at: both teams under either name, the ground and the
 * competition. `shortName` is included because it is what a row actually PRINTS —
 * a reporter typing what they can see should find it.
 */
const haystack = (f: any) =>
  [
    f?.homeTeam?.name,
    f?.homeTeam?.shortName,
    f?.awayTeam?.name,
    f?.awayTeam?.shortName,
    f?.venue,
    f?.league?.name,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

/**
 * Sorts, keeping undated fixtures out of the ordering.
 *
 * A fixture with no `matchDate` compares as the epoch, which would float it to
 * the top of Upcoming — the most prominent slot on the page given to the one row
 * with the least information. They go last instead, under their own heading.
 */
const sortRows = (rows: any[], sort: (a: any, b: any) => number) => {
  const dated = rows.filter((f) => f?.matchDate);
  const undated = rows.filter((f) => !f?.matchDate);
  return [...dated].sort(sort).concat(undated);
};

/**
 * Cuts an already-sorted list into calendar days, preserving the list's order.
 *
 * The day heading is the page's spine: a reporter scanning for "that Saturday in
 * July" reads dates, not fixtures. Grouping in the render would mean re-deciding
 * the boundary at every row; doing it once means the heading and the rows under
 * it cannot disagree.
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

const ReporterMatchesPage = () => {
  const { all, live, scheduled, completed, isLoading, isError, refetch } = useReporterFixtures();

  /**
   * The tab lives in the URL so it survives a refresh, so Today's stat tiles can
   * point straight at it (`/reporter/matches?tab=live`), and so a reporter can
   * send a colleague the view they are looking at rather than describing it.
   *
   * `replace` because a tab is a view of one page, not a place: on a phone the
   * back gesture should leave My matches, not walk back through four tabs.
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

  const [q, setQ] = useState('');
  const [leagueName, setLeagueName] = useState('');
  const filtering = q.trim().length > 0 || leagueName !== '';
  const clearFilters = () => {
    setQ('');
    setLeagueName('');
  };

  /**
   * The competition list is drawn from the WHOLE assignment set, not from the
   * current tab. A select whose options appear and vanish as tabs change is a
   * control a reporter cannot learn; a stable list plus an honest empty state is.
   */
  const leagueOptions = useMemo(() => {
    const names = Array.from(
      new Set((all || []).map((f: any) => f?.league?.name).filter(Boolean))
    ).sort((a: any, b: any) => String(a).localeCompare(String(b)));
    return names.map((name) => ({ value: name, label: name }));
  }, [all]);

  const buckets: Record<string, any[]> = { all, live, scheduled, completed };

  const groups = useMemo(() => {
    const term = q.trim().toLowerCase();
    const rows = (buckets[tab.bucket] || []).filter((f: any) => {
      if (leagueName && f?.league?.name !== leagueName) return false;
      return !term || haystack(f).includes(term);
    });
    return groupByDay(sortRows(rows, tab.sort));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all, live, scheduled, completed, tab, q, leagueName]);

  const shown = groups.reduce((n, g) => n + g.rows.length, 0);

  return (
    <div>
      <PageHeader
        title="My matches"
        subtitle="Every fixture you are assigned to, past and upcoming"
      />

      <Tabs
        tabs={TABS.map((t) => ({
          id: t.id,
          label: t.label,
          // Badges count the BUCKET, never the filtered view: they are how many
          // matches exist behind each tab, which is the thing a filter must not
          // be able to rewrite.
          badge: (buckets[t.bucket] || []).length,
        }))}
        value={tabId}
        onChange={setTab}
      />

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {/* Full width on a phone: sharing a 328px row with the competition
            select would leave the search box too narrow to read what was typed
            into it. From `sm:` up they sit side by side. */}
        <div className="relative w-full sm:w-auto sm:min-w-0 sm:max-w-xs sm:flex-1">
          <Search
            size={16}
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-tertiary"
          />
          <Input
            value={q}
            onChange={(e: any) => setQ(e.target.value)}
            placeholder="Team, venue or competition"
            aria-label="Filter matches by team, venue or competition"
            className="pl-9 text-sm"
          />
        </div>
        {/* One competition is not a choice, so the control only appears where
            there is something to choose between. */}
        {leagueOptions.length > 1 && (
          <Select
            id="reporter-matches-league"
            label="Competition"
            value={leagueName}
            onChange={(e: any) => setLeagueName(e.target.value)}
            placeholder="All competitions"
            options={leagueOptions}
          />
        )}
        {filtering && (
          <Button type="button" variant="ghost" icon={FilterX} onClick={clearFilters}>
            Clear
          </Button>
        )}
        {!isLoading && !isError && shown > 0 && (
          <span className="ml-auto shrink-0 text-xs tabular-nums text-tertiary">
            {shown} {shown === 1 ? 'match' : 'matches'}
          </span>
        )}
      </div>

      <div className="mt-4">
        {isLoading ? (
          // Skeleton rows, never a spinner: this list arrives one row-shape at a
          // time, and a placeholder that matches MatchRow's metrics means nothing
          // jumps when the real rows land.
          <SkeletonList count={5} className="space-y-2">
            <div className="flex min-h-tap items-center gap-3 rounded-card border border-hairline bg-surface p-3 sm:p-4">
              <Skeleton circle className="h-9 w-9 shrink-0" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-40 max-w-full" />
                <Skeleton className="h-3 w-56 max-w-full" />
              </div>
              <Skeleton circle className="h-9 w-9 shrink-0" />
            </div>
          </SkeletonList>
        ) : isError ? (
          <Panel>
            <ErrorState
              title="Could not load your matches"
              hint="Your assignments are still there. Check your connection and try again."
              onRetry={() => refetch()}
            />
          </Panel>
        ) : shown === 0 ? (
          <Panel>
            {/* Two different failures wearing the same face is the defect here: a
                reporter with nothing assigned needs to know to speak to their
                league admin, and a reporter who typed three letters needs to know
                to delete them. The copy — and the way out — differ accordingly. */}
            {filtering ? (
              <EmptyState
                icon={SearchX}
                title="Nothing matches that filter"
                hint={`None of your ${tab.noun} match what you are filtering by. Clearing the filter brings them back.`}
                action={
                  <Button type="button" variant="secondary" icon={FilterX} onClick={clearFilters}>
                    Clear filters
                  </Button>
                }
              />
            ) : (
              <EmptyState icon={tab.icon} title={tab.empty.title} hint={tab.empty.hint} />
            )}
          </Panel>
        ) : (
          <div className="space-y-5">
            {groups.map((group) => (
              <section key={group.key}>
                {/* Sticky so the day a reporter is reading stays named while they
                    scroll past a busy Saturday. `top-14` is the portal top bar's
                    own height — it is `sticky top-0 z-40`, so anything parked at
                    zero here slides underneath it. And this cannot live inside a
                    Panel: Panel is `overflow-hidden`, which makes it a scroll
                    container and quietly kills `position: sticky`. */}
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
                      <MatchRow
                        fixture={f}
                        to={`/reporter/match/${f.id}`}
                        // A scheduled match's state is already in its row ("in 3
                        // days"), so a "Scheduled" chip would repeat it. Anything
                        // else — live, full time, abandoned — is the one thing a
                        // reporter scans this archive for, so it earns the slot.
                        trailing={f?.status !== 'SCHEDULED' ? <MatchStatusChip fixture={f} /> : undefined}
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

export default ReporterMatchesPage;
