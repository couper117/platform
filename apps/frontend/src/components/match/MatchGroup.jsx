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
 * Date divider.
 *
 * NOT STICKY, deliberately. It was, and it collided twice: the filter bar is
 * already sticky at the same offset, so a pinned divider slid underneath it; and
 * on desktop the list sits in an `overflow-hidden` card, which becomes the sticky
 * containing block and parked the divider 44px down from the card's top edge —
 * directly on top of the first row.
 *
 * Both were fixable with a measured offset, but a pinned divider earns its keep
 * only when groups are long enough to scroll past. Real groups here hold one or
 * two matches, so the date is never more than ~90px away. Keeping the filter bar
 * pinned is worth more: it lets you switch Upcoming/Live/Results at any scroll
 * position.
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
        'flex h-6 items-center justify-between gap-2',
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
 * Group by competition, then keep each competition's fixtures in API order.
 *
 * The DESKTOP grouping. Mobile groups by date, because a phone user is asking
 * "what is on today"; a desktop user looking at a two-column grid of twelve cards
 * is scanning a competition at a time, and a date divider every one or two cards
 * would fragment the grid into unusable slivers.
 */
export const groupByCompetition = (fixtures = []) => {
  const byComp = new Map();
  fixtures.forEach((f) => {
    const name = f.league?.name || 'Other';
    if (!byComp.has(name)) byComp.set(name, []);
    byComp.get(name).push(f);
  });
  return [...byComp.entries()].map(([name, list]) => ({ name, fixtures: list }));
};

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
