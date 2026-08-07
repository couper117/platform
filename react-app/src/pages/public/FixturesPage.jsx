import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays } from 'lucide-react';
import { getFixtures } from '../../api/endpoints/fixtures';
import { getLeagues } from '../../api/endpoints/leagues';
import MatchRow from '../../components/match/MatchRow';
import FixtureFilters from '../../components/match/FixtureFilters';
import { MatchdayDivider, CompetitionHeader, groupFixtures } from '../../components/match/MatchGroup';
import AdSlot from '../../components/shared/AdSlot';
import Seo from '../../components/shared/Seo';
import { Button, EmptyState, ErrorState, SkeletonList } from '../../components/ui';

/**
 * Matches — a list screen, built as a list.
 *
 * The screen this replaces spent roughly 660px of a 360x800 viewport on a sticky
 * navbar, a centred hero ("UPCOMING FIXTURES" at 72px plus a tagline), and a
 * filter bar, then rendered ~360px vertical cards two-up on desktop and one-up on
 * mobile. Exactly one fixture was visible, and it was cut off.
 *
 * Now: 44px header, 72px of filters, then 68px rows. Ten fixtures fit in the space
 * the old screen used for its title.
 *
 * There is no hero. A list screen reached from a tab bar does not need to announce
 * itself — the tab is lit and the header says "Matches". Every pixel above the
 * first row is a pixel not showing a match.
 */
const FixturesPage = () => {
  const location = useLocation();
  const isResultsPage = location.pathname === '/results';

  const [filters, setFilters] = useState({
    status: isResultsPage ? 'COMPLETED' : 'SCHEDULED',
    leagueId: '',
    from: '',
    to: '',
  });

  const { data: leagues } = useQuery({
    queryKey: ['leagues-list-fixtures'],
    queryFn: () => getLeagues(),
  });

  const { data: fixtures, isLoading, isError, refetch } = useQuery({
    queryKey: ['fixtures-list', filters],
    queryFn: () => getFixtures(filters),
  });

  useEffect(() => {
    setFilters(prev => ({ ...prev, status: isResultsPage ? 'COMPLETED' : 'SCHEDULED' }));
  }, [isResultsPage]);

  const list = fixtures?.data ?? [];
  const groups = groupFixtures(list);

  // Put the single ad slot after the first group that completes six fixtures, not
  // after the first group. Days often hold one match, so "after group one" would
  // drop a 64px banner under the very first row and cost the screen its density —
  // the whole point of the rebuild. Six is the first-screen budget; the ad lands
  // just past it, or at the end of a shorter list.
  const adAfterGroup = (() => {
    let seen = 0;
    for (let i = 0; i < groups.length; i += 1) {
      seen += groups[i].competitions.reduce((n, c) => n + c.fixtures.length, 0);
      if (seen >= 6) return i;
    }
    return groups.length - 1;
  })();

  const emptyCopy = {
    SCHEDULED: ['No matches scheduled', 'Fixtures appear here once a league publishes its schedule.'],
    LIVE: ['Nothing live right now', 'Kick-offs show up here the moment a match starts.'],
    COMPLETED: ['No results yet', 'Final scores appear here as matches finish.'],
  }[filters.status] ?? ['No matches found', 'Try a different competition.'];

  return (
    <>
      <Seo
        title={isResultsPage ? 'Results' : 'Matches'}
        description="Fixtures, live scores and results across Rwandan sport."
      />

      <FixtureFilters
        status={filters.status}
        leagueId={filters.leagueId}
        leagues={leagues?.data ?? []}
        onStatus={(status) => setFilters((prev) => ({ ...prev, status }))}
        onLeague={(leagueId) => setFilters((prev) => ({ ...prev, leagueId }))}
      />

      {isLoading ? (
        // Rows, at the real row height — so nothing moves when the data lands.
        <SkeletonList count={8}>
          <MatchRow.Skeleton />
        </SkeletonList>
      ) : isError ? (
        <ErrorState
          title="Could not load matches"
          hint="Check your connection and try again."
          onRetry={refetch}
        />
      ) : list.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title={emptyCopy[0]}
          hint={emptyCopy[1]}
          action={
            filters.leagueId ? (
              <Button
                variant="secondary"
                onClick={() => setFilters((prev) => ({ ...prev, leagueId: '' }))}
              >
                Show all leagues
              </Button>
            ) : null
          }
        />
      ) : (
        <div className="mx-auto max-w-3xl">
          {groups.map((group, gi) => {
            // One competition that day → its name rides in the divider and saves
            // a 24px row. Most days in real data have a single match per league,
            // so this is the common case, not the edge case.
            const solo = group.competitions.length === 1;
            return (
            <section key={group.date ?? `tbd-${gi}`}>
              <MatchdayDivider
                date={group.date}
                competition={solo ? group.competitions[0].name : undefined}
              />
              {group.competitions.map((comp) => (
                <div key={comp.name}>
                  {!solo && (
                    <CompetitionHeader
                      name={comp.name}
                      meta={comp.fixtures.length > 1 ? `${comp.fixtures.length}` : undefined}
                    />
                  )}
                  {comp.fixtures.map((fixture) => (
                    <MatchRow key={fixture.id} fixture={fixture} />
                  ))}
                </div>
              ))}
              {/* One slot, placed past the first-screen budget. Reserves its height
                  while the request is in flight so a late ad never shifts the list. */}
              {gi === adAfterGroup && <AdSlot position="fixtures" />}
            </section>
            );
          })}
        </div>
      )}
    </>
  );
};

export default FixturesPage;
