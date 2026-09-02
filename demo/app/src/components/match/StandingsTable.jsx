import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import ClubCrest from '../ui/ClubCrest';
import Skeleton from '../ui/Skeleton';
import { useMotionSafe, DUR, EASE } from '../../lib/motion';
import cn from '../ui/cn';

/**
 * League table.
 *
 * SIX COLUMNS AND NO HORIZONTAL SCROLL, EVER. pos / crest / name / P / GD / Pts.
 * The rest — W, D, L, goals for and against — lives behind an inline expansion,
 * because a sideways-scrolling table hides the column you are looking for and, in
 * a 320px rail, would hide most of them.
 *
 * The four columns that got cut are the ones you can derive or rarely need; the
 * ones kept are what people actually read a table for: who is top, on how many
 * points, having played how many.
 *
 * `showForm` IS A PROP, NOT A BREAKPOINT, and that distinction matters. Recent
 * form is the one cut column a reader genuinely scans a table for — it answers
 * "who is actually playing well", which points-to-date cannot. But this component
 * renders BOTH full width on a standings page and inside a 320px rail on
 * /fixtures, and both of those are desktop. A `lg:` variant would put the strip in
 * the rail too and break the no-scroll rule it was written to protect. The page
 * knows how much room it has; the component cannot.
 */

/** W/D/L from the `form` string, most recent last. Colour is the only signal. */
export const FormStrip = ({ form = '', className = '' }) => {
  const marks = form.slice(-5).split('');
  if (marks.length === 0) return null;
  return (
    <div className={cn('flex items-center gap-1', className)} aria-label={`Recent form: ${form}`}>
      {marks.map((m, i) => (
        <span
          key={i}
          title={m === 'W' ? 'Won' : m === 'L' ? 'Lost' : 'Drawn'}
          className={cn(
            'h-1.5 w-4 rounded-none',
            m === 'W' ? 'bg-success' : m === 'L' ? 'bg-danger' : 'bg-tertiary'
          )}
        />
      ))}
    </div>
  );
};

const Stat = ({ label, value }) => (
  <div className="flex flex-col">
    <span className="text-xs text-tertiary">{label}</span>
    <span className="text-sm tabular-nums text-primary">{value}</span>
  </div>
);

const StandingsRow = ({ row, expanded, onToggle, safe, showForm }) => {
  const gd = (row.goalsFor ?? 0) - (row.goalsAgainst ?? 0);

  return (
    <li className="border-b border-hairline last:border-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors duration-150 ease-standard hover:bg-surface-2"
      >
        <span className="w-4 shrink-0 text-xs tabular-nums text-tertiary">{row.rank}</span>
        <ClubCrest team={row.team} size="sm" />
        <span className="min-w-0 flex-1 truncate text-sm text-primary">{row.team?.name}</span>
        {showForm && row.form ? <FormStrip form={row.form} className="mr-2 hidden shrink-0 sm:flex" /> : null}
        <span className="w-5 shrink-0 text-right text-sm tabular-nums text-secondary">
          {row.played ?? 0}
        </span>
        <span className="w-7 shrink-0 text-right text-sm tabular-nums text-secondary">
          {gd > 0 ? `+${gd}` : gd}
        </span>
        <span className="w-6 shrink-0 text-right text-sm font-semibold tabular-nums text-primary">
          {row.points ?? 0}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={safe ? { height: 0, opacity: 0 } : false}
            animate={{ height: 'auto', opacity: 1 }}
            exit={safe ? { height: 0, opacity: 0 } : undefined}
            transition={{ duration: DUR.base, ease: EASE }}
            className="overflow-hidden bg-surface-2"
          >
            <div className="flex items-end justify-between gap-3 px-3 py-2">
              <Stat label="W" value={row.won ?? 0} />
              <Stat label="D" value={row.drawn ?? 0} />
              <Stat label="L" value={row.lost ?? 0} />
              <Stat label="GF" value={row.goalsFor ?? 0} />
              <Stat label="GA" value={row.goalsAgainst ?? 0} />
              {!showForm && row.form ? <FormStrip form={row.form} className="pb-1" /> : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
};

const StandingsTable = ({ rows = [], className = '', showForm = false }) => {
  const safe = useMotionSafe();
  const [openId, setOpenId] = useState(null);

  if (rows.length === 0) return null;

  return (
    <div className={cn('overflow-hidden rounded-card border border-hairline bg-surface', className)}>
      <div className="flex items-center gap-2 border-b border-hairline px-3 py-2">
        <h2 className="flex-1 font-display text-base font-semibold text-primary">Table</h2>
        {/* Column key, so the three abbreviations are never a guess. */}
        {showForm && <span className="mr-2 hidden w-[76px] text-xs text-tertiary sm:block">Form</span>}
        <span className="w-5 text-right text-xs text-tertiary">P</span>
        <span className="w-7 text-right text-xs text-tertiary">GD</span>
        <span className="w-6 text-right text-xs text-tertiary">Pts</span>
      </div>
      <ul>
        {rows.map((row) => (
          <StandingsRow
            key={row.id ?? row.teamId}
            row={row}
            safe={safe}
            showForm={showForm}
            expanded={openId === (row.id ?? row.teamId)}
            onToggle={() =>
              setOpenId((cur) => (cur === (row.id ?? row.teamId) ? null : row.id ?? row.teamId))
            }
          />
        ))}
      </ul>
    </div>
  );
};

StandingsTable.Skeleton = function StandingsTableSkeleton({ rows = 6 }) {
  return (
    <div className="overflow-hidden rounded-card border border-hairline bg-surface">
      <div className="border-b border-hairline px-3 py-2">
        <Skeleton className="h-4 w-16" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-2 border-b border-hairline px-3 py-2 last:border-0">
          <Skeleton className="h-3 w-3" />
          <Skeleton className="h-6 w-6" />
          <Skeleton className="h-3 flex-1" />
          <Skeleton className="h-3 w-6" />
        </div>
      ))}
    </div>
  );
};

export default StandingsTable;
