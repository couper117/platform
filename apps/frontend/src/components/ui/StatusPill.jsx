import React from 'react';
import cn from './cn';

/**
 * Semantic state chip. The one place domain status becomes colour.
 *
 * Takes a raw backend enum — TeamStatus, PlayerStatus, DocStatus, FixtureStatus,
 * RegStatus — and maps it to a token here, once, so no screen re-decides what
 * "SUSPENDED" looks like.
 *
 * TWO TREATMENTS, AND THE REASON IS CONTRAST
 *   Filled  — live only. --live + --on-live is 5.42:1, and live is the single
 *             state a fan scans a list for, so it is the only one that shouts.
 *   Outline — everything else: a tinted dot plus a hairline border. Notably this
 *             is how `rejected` renders, because a --danger FILL cannot carry an
 *             11px label at AA (--on-danger tops out at 4.43:1). Outline lets
 *             --danger-text do the work at 5.71:1 instead.
 */

const TONES = {
  live: {
    // The only filled pill in the system.
    wrap: 'bg-live text-live-on border-transparent font-semibold',
    dot: 'bg-current animate-live-pulse',
  },
  success: { wrap: 'border-success/40 text-success', dot: 'bg-success' },
  danger: { wrap: 'border-danger/40 text-danger-text', dot: 'bg-danger' },
  neutral: { wrap: 'border-hairline text-secondary', dot: 'bg-tertiary' },
};

/** Backend enum → tone + human label. Single source of truth. */
const STATUS = {
  // Team / Player
  VERIFIED: ['success', 'Verified'],
  PENDING: ['neutral', 'Pending'],
  SUSPENDED: ['danger', 'Suspended'],
  REJECTED: ['danger', 'Rejected'],
  // Documents / registrations
  APPROVED: ['success', 'Approved'],
  NEW: ['neutral', 'New'],
  // Fixtures
  LIVE: ['live', 'Live'],
  SCHEDULED: ['neutral', 'Scheduled'],
  // Umuganda-aware states. CONFIRMED is a positive assertion ("this is going
  // ahead"), so it takes success. UMUGANDA_CONFLICT is deliberately NOT danger —
  // a clash is a question for an admin, not a failure, and danger red is
  // reserved for red cards and rejections.
  CONFIRMED: ['success', 'Confirmed'],
  UMUGANDA_CONFLICT: ['neutral', 'Umuganda conflict'],
  RESCHEDULED: ['neutral', 'Rescheduled'],
  COMPLETED: ['neutral', 'Full time'],
  POSTPONED: ['danger', 'Postponed'],
  CANCELLED: ['danger', 'Cancelled'],
  ABANDONED: ['danger', 'Abandoned'],
  HALFTIME: ['live', 'Half time'],
  // Leagues / competitions
  UPCOMING: ['neutral', 'Upcoming'],
  ACTIVE: ['success', 'Active'],
  ONGOING: ['live', 'Ongoing'],
};

/**
 * props.status  — backend enum, case-insensitive
 * props.label   — override the mapped label (e.g. "Live 67’")
 * props.dot     — show the leading dot (default true)
 * props.className, plus any span attributes, pass through.
 * @param {any} props
 */
const StatusPill = ({ status, label, dot = true, className, ...props }) => {
  const key = String(status || '').toUpperCase();
  const [toneName, mapped] = STATUS[key] ?? ['neutral', label || key || '—'];
  const tone = TONES[toneName] ?? TONES.neutral;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-pill border px-2 py-0.5',
        'text-xs whitespace-nowrap',
        tone.wrap,
        className
      )}
      {...props}
    >
      {dot && <span className={cn('h-1.5 w-1.5 shrink-0 rounded-pill', tone.dot)} />}
      {label ?? mapped}
    </span>
  );
};

export default StatusPill;
