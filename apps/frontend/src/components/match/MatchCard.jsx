import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { matchState } from './MatchRow';
import ClubCrest from '../ui/ClubCrest';
import StatusPill from '../ui/StatusPill';
import Skeleton from '../ui/Skeleton';
import clubColor from '../../config/clubColors';
import { useMotionSafe, listItem, pressable, scorePop } from '../../lib/motion';
import cn from '../ui/cn';

const MotionLink = motion.create(Link);

/**
 * MatchCard â€” the desktop grid unit. Never rendered below lg.
 *
 * WHY A CARD HERE AND A ROW ON MOBILE
 * A 68px row is the right answer at 360px because vertical space is the scarce
 * resource. At 1440px the scarce resource is horizontal attention: a full-width row
 * strands the score 700px from the team names. A symmetrical card puts home on the
 * left, away on the right and the score between them, so the eye travels a short
 * distance and the two teams read as opposing rather than stacked.
 *
 * THE CENTRE SLOT CARRIES THE STATE
 *   live / halftime / full time â†’ the score
 *   upcoming                    â†’ "VS"
 *   postponed / abandoned       â†’ empty
 *
 * Kickoff time and status live in the top corners, never the centre â€” the centre is
 * reserved so that scanning a grid of twelve cards means reading one column.
 *
 * Vertical padding is deliberately tight: at ~112px, twelve cards fit a 900px
 * viewport. Roomier padding looked better in isolation and showed four.
 */

const Centre = ({ state, m, safe }) => {
  const live = state === 'live' || state === 'halftime';
  const showScore = live || state === 'fulltime';

  if (showScore) {
    return (
      <div className="flex items-baseline justify-center gap-2 font-display text-xl font-semibold tabular-nums">
        <motion.span key={`h${m.homeScore ?? 0}`} {...scorePop(safe && live)}>
          {m.homeScore ?? 0}
        </motion.span>
        <span className="text-tertiary">â€“</span>
        <motion.span key={`a${m.awayScore ?? 0}`} {...scorePop(safe && live)}>
          {m.awayScore ?? 0}
        </motion.span>
      </div>
    );
  }

  if (state === 'upcoming') {
    return <span className="font-display text-base font-semibold text-tertiary">VS</span>;
  }

  // Postponed / abandoned: deliberately empty. The corner pill says why, and an
  // em-dash here would read as a 0â€“0 draw at a glance.
  return null;
};

const Side = ({ team, align }) => (
  <div
    className={cn(
      'flex min-w-0 flex-1 items-center gap-2',
      align === 'right' && 'flex-row-reverse text-right'
    )}
  >
    <ClubCrest team={team} size="md" />
    <span className="min-w-0 flex-1 truncate text-base text-primary">{team?.name || 'TBD'}</span>
  </div>
);

const MatchCard = ({ fixture, className = '' }) => {
  const safe = useMotionSafe();
  const state = matchState(fixture);
  const live = state === 'live' || state === 'halftime';
  const off = state === 'postponed' || state === 'abandoned';
  const d = fixture.matchDate ? new Date(fixture.matchDate) : null;
  const bar = live ? clubColor(fixture.homeTeam) : null;

  return (
    <MotionLink
      to={`/matches/${fixture.id}`}
      variants={listItem(safe)}
      {...pressable(safe)}
      style={bar ? { '--club': bar } : undefined}
      className={cn(
        // h-full so grid siblings equalise: venue is optional, and without this a
        // card lacking one is visibly shorter than the one beside it.
        'block h-full rounded-card border border-hairline bg-surface px-3 py-2',
        // Same identity rule as the row: 3px bar on live only, transparent
        // otherwise so the card never changes width between states.
        'border-l-[3px]',
        live ? 'border-l-[var(--club)]' : 'border-l-transparent',
        'transition-colors duration-150 ease-standard hover:bg-surface-2',
        off && 'opacity-60',
        className
      )}
    >
      {/* Corners: time on the left, state on the right.
          The pill is OMITTED for upcoming matches. "Scheduled" is the default
          expectation, so printing it on every card in a twelve-card grid is twelve
          repetitions of no information â€” and the kickoff time beside it plus the
          "VS" in the centre already say exactly that. The pill appears only when
          the state is worth reporting. */}
      <div className="mb-1.5 flex h-5 items-center justify-between gap-2">
        <span className="text-xs tabular-nums text-tertiary">
          {d ? format(d, 'EEE d MMM Â· HH:mm') : 'Date TBC'}
        </span>
        {state !== 'upcoming' && (
          <StatusPill
            // Derived state, not the raw enum: halftime IS status LIVE on the
            // server, so passing fixture.status straight through labelled a
            // half-time match "Live" and made the two indistinguishable.
            status={state === 'halftime' ? 'HALFTIME' : fixture.status}
            dot={live}
            label={
              state === 'live' && typeof fixture.liveState?.minute === 'number'
                ? `${fixture.liveState.minute}â€™`
                : undefined
            }
          />
        )}
      </div>

      <div className="flex items-center gap-2">
        <Side team={fixture.homeTeam} align="left" />
        <div className="flex min-w-[3.5rem] shrink-0 items-center justify-center">
          <Centre state={state} m={fixture} safe={safe} />
        </div>
        <Side team={fixture.awayTeam} align="right" />
      </div>

      {fixture.venue && (
        <p className="mt-1.5 flex items-center gap-1 text-xs text-tertiary">
          <MapPin size={11} className="shrink-0" aria-hidden="true" />
          <span className="truncate">{fixture.venue}</span>
        </p>
      )}
    </MotionLink>
  );
};

MatchCard.Skeleton = function MatchCardSkeleton() {
  return (
    <div className="rounded-card border border-hairline border-l-[3px] border-l-transparent bg-surface px-3 py-2">
      <div className="mb-1.5 flex items-center justify-between">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="flex items-center gap-2">
        <div className="flex flex-1 items-center gap-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-3 flex-1" />
        </div>
        <Skeleton className="h-4 w-8" />
        <div className="flex flex-1 flex-row-reverse items-center gap-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-3 flex-1" />
        </div>
      </div>
      <Skeleton className="mt-1.5 h-3 w-24" />
    </div>
  );
};

export default MatchCard;
