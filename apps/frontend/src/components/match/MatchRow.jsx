import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import { format } from 'date-fns';
import ClubCrest from '../ui/ClubCrest';
import Skeleton from '../ui/Skeleton';
import clubColor from '../../config/clubColors';
import { useMotionSafe, listItem, pressable, scorePop } from '../../lib/motion';
import cn from '../ui/cn';

const MotionLink = motion.create(Link);

/**
 * MatchRow â€” the atom of this product. Everything else is arranged around it.
 *
 * ANATOMY, and why it is a row and not a card
 *   [3px] [ crests + names          ] [ scores ] [ rail 56px ]
 *
 *   The old FixtureCard was a centred vertical card ~360px tall: two stacked
 *   crest-over-name columns flanking a 48px score, plus a bordered meta footer.
 *   One fixture filled a phone screen. This is 68px, so ten fit in the same space.
 *
 * THE THREE RULES THAT MAKE A LIST SCANNABLE
 *   1. Height is uniform at 68px. A LIVE row is NOT taller â€” if live rows grew,
 *      the list would reflow every time a match kicked off.
 *   2. Scores sit in a fixed-width, right-aligned, tabular column, so every digit
 *      down the list lands on the same vertical line. w-10 fits three digits,
 *      because basketball scores reach 100+.
 *   3. Status lives in a fixed 56px rail. Nothing else may occupy it, so the eye
 *      learns one place to look for "when / is it on / is it over".
 *
 * The 3px club bar appears on live rows ONLY â€” it is what makes a live match
 * findable in a long list without making it bigger. Non-live rows keep a 3px
 * transparent border so nothing shifts horizontally between states. The bar uses
 * the HOME club's colour: a row is anchored to the home side, and picking one
 * consistently beats splitting the bar between two teams.
 */

/* â”€â”€â”€ state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

/**
 * Collapse the backend's FixtureStatus (plus an optional live period) into the
 * six states this row actually renders.
 *
 * NOTE: the fixtures LIST endpoint does not include `liveState`, so on a list
 * screen `minute` and `period` are absent and a live row shows "LIVE" with no
 * clock. That is deliberate â€” better an honest "LIVE" than a fabricated minute.
 */
export const matchState = (fixture = {}) => {
  const status = String(fixture.status || 'SCHEDULED').toUpperCase();
  const period = String(fixture.liveState?.status || fixture.period || '').toLowerCase();

  if (status === 'LIVE') return period === 'halftime' ? 'halftime' : 'live';
  if (status === 'COMPLETED') return 'fulltime';
  if (status === 'POSTPONED') return 'postponed';
  if (status === 'CANCELLED' || status === 'ABANDONED') return 'abandoned';
  return 'upcoming';
};

const SHOWS_SCORE = new Set(['live', 'halftime', 'fulltime']);
const IS_LIVE = new Set(['live', 'halftime']);

/**
 * The match a screen should lead with: a live one if there is one, otherwise the
 * next kickoff. Used to decide which league the desktop rail describes.
 */
export const pickFeatured = (fixtures = []) =>
  fixtures.find((f) => IS_LIVE.has(matchState(f))) ??
  fixtures.find((f) => matchState(f) === 'upcoming') ??
  fixtures[0] ??
  null;

/* â”€â”€â”€ rail â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

const Rail = ({ state, fixture, showDate }) => {
  const minute = fixture.liveState?.minute ?? fixture.minute;

  if (state === 'live') {
    return (
      // Dot and clock pulse together, so "this is happening now" is legible from
      // peripheral vision while scanning. CSS-driven, so reduced-motion kills it
      // through the global rule without needing a JS gate.
      <span className="flex animate-live-pulse flex-col items-center gap-0.5 text-live">
        <span className="h-1.5 w-1.5 rounded-pill bg-live" />
        <span className="text-xs font-semibold tabular-nums leading-none">
          {typeof minute === 'number' ? `${minute}â€™` : 'LIVE'}
        </span>
      </span>
    );
  }

  if (state === 'halftime') {
    return <span className="text-xs font-semibold leading-none text-live">HT</span>;
  }

  if (state === 'fulltime') {
    return <span className="text-xs font-semibold leading-none text-tertiary">FT</span>;
  }

  if (state === 'postponed' || state === 'abandoned') {
    return (
      <span className="text-center text-xs font-medium leading-tight text-danger-text">
        {state === 'postponed' ? 'Post.' : 'Aband.'}
      </span>
    );
  }

  // Upcoming: the kickoff time. The date is omitted by default because the common
  // case is a date-grouped list, where a divider already states the day and
  // repeating it in every row is pure noise.
  const d = fixture.matchDate ? new Date(fixture.matchDate) : null;
  return (
    <span className="flex flex-col items-center leading-tight">
      <time
        dateTime={d ? d.toISOString() : undefined}
        className="text-sm font-semibold text-primary"
      >
        {d ? format(d, 'HH:mm') : 'TBD'}
      </time>
      {showDate && d && <span className="text-xs text-tertiary">{format(d, 'd MMM')}</span>}
    </span>
  );
};

/* â”€â”€â”€ one side of the tie â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

const Side = ({ team, score, showScore, dim, winner, live, safe }) => (
  <div className="flex min-w-0 items-center gap-2">
    <ClubCrest team={team} size="sm" />
    <span
      className={cn(
        'min-w-0 flex-1 truncate text-base',
        dim ? 'text-secondary' : 'text-primary',
        winner && 'font-semibold'
      )}
    >
      {team?.name || 'TBD'}
    </span>
    {/* Fixed, right-aligned, tabular â€” the column every score lines up in. */}
    <span
      data-numeric
      className={cn(
        'w-10 shrink-0 text-right text-base tabular-nums',
        winner ? 'font-semibold text-primary' : dim ? 'text-secondary' : 'text-primary'
      )}
    >
      {showScore ? (
        // Keyed on the value, so it remounts and replays only when the score
        // genuinely changes. Live goals flash --live: a score moving is by
        // definition a live-state event, which is the one thing that colour marks.
        <motion.span
          key={score ?? 0}
          {...scorePop(safe && live)}
          className={cn('inline-block', safe && live && 'text-live')}
        >
          {score ?? 0}
        </motion.span>
      ) : (
        ''
      )}
    </span>
  </div>
);

/* â”€â”€â”€ row â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

const MatchRow = ({ fixture, showDate = false, className = '' }) => {
  const safe = useMotionSafe();
  const state = matchState(fixture);
  const live = IS_LIVE.has(state);
  const showScore = SHOWS_SCORE.has(state);
  const off = state === 'postponed' || state === 'abandoned';

  const home = fixture.homeTeam;
  const away = fixture.awayTeam;
  const hs = fixture.homeScore;
  const as = fixture.awayScore;

  // Only a finished match has a winner to emphasise. Emphasising the leader of a
  // live match would flicker on every goal.
  const homeWon = state === 'fulltime' && hs > as;
  const awayWon = state === 'fulltime' && as > hs;

  const bar = live ? clubColor(home) : null;

  const label = [
    home?.name,
    showScore ? `${hs ?? 0}â€“${as ?? 0}` : 'versus',
    away?.name,
    state === 'live' ? 'live now' : state,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <MotionLink
      to={`/matches/${fixture.id}`}
      aria-label={label}
      style={bar ? { '--club': bar } : undefined}
      variants={listItem(safe)}
      {...pressable(safe)}
      className={cn(
        // h-row is 68px. Uniform across all six states.
        'flex h-row items-center gap-3 border-b border-hairline px-3',
        'border-l-[3px] transition-colors duration-150 ease-standard',
        // Transparent when not live, so the row never shifts horizontally.
        live ? 'border-l-[var(--club)]' : 'border-l-transparent',
        'hover:bg-surface-2 active:bg-surface-2',
        off && 'opacity-60',
        className
      )}
    >
      {/* On a 360px phone this block takes all the width there is. On a 750px
          desktop column it stops at 360px, because letting it stretch would drag
          the score column halfway across the screen and break the vertical line
          the whole layout depends on. */}
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 lg:flex-none lg:basis-[360px]">
        <Side team={home} score={hs} showScore={showScore} dim={off || awayWon} winner={homeWon} live={live} safe={safe} />
        <Side team={away} score={as} showScore={showScore} dim={off || homeWon} winner={awayWon} live={live} safe={safe} />
      </div>

      {/* Desktop fills the gap that opens up with the venue â€” information the
          phone layout has no room for, rather than dead space. */}
      <div className="hidden min-w-0 flex-1 items-center gap-1.5 px-2 lg:flex">
        {fixture.venue && (
          <>
            <MapPin size={12} className="shrink-0 text-tertiary" aria-hidden="true" />
            <span className="truncate text-sm text-tertiary">{fixture.venue}</span>
          </>
        )}
      </div>

      {/* The rail. Fixed 56px, hairline-separated so it reads as its own column. */}
      <div className="flex h-full w-rail shrink-0 items-center justify-center border-l border-hairline">
        <Rail state={state} fixture={fixture} showDate={showDate} />
      </div>
    </MotionLink>
  );
};

/**
 * Skeleton lives here, next to the component, and reuses its exact metrics
 * (h-row, w-rail, w-10 score column). A skeleton in a separate file drifts the
 * first time either side changes.
 */
MatchRow.Skeleton = function MatchRowSkeleton() {
  return (
    <div className="flex h-row items-center gap-3 border-b border-hairline border-l-[3px] border-l-transparent px-3">
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
        {[0, 1].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="h-6 w-6" />
            <Skeleton className={cn('h-3', i ? 'w-20' : 'w-28')} />
            <span className="ml-auto">
              <Skeleton className="h-3 w-4" />
            </span>
          </div>
        ))}
      </div>
      <div className="flex h-full w-rail shrink-0 items-center justify-center border-l border-hairline">
        <Skeleton className="h-3 w-8" />
      </div>
    </div>
  );
};

export default MatchRow;
