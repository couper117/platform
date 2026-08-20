import React from 'react';
import Avatar from '../ui/Avatar';
import Skeleton from '../ui/Skeleton';
import cn from '../ui/cn';

/**
 * Top scorers for the rail.
 *
 * The round avatar marks the player as a person; the club is plain text. A squared
 * crest was tried here and cut â€” shrunk to fit a 16px sub-line its initials were
 * illegible, and the avatar already carries the distinction on this row.
 *
 * Goals are the sort key and the only number shown large. Assists sit beside the
 * club as secondary text rather than taking a column: a 320px rail can afford one
 * emphasis, and goals are what "top scorer" means.
 */
const TopScorers = ({ scorers = [], limit = 5, className = '' }) => {
  if (scorers.length === 0) return null;

  return (
    <div className={cn('overflow-hidden rounded-card border border-hairline bg-surface', className)}>
      <div className="border-b border-hairline px-3 py-2">
        <h2 className="font-display text-base font-semibold text-primary">Top scorers</h2>
      </div>
      <ol>
        {scorers.slice(0, limit).map((s, i) => (
          <li
            key={s.id ?? s.playerId}
            className="flex items-center gap-2 border-b border-hairline px-3 py-2 last:border-0"
          >
            <span className="w-4 shrink-0 text-xs tabular-nums text-tertiary">{i + 1}</span>
            <Avatar name={s.player?.fullName} src={s.player?.photo} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-primary">{s.player?.fullName}</p>
              {/* No crest on this sub-line: shrunk to fit it, the initials were
                  illegible, and the round player avatar already carries the
                  person/organisation distinction on this row. */}
              <p className="flex items-center gap-1.5 text-xs text-tertiary">
                <span className="truncate">{s.team?.shortName || s.team?.name}</span>
                {s.assists > 0 && <span className="shrink-0 tabular-nums">Â· {s.assists} a</span>}
              </p>
            </div>
            <span className="shrink-0 font-display text-lg font-semibold tabular-nums text-primary">
              {s.goals ?? 0}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
};

TopScorers.Skeleton = function TopScorersSkeleton({ rows = 5 }) {
  return (
    <div className="overflow-hidden rounded-card border border-hairline bg-surface">
      <div className="border-b border-hairline px-3 py-2">
        <Skeleton className="h-4 w-28" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-2 border-b border-hairline px-3 py-2 last:border-0">
          <Skeleton className="h-3 w-3" />
          <Skeleton className="h-6 w-6" circle />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-2 w-16" />
          </div>
          <Skeleton className="h-4 w-5" />
        </div>
      ))}
    </div>
  );
};

export default TopScorers;
