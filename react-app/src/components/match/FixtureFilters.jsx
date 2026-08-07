import React from 'react';
import cn from '../ui/cn';

/**
 * The two filters the matches screen needs: which state, and which competition.
 *
 * CHIPS, NOT A <select>
 * The old control bar was a native <select> for leagues plus three underlined
 * text buttons, inside a horizontally scrolling flex row with pipe separators —
 * about 68px of chrome whose targets were 11px text. Chips are self-evident, are
 * full-height tap targets, and show the available options without a tap. It also
 * means this screen needs no form primitives.
 *
 * Two rows of 36px rather than one of 44: cramming both dimensions into a single
 * scroll row makes it unclear which axis you are changing, and at 360px the
 * league chips would start off-screen.
 */

const Chip = ({ active, children, ...props }) => (
  <button
    type="button"
    aria-pressed={active}
    className={cn(
      'h-9 shrink-0 rounded-pill border px-3 text-sm transition-colors duration-150 ease-standard',
      active
        ? 'border-primary bg-primary font-semibold text-page'
        : 'border-hairline text-secondary hover:bg-surface-2 hover:text-primary'
    )}
    {...props}
  >
    {children}
  </button>
);

const STATES = [
  ['SCHEDULED', 'Upcoming'],
  ['LIVE', 'Live'],
  ['COMPLETED', 'Results'],
];

const FixtureFilters = ({ status, leagueId, leagues = [], onStatus, onLeague }) => (
  <div className="sticky top-tap z-30 border-b border-hairline bg-surface">
    <div className="scroll-contain flex gap-2 overflow-x-auto px-3 py-1">
      {STATES.map(([value, label]) => (
        <Chip key={value} active={status === value} onClick={() => onStatus(value)}>
          {/* The live chip carries a pulsing dot so "is anything on right now" is
              answerable without tapping it. */}
          {value === 'LIVE' && status !== 'LIVE' && (
            <span className="mr-1.5 inline-block h-1.5 w-1.5 animate-live-pulse rounded-pill bg-live align-middle" />
          )}
          {label}
        </Chip>
      ))}
    </div>

    {leagues.length > 0 && (
      <div className="scroll-contain flex gap-2 overflow-x-auto border-t border-hairline px-3 py-1">
        <Chip active={!leagueId} onClick={() => onLeague('')}>
          All leagues
        </Chip>
        {leagues.map((l) => (
          <Chip
            key={l.id}
            active={String(leagueId) === String(l.id)}
            onClick={() => onLeague(String(l.id))}
          >
            {l.name}
          </Chip>
        ))}
      </div>
    )}
  </div>
);

export default FixtureFilters;
