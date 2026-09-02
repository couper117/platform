import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import cn from '../ui/cn';
import Skeleton from '../ui/Skeleton';

/**
 * The admin portal's shared vocabulary. Every admin screen is built from these
 * four pieces, so they all look like one product instead of twenty.
 *
 * WHY THIS EXISTS. The admin pages were the last part of the app still speaking
 * the pre-redesign language: `font-display uppercase tracking-widest` headings, a
 * black sidebar, `rounded-2xl`, `bg-brand/10` — none of it from the token system
 * the public side was rebuilt on. Each page had also invented its own StatCard, so
 * "make the admin consistent" meant editing twenty private copies.
 *
 * THE RULES, so a new page does not have to guess:
 *   · Sentence case. Not `uppercase tracking-widest` — that treats a label as
 *     decoration, and an operator reads these labels all day.
 *   · One surface: `rounded-card border border-hairline bg-surface`. No shadows
 *     on resting cards; a border is enough separation on a `surface-2` ground.
 *   · Numbers are `tabular-nums`, so a column of them lines up.
 *   · Green is for the ACTIVE state and the primary action, nothing else. An
 *     admin screen full of brand colour has no way left to say "this matters".
 */

/* ── page header ───────────────────────────────────────────────────────── */

/**
 * The top of every admin page: what this screen is, one line on what it does,
 * and the actions that belong to it.
 *
 * `actions` sits on the same row on a desktop and wraps beneath on a phone, so a
 * long title never squeezes a button into an ellipsis.
 */
export const PageHeader = ({
  title,
  subtitle,
  actions,
  className,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) => (
  <header className={cn('mb-6 flex flex-wrap items-start justify-between gap-x-6 gap-y-3', className)}>
    <div className="min-w-0">
      <h1 className="font-display text-xl font-bold tracking-[-0.01em] text-primary sm:text-2xl">
        {title}
      </h1>
      {subtitle && <p className="mt-1 max-w-2xl text-sm text-secondary">{subtitle}</p>}
    </div>
    {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
  </header>
);

/* ── stat ──────────────────────────────────────────────────────────────── */

/**
 * One headline number.
 *
 * The label sits UNDER the number and in sentence case. The old card set it in
 * 10px uppercase with 0.15em of tracking, which is a lot of work to read for the
 * word "Teams", and put the number in a size that competed with the page title.
 *
 * `to` makes the whole tile a link — a number on an admin dashboard is nearly
 * always a question ("which teams?"), and the answer is a page.
 */
export const StatCard = ({
  icon: Icon,
  value,
  label,
  hint,
  to,
  tone = 'default',
}: {
  icon?: any;
  value: React.ReactNode;
  label: React.ReactNode;
  hint?: React.ReactNode;
  to?: string;
  tone?: 'default' | 'brand' | 'warn';
}) => {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="font-display text-3xl font-bold tabular-nums leading-none text-primary">{value}</p>
        {Icon && (
          <span
            className={cn(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-control',
              tone === 'brand' ? 'bg-brand-tint text-brand-text'
                : tone === 'warn' ? 'bg-live/10 text-live'
                  : 'bg-surface-2 text-tertiary'
            )}
          >
            <Icon size={16} aria-hidden="true" />
          </span>
        )}
      </div>
      <p className="mt-3 text-sm font-medium text-primary">{label}</p>
      {hint && <p className="mt-0.5 text-xs text-tertiary">{hint}</p>}
    </>
  );

  const shell = 'rounded-card border border-hairline bg-surface p-4';
  return to ? (
    <Link
      to={to}
      className={cn(shell, 'block transition-colors duration-150 ease-standard hover:border-brand/40 hover:bg-surface-2')}
    >
      {body}
    </Link>
  ) : (
    <div className={shell}>{body}</div>
  );
};

StatCard.Skeleton = function StatCardSkeleton() {
  return (
    <div className="rounded-card border border-hairline bg-surface p-4">
      <div className="flex items-start justify-between">
        <Skeleton className="h-8 w-14" />
        <Skeleton className="h-8 w-8 rounded-control" />
      </div>
      <Skeleton className="mt-3 h-4 w-24" />
    </div>
  );
};

/* ── panel ─────────────────────────────────────────────────────────────── */

/**
 * A titled section. `action` is the one link a panel is allowed — "view all",
 * "manage" — kept to the right of the title where the eye ends up after reading
 * it, rather than buried at the bottom of the list.
 *
 * `flush` drops the body padding for panels whose content is a table or a list of
 * rows that should meet the panel's edges.
 */
export const Panel = ({
  title,
  hint,
  action,
  actionTo,
  children,
  flush = false,
  className,
}: {
  title?: React.ReactNode;
  hint?: React.ReactNode;
  action?: React.ReactNode;
  actionTo?: string;
  children: React.ReactNode;
  flush?: boolean;
  className?: string;
}) => (
  <section className={cn('overflow-hidden rounded-card border border-hairline bg-surface', className)}>
    {(title || action) && (
      <div className="flex items-center justify-between gap-3 border-b border-hairline px-4 py-3">
        <div className="min-w-0">
          {title && <h2 className="font-display text-base font-semibold text-primary">{title}</h2>}
          {hint && <p className="mt-0.5 text-xs text-tertiary">{hint}</p>}
        </div>
        {action && actionTo && (
          <Link
            to={actionTo}
            className="flex shrink-0 items-center gap-1 text-xs font-semibold text-secondary transition-colors duration-150 ease-standard hover:text-brand-text"
          >
            {action}
            <ArrowRight size={13} aria-hidden="true" />
          </Link>
        )}
      </div>
    )}
    <div className={flush ? '' : 'p-4'}>{children}</div>
  </section>
);

/* ── table ─────────────────────────────────────────────────────────────── */

/**
 * The shared shell for an admin table.
 *
 * ITS ONLY JOB IS THE HORIZONTAL SCROLL. Every admin list page had its own
 * `<div className="overflow-x-auto">` or, more often, did not — so a table with
 * one column too many pushed the whole PAGE sideways and every screen scrolled.
 * Wrapping the scroll here means a wide table scrolls inside its own panel and
 * the page never does.
 */
export const TableWrap = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn('scroll-contain w-full overflow-x-auto', className)}>{children}</div>
);

/** Header row cell. Sentence case, quiet, and never bold enough to outweigh data. */
export const Th = ({ children, className, align = 'left' }: { children?: React.ReactNode; className?: string; align?: 'left' | 'right' }) => (
  <th
    scope="col"
    className={cn(
      'whitespace-nowrap border-b border-hairline px-4 py-2.5 text-xs font-semibold text-tertiary',
      align === 'right' ? 'text-right' : 'text-left',
      className
    )}
  >
    {children}
  </th>
);

/** Body cell. */
export const Td = ({ children, className, align = 'left' }: { children?: React.ReactNode; className?: string; align?: 'left' | 'right' }) => (
  <td
    className={cn(
      'border-b border-hairline px-4 py-3 text-sm text-secondary',
      align === 'right' ? 'text-right tabular-nums' : 'text-left',
      className
    )}
  >
    {children}
  </td>
);

export default { PageHeader, StatCard, Panel, TableWrap, Th, Td };
