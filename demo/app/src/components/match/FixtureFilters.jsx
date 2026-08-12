import React from 'react';
import Select from '../ui/Select';
import cn from '../ui/cn';

/**
 * The two filters this screen needs: which state, and which competition.
 *
 * TWO CONTROLS FOR THE COMPETITION, ONE PER BREAKPOINT — and they are mutually
 * exclusive, not duplicated.
 *
 *   mobile  chips on their own scrolling row. Self-evident, full-height tap
 *           targets, and they show what is available without a tap. There is no
 *           room for a label plus a control on one 360px line.
 *   desktop a single strip: state on the left, a league <select> pushed to the far
 *           right. A desktop viewport fits both on one row, and a select is the
 *           denser control when there is a pointer and a keyboard to drive it.
 *
 * The old control bar was a native <select>, three underlined text buttons and pipe
 * separators in one scrolling flex row — about 68px of chrome whose targets were
 * 11px of text.
 */

const Chip = ({ active, children, ...props }) => (
  <button
    type="button"
    aria-pressed={active}
    className={cn(
      'h-9 shrink-0 rounded-pill border px-3 text-sm transition-colors duration-150 ease-standard',
      active
        ? 'border-brand-strong bg-brand-strong font-bold text-brand-on shadow-brand'
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
    <div className="mx-auto max-w-3xl lg:max-w-6xl lg:px-6">
      {/* State — one row at every width. On desktop the league select joins it. */}
      <div className="scroll-contain flex items-center gap-2 overflow-x-auto px-3 py-1 lg:px-0 lg:py-2">
        {STATES.map(([value, label]) => (
          <Chip key={value} active={status === value} onClick={() => onStatus(value)}>
            {/* The live chip carries a pulsing dot, so "is anything on right now"
                is answerable without tapping it. */}
            {value === 'LIVE' && status !== 'LIVE' && (
              <span className="mr-1.5 inline-block h-1.5 w-1.5 animate-live-pulse rounded-pill bg-live align-middle" />
            )}
            {label}
          </Chip>
        ))}

        {leagues.length > 0 && (
          <Select
            className="ml-auto hidden lg:inline-flex"
            label="Competition"
            value={leagueId}
            // Select forwards the native event; unwrap it here.
            onChange={(e) => onLeague(e.target.value)}
            placeholder="All leagues"
            options={leagues.map((l) => ({ value: String(l.id), label: l.name }))}
          />
        )}
      </div>

      {/* Competition — mobile only, as chips. */}
      {leagues.length > 0 && (
        <div className="scroll-contain flex gap-2 overflow-x-auto border-t border-hairline px-3 py-1 lg:hidden">
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
  </div>
);

export default FixtureFilters;
