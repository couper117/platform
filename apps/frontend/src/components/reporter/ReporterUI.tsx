import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Check, MapPin, Clock3, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { ClubCrest, StatusPill, cn } from '../ui';
import { readinessSummary, timeUntil } from '../../lib/reporterMatch';

/**
 * The reporter portal's shared vocabulary.
 *
 * It speaks the SAME LANGUAGE as components/admin/AdminUI — sentence case,
 * `rounded-card border border-hairline bg-surface`, no resting shadows,
 * `tabular-nums` on every number, green reserved for the active state and the
 * primary action. The reporter portal was the last surface still on the
 * pre-redesign shell, and the point of this file is that it never diverges again:
 * a reporter and an admin looking at the same fixture see the same object.
 *
 * WHAT IS DIFFERENT, AND WHY. Admin screens are read with a pointer at a desk;
 * these are read one-handed, standing, at the side of a pitch, often in sunlight.
 * So targets clear 44px rather than the admin-dense 36px, the match identity is
 * always crest-first (a reporter recognises a crest faster than a name they are
 * reading upside down), and time is relative wherever it is still ahead — "in 40
 * min" answers the question a reporter has, where "14:30" makes them do the
 * arithmetic.
 */

/* -- who is playing ------------------------------------------------------- */

/**
 * Two crests, two names, and the score where there is one.
 *
 * `size="lg"` is the console's header; `md` is a list row. The score only renders
 * once the match has one, so a scheduled fixture is not shown a hopeful "0 - 0"
 * that a reporter might mistake for a result already saved.
 */
export const MatchIdentity = ({
  fixture,
  size = 'md',
  showScore = true,
  className,
}: {
  fixture: any;
  size?: 'md' | 'lg';
  showScore?: boolean;
  className?: string;
}) => {
  const lg = size === 'lg';
  const hasScore = fixture?.homeScore != null && fixture?.awayScore != null;
  const name = (team: any) => team?.shortName || team?.name || '—';

  return (
    <div className={cn('flex min-w-0 items-center', lg ? 'gap-4' : 'gap-3', className)}>
      <ClubCrest team={fixture?.homeTeam} size={lg ? 'lg' : 'md'} />
      <div className="min-w-0 flex-1 text-center">
        <p className={cn('truncate font-display font-semibold text-primary', lg ? 'text-base' : 'text-sm')}>
          {name(fixture?.homeTeam)}
          <span className="mx-1.5 font-normal text-tertiary">v</span>
          {name(fixture?.awayTeam)}
        </p>
        {showScore && hasScore && (
          <p
            className={cn(
              'font-display font-bold tabular-nums leading-none text-primary',
              lg ? 'mt-2 text-4xl' : 'mt-1 text-lg'
            )}
          >
            {fixture.homeScore} <span className="text-tertiary">-</span> {fixture.awayScore}
          </p>
        )}
      </div>
      <ClubCrest team={fixture?.awayTeam} size={lg ? 'lg' : 'md'} />
    </div>
  );
};

/* -- where it stands ------------------------------------------------------ */

/**
 * The fixture's status, with the live minute folded in.
 *
 * StatusPill already owns the colour of every backend enum; this only supplies
 * the label, so a live match reads "Live 67'" and a finished one reads "Full
 * time" without this file re-deciding what live looks like.
 */
export const MatchStatusChip = ({ fixture, minute }: { fixture: any; minute?: string }) => (
  <StatusPill
    status={fixture?.status}
    label={fixture?.status === 'LIVE' && minute ? `Live ${minute}` : undefined}
  />
);

/* -- one match in a list -------------------------------------------------- */

/**
 * The standard assigned-match row — the single object this portal is built
 * around, so it looks identical on Today, on My matches and in every picker.
 *
 * The second line carries the three facts a reporter needs before travelling:
 * when (relative for anything upcoming, absolute once it is history), where, and
 * which competition. `trailing` is for the one action the row offers.
 */
export const MatchRow = ({
  fixture,
  to,
  trailing,
  meta,
  className,
}: {
  fixture: any;
  to: string;
  trailing?: React.ReactNode;
  meta?: React.ReactNode;
  className?: string;
}) => {
  const upcoming = fixture?.status === 'SCHEDULED';
  const when = fixture?.matchDate
    ? upcoming
      ? `${format(new Date(fixture.matchDate), 'EEE d MMM, HH:mm')} · ${timeUntil(fixture.matchDate)}`
      : format(new Date(fixture.matchDate), 'EEE d MMM, HH:mm')
    : 'Date to be confirmed';

  return (
    <Link
      to={to}
      className={cn(
        'group flex min-h-tap items-center gap-3 rounded-card border border-hairline bg-surface p-3 sm:p-4',
        'transition-colors duration-150 ease-standard hover:border-brand/40 hover:bg-surface-2',
        className
      )}
    >
      <div className="min-w-0 flex-1">
        <MatchIdentity fixture={fixture} />
        <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-tertiary">
          <span className="inline-flex items-center gap-1 tabular-nums">
            <Clock3 size={11} aria-hidden="true" />
            {when}
          </span>
          {fixture?.venue && (
            <span className="inline-flex items-center gap-1">
              <MapPin size={11} aria-hidden="true" />
              {fixture.venue}
            </span>
          )}
          {fixture?.league?.name && <span className="truncate">{`· ${fixture.league.name}`}</span>}
        </p>
        {meta && <div className="mt-2">{meta}</div>}
      </div>
      {trailing ?? (
        <ChevronRight
          size={18}
          className="shrink-0 text-tertiary transition-transform group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      )}
    </Link>
  );
};

/* -- is this match ready to report ---------------------------------------- */

/**
 * The pre-match checklist, as a row of chips.
 *
 * A done item is quiet — it is finished, it does not need attention. An
 * outstanding REQUIRED item is the only thing on the row that carries a warning
 * colour, because it is the only one that will cost the reporter something at
 * kick-off. Optional items sit in between: visible, not alarming.
 */
export const ReadinessChips = ({
  fixture,
  onFix,
  className,
}: {
  fixture: any;
  onFix?: (key: string) => void;
  className?: string;
}) => {
  const { items } = readinessSummary(fixture);
  if (!items.length) return null;

  return (
    <ul className={cn('flex flex-wrap gap-1.5', className)}>
      {items.map((item) => {
        const chip = (
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-pill border px-2 py-0.5 text-xs',
              item.done
                ? 'border-hairline text-tertiary'
                : item.optional
                  ? 'border-hairline text-secondary'
                  : 'border-live/40 text-live'
            )}
          >
            {item.done ? (
              <Check size={11} aria-hidden="true" />
            ) : !item.optional ? (
              <AlertTriangle size={11} aria-hidden="true" />
            ) : null}
            {item.label}
          </span>
        );
        return (
          <li key={item.key} title={item.done ? undefined : item.why}>
            {onFix && !item.done ? (
              <button type="button" onClick={() => onFix(item.key)}>
                {chip}
              </button>
            ) : (
              chip
            )}
          </li>
        );
      })}
    </ul>
  );
};

/* -- moving between sections of one match --------------------------------- */

/**
 * The console's tab bar — the same underline treatment the admin dashboard uses
 * for its oversight tabs, so the two portals do not each invent a tab.
 *
 * Horizontally scrollable inside its own container: four tabs plus a badge do not
 * fit at 360px, and a tab strip that pushes the page sideways is the defect
 * `scroll-contain` exists to prevent.
 *
 * NOT `role="tablist"`. The ARIA tab pattern is a contract: every `role="tab"`
 * owes an `aria-controls` pointing at a real `role="tabpanel"`, and it owes
 * arrow-key navigation between the tabs. Half of it — the roles without the
 * panels — is worse than none, because a screen reader then announces "tab 2 of
 * 4" and finds nothing it controls. These are toggle buttons that swap what is
 * below them, so they are announced as exactly that: pressed or not.
 */
export const Tabs = ({
  tabs,
  value,
  onChange,
  label = 'Sections',
  className,
}: {
  tabs: Array<{ id: string; label: React.ReactNode; badge?: React.ReactNode }>;
  value: string;
  onChange: (id: string) => void;
  label?: string;
  className?: string;
}) => (
  <div
    role="group"
    aria-label={label}
    className={cn('scroll-contain flex gap-1 overflow-x-auto border-b border-hairline', className)}
  >
    {tabs.map((tab) => {
      const active = tab.id === value;
      return (
        <button
          key={tab.id}
          type="button"
          aria-pressed={active}
          onClick={() => onChange(tab.id)}
          className={cn(
            'relative flex min-h-tap shrink-0 items-center gap-1.5 whitespace-nowrap px-3 text-sm',
            'transition-colors duration-150 ease-standard',
            active ? 'font-semibold text-primary' : 'text-tertiary hover:text-primary'
          )}
        >
          {tab.label}
          {tab.badge != null && (
            <span className="rounded-pill bg-surface-2 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-secondary">
              {tab.badge}
            </span>
          )}
          {active && <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-brand" />}
        </button>
      );
    })}
  </div>
);

/* -- a labelled fact ------------------------------------------------------ */

/** Label above, value below. For match detail: venue, referee, competition. */
export const Fact = ({ label, value }: { label: React.ReactNode; value: React.ReactNode }) => (
  <div className="min-w-0">
    <p className="text-xs text-tertiary">{label}</p>
    <p className="mt-0.5 truncate text-sm font-medium text-primary">{value ?? '—'}</p>
  </div>
);

export default { MatchIdentity, MatchStatusChip, MatchRow, ReadinessChips, Tabs, Fact };
