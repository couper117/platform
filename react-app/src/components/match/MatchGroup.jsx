import React from 'react';
import { format, isToday, isTomorrow, isYesterday } from 'date-fns';
import cn from '../ui/cn';

/**
 * The two headers that give a flat fixture list structure.
 *
 * A list of 40 matches across six leagues and two weeks is unreadable without
 * grouping, and grouping headers are the cheapest structure available — a date
 * divider is 28px and buys the whole list an axis.
 *
 * ORDER IS DATE FIRST, THEN COMPETITION. A fan opens this screen asking "what is
 * on today", not "what is happening in the second division". Date answers that;
 * competition qualifies it.
 */

/**
 * Sticky date divider. Stays under the header while its group scrolls, so you
 * always know which day you are looking at — the single most useful thing to
 * pin on this screen.
 */
export const MatchdayDivider = ({ date, competition, className }) => {
  const d = date ? new Date(date) : null;

  const label = !d
    ? 'Date to be confirmed'
    : isToday(d)
      ? 'Today'
      : isTomorrow(d)
        ? 'Tomorrow'
        : isYesterday(d)
          ? 'Yesterday'
          : format(d, 'EEEE d MMMM');

  return (
    <div
      className={cn(
        // top-tap == the 44px header height, so it parks directly beneath it.
        'sticky top-tap z-30 flex h-6 items-center justify-between gap-2',
        'border-y border-hairline bg-surface-2 px-3',
        className
      )}
    >
      <span className="shrink-0 text-xs font-semibold uppercase tracking-wider text-secondary">
        {label}
      </span>
      {/* When a day holds a single competition its name rides here instead of
          taking its own 24px row. With real data most days have one match per
          league, so a separate header cost ~52px of chrome per fixture. */}
      {competition && (
        <span className="min-w-0 truncate text-xs text-tertiary">{competition}</span>
      )}
    </div>
  );
};

/**
 * Competition label within a date group. Deliberately quiet — it qualifies the
 * rows beneath it and must not compete with them for attention.
 */
export const CompetitionHeader = ({ name, meta, className }) => (
  <div className={cn('flex h-5 items-center justify-between gap-2 px-3', className)}>
    <span className="truncate text-xs text-tertiary">{name}</span>
    {meta && <span className="shrink-0 text-xs text-tertiary">{meta}</span>}
  </div>
);

/**
 * Group a flat fixture array into [{ date, competitions: [{ name, fixtures }] }].
 * Preserves the order the API returned (matchDate ascending) rather than
 * re-sorting, so the server stays the authority on ordering.
 */
export const groupFixtures = (fixtures = []) => {
  const byDate = new Map();

  fixtures.forEach((f) => {
    const key = f.matchDate ? new Date(f.matchDate).toDateString() : 'tbd';
    if (!byDate.has(key)) byDate.set(key, { date: f.matchDate || null, comps: new Map() });
    const group = byDate.get(key);
    const comp = f.league?.name || 'Other';
    if (!group.comps.has(comp)) group.comps.set(comp, []);
    group.comps.get(comp).push(f);
  });

  return [...byDate.values()].map(({ date, comps }) => ({
    date,
    competitions: [...comps.entries()].map(([name, list]) => ({ name, fixtures: list })),
  }));
};
