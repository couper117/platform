import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarDays } from 'lucide-react';
import { useSport } from './SportLayout';
import MatchTile from '../../../components/match/MatchTile';
import { MatchdayDivider, CompetitionHeader, groupFixtures } from '../../../components/match/MatchGroup';
import EmptyState from '../../../components/ui/EmptyState';
import Button from '../../../components/ui/Button';
import cn from '../../../components/ui/cn';

/**
 * Matches — the full list for this sport, mirroring FixturesPage's mobile
 * layout (date-grouped cards) inside the tab this sport already owns.
 *
 * Three states, not the six FixturesPage-style filters: Live / Upcoming /
 * Results, because `useSport()` already hands down fixtures pre-split into
 * exactly those three buckets — refetching with a `status` param here would
 * duplicate the request SportLayout already made.
 *
 * The competition filter is client-side for the same reason: the fixtures are
 * already in memory, and leagues rarely number more than a handful per sport,
 * so a request round-trip would only add latency to a filter that is really
 * just an Array.filter.
 */

const Tab = ({ active, children, ...props }) => (
  <button
    type="button"
    aria-current={active ? 'page' : undefined}
    className={cn(
      'relative -mb-px flex min-h-tap shrink-0 items-center whitespace-nowrap px-0.5 text-sm font-semibold',
      'transition-colors duration-150 ease-standard',
      'after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:content-[""]',
      active ? 'text-primary after:bg-brand' : 'text-secondary after:bg-transparent hover:text-primary'
    )}
    {...props}
  >
    {children}
  </button>
);

const Chip = ({ active, children, ...props }) => (
  <button
    type="button"
    className={cn(
      'h-8 shrink-0 rounded-pill border px-3 text-xs font-semibold',
      'transition-colors duration-150 ease-standard',
      active
        ? 'border-brand/40 bg-brand-tint text-brand-text'
        : 'border-hairline text-secondary hover:bg-surface-2 hover:text-primary'
    )}
    {...props}
  >
    {children}
  </button>
);

const STATES = [
  ['LIVE', 'sporthub.tab_live'],
  ['UPCOMING', 'sporthub.tab_upcoming'],
  ['RESULTS', 'sporthub.tab_results'],
];

const SportMatches = () => {
  const { t } = useTranslation();
  const { leagues, live, upcoming, results } = useSport();

  // null = "no manual choice yet", so the default keeps tracking live.length as
  // fixtures load in behind SportLayout's single fetch rather than freezing on
  // whatever was true at mount. Once the fan picks a tab, that choice sticks.
  const [manualStatus, setManualStatus] = useState<string | null>(null);
  const [leagueId, setLeagueId] = useState('');

  const status = manualStatus ?? (live.length > 0 ? 'LIVE' : 'UPCOMING');

  const byStatus = { LIVE: live, UPCOMING: upcoming, RESULTS: results };
  const statusList = byStatus[status] ?? [];
  const filtered = leagueId
    ? statusList.filter((f) => String(f.leagueId ?? f.league?.id) === leagueId)
    : statusList;

  const groups = groupFixtures(filtered);

  const emptyCopy = {
    LIVE: [t('sporthub.no_live_matches'), t('sporthub.no_live_matches_hint')],
    UPCOMING: [t('sporthub.no_upcoming_matches'), t('sporthub.no_upcoming_matches_hint')],
    RESULTS: [t('sporthub.no_results'), t('sporthub.no_results_hint')],
  }[status];

  return (
    <div className="flex flex-col gap-4">
      <nav
        aria-label={t('sporthub.filter_state', 'Match state')}
        className="scroll-contain flex items-stretch gap-6 overflow-x-auto border-b border-hairline"
      >
        {STATES.map(([value, labelKey]) => (
          <Tab key={value} active={status === value} onClick={() => setManualStatus(value)}>
            {/* Honest, not decorative: the dot only appears when something is
                actually live, so switching tabs to check is never necessary. */}
            {value === 'LIVE' && status !== 'LIVE' && live.length > 0 && (
              <span
                aria-hidden="true"
                className="mr-2 inline-block h-1.5 w-1.5 animate-live-pulse rounded-pill bg-live align-middle"
              />
            )}
            {t(labelKey)}
          </Tab>
        ))}
      </nav>

      {leagues.length > 1 && (
        <div
          role="group"
          aria-label={t('sporthub.filter_competition', 'Competition')}
          className="flex flex-wrap gap-2"
        >
          <Chip active={!leagueId} onClick={() => setLeagueId('')}>
            {t('sporthub.all_competitions')}
          </Chip>
          {leagues.map((l) => (
            <Chip key={l.id} active={String(leagueId) === String(l.id)} onClick={() => setLeagueId(String(l.id))}>
              {l.name}
            </Chip>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title={emptyCopy[0]}
          hint={emptyCopy[1]}
          action={
            leagueId ? (
              <Button variant="secondary" onClick={() => setLeagueId('')}>
                {t('sporthub.show_all_competitions')}
              </Button>
            ) : null
          }
        />
      ) : (
        <div className="flex flex-col gap-6">
          {groups.map((group, gi) => {
            // One competition that day → its name rides in the heading, same as
            // FixturesPage's mobile card — see MatchGroup for why.
            const solo = group.competitions.length === 1;
            return (
              <div key={group.date ?? `tbd-${gi}`} className="flex flex-col gap-3">
                {/* Plain heading, not a bordered card wrapper — each fixture is
                    now its own card, so a matchday no longer needs a box of its
                    own to read as a group. */}
                <MatchdayDivider
                  date={group.date}
                  competition={solo ? group.competitions[0].name : undefined}
                  className="h-auto justify-start border-y-0 bg-transparent px-0"
                />
                {group.competitions.map((comp) => (
                  <div key={comp.name} className="flex flex-col gap-2">
                    {!solo && (
                      <CompetitionHeader
                        name={comp.name}
                        meta={comp.fixtures.length > 1 ? `${comp.fixtures.length}` : undefined}
                        className="h-auto bg-transparent px-0"
                      />
                    )}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {comp.fixtures.map((fixture) => (
                        <MatchTile key={fixture.id} fixture={fixture} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SportMatches;
