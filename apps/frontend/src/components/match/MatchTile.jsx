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
 * MatchTile — one self-contained match card for /sports/:slug/matches and the
 * sport Overview tab.
 *
 * WHY THIS EXISTS ALONGSIDE MatchRow AND MatchCard
 * MatchRow packs a fixture into a 68px strip so a long list stays scannable —
 * exactly right for a single-sport list on `/fixtures`. But stack sport pages
 * mix football, basketball, volleyball fixtures in one feed, and a page built
 * entirely from 68px rows inside one bordered container reads as a spreadsheet,
 * worse on a 360px phone where the row's desktop-only venue column just
 * disappears and leaves an even barer line. Each fixture here is its own card:
 * bordered, self-describing (it carries its own competition name — it does not
 * lean on a table header), and built to sit in a responsive grid instead of a
 * stacked list.
 *
 * ANATOMY
 *   [ competition name                          state pill / kickoff time ]
 *   [ crest  home name                                     score ]
 *   [ crest  away name                                     score ]
 *   [ venue                                                       ]
 *
 * The state slot top-right carries whatever is worth reporting: the live
 * label for a live/half-time match, a quiet "FT" once it's over, the danger
 * pill for postponed/abandoned, or — for an upcoming fixture — the kickoff
 * time standing in for a status nobody needs told ("Scheduled" repeated across
 * a grid of a dozen cards is noise, same reasoning MatchCard uses to omit its
 * pill on upcoming rows).
 */

const TopState = ({ state, fixture }) => {
  const live = state === 'live' || state === 'halftime';

  if (live) {
    const minute = fixture.liveState?.minute ?? fixture.minute;
    return (
      <StatusPill
        status={state === 'halftime' ? 'HALFTIME' : 'LIVE'}
        dot={live}
        label={
          // Prefer the per-sport label the API sends ("67'", "Q4", "Set 2") over
          // a raw minute, which only means something in football — see
          // MatchRow's Rail for the same call.
          state === 'live'
            ? fixture.statusLabel || (typeof minute === 'number' ? `${minute}'` : undefined)
            : undefined
        }
        className="shrink-0"
      />
    );
  }

  if (state === 'fulltime') {
    return <span className="shrink-0 text-xs font-semibold text-tertiary">FT</span>;
  }

  if (state === 'postponed' || state === 'abandoned') {
    return <StatusPill status={fixture.status} className="shrink-0" />;
  }

  // Upcoming: the kickoff time takes the slot a status pill would otherwise
  // occupy, since "Scheduled" carries no information a time doesn't already.
  const d = fixture.matchDate ? new Date(fixture.matchDate) : null;
  return (
    <time
      dateTime={d ? d.toISOString() : undefined}
      className="shrink-0 text-xs font-semibold tabular-nums text-secondary"
    >
      {d ? format(d, 'HH:mm') : 'TBD'}
    </time>
  );
};

const TeamRow = ({ team, score, showScore, bold, dim, live, safe }) => (
  <div className="flex min-w-0 items-center gap-2">
    <ClubCrest team={team} size="md" />
    <span
      className={cn(
        'min-w-0 flex-1 truncate text-base',
        dim ? 'text-secondary' : 'text-primary',
        bold && 'font-semibold'
      )}
    >
      {team?.name || 'TBD'}
    </span>
    {showScore && (
      <span
        data-numeric
        className={cn(
          'min-w-[1.5rem] shrink-0 text-right text-base tabular-nums',
          bold ? 'font-semibold text-primary' : dim ? 'text-secondary' : 'text-primary'
        )}
      >
        {/* Keyed on the value so it replays only when the score actually
            changes — same idiom as MatchRow/MatchCard. */}
        <motion.span key={score ?? 0} {...scorePop(safe && live)} className="inline-block">
          {score ?? 0}
        </motion.span>
      </span>
    )}
  </div>
);

const MatchTile = ({ fixture, className = '' }) => {
  const safe = useMotionSafe();
  const state = matchState(fixture);
  const live = state === 'live' || state === 'halftime';
  const showScore = state === 'live' || state === 'halftime' || state === 'fulltime';
  const off = state === 'postponed' || state === 'abandoned';
  const finished = state === 'fulltime';

  const home = fixture.homeTeam;
  const away = fixture.awayTeam;
  const hs = fixture.homeScore;
  const as = fixture.awayScore;

  // Winner emphasis is restricted to full time, same rule MatchRow documents:
  // bolding the leader of a live match would flip back and forth on every goal.
  const homeLeads = finished && (hs ?? 0) > (as ?? 0);
  const awayLeads = finished && (as ?? 0) > (hs ?? 0);

  const bar = live ? clubColor(home) : null;

  const label = [
    home?.name,
    showScore ? `${hs ?? 0}–${as ?? 0}` : 'versus',
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
        // h-full so grid siblings equalise — a card without a venue line is
        // otherwise visibly shorter than the one beside it.
        'flex h-full flex-col gap-2 rounded-card border border-hairline bg-surface p-3',
        // Same identity rule as MatchRow/MatchCard: 3px club bar on live only,
        // transparent otherwise so the card never shifts width between states.
        'border-l-[3px]',
        live ? 'border-l-[var(--club)]' : 'border-l-transparent',
        'transition-colors duration-150 ease-standard hover:bg-surface-2',
        off && 'opacity-60',
        className
      )}
    >
      <div className="flex h-5 items-center justify-between gap-2">
        <span className="min-w-0 flex-1 truncate text-xs text-tertiary">
          {fixture.league?.name || 'Other'}
        </span>
        <TopState state={state} fixture={fixture} />
      </div>

      <div className="flex flex-col gap-1.5">
        <TeamRow team={home} score={hs} showScore={showScore} bold={homeLeads} dim={off} live={live} safe={safe} />
        <TeamRow team={away} score={as} showScore={showScore} bold={awayLeads} dim={off} live={live} safe={safe} />
      </div>

      {fixture.venue && (
        <p className="flex items-center gap-1 text-xs text-tertiary">
          <MapPin size={11} className="shrink-0" aria-hidden="true" />
          <span className="truncate">{fixture.venue}</span>
        </p>
      )}
    </MotionLink>
  );
};

/**
 * Skeleton lives here, next to the component, and reuses its exact metrics
 * (p-3, h-5 top row, h-8 crests) so it cannot drift from the real card.
 */
MatchTile.Skeleton = function MatchTileSkeleton() {
  return (
    <div className="flex h-full flex-col gap-2 rounded-card border border-hairline border-l-[3px] border-l-transparent bg-surface p-3">
      <div className="flex h-5 items-center justify-between gap-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-4 w-12" />
      </div>
      <div className="flex flex-col gap-1.5">
        {[0, 1].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="h-8 w-8" />
            <Skeleton className={cn('h-3 flex-1', i ? 'max-w-[60%]' : 'max-w-[80%]')} />
            <Skeleton className="h-3 w-6" />
          </div>
        ))}
      </div>
      <Skeleton className="h-3 w-28" />
    </div>
  );
};

export default MatchTile;
