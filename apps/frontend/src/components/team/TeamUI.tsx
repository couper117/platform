import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Check, MapPin, Clock3, AlertTriangle, Radio } from 'lucide-react';
import { format } from 'date-fns';
import { Avatar, ClubCrest, StatusPill, cn } from '../ui';
import { homeOrAway, opponentOf, sheetFor, timeUntil, reportersOn } from '../../lib/coachMatch';

/**
 * The club portal's shared vocabulary.
 *
 * The same language as components/admin/AdminUI and components/reporter/ReporterUI
 * — sentence case, `rounded-card border border-hairline bg-surface`, no resting
 * shadows, `tabular-nums`, green reserved for the active state and the primary
 * action. The club portal was the last one still speaking the pre-redesign
 * dialect (`font-display uppercase tracking-tighter`, `text-red`, a black
 * sidebar), which is what made a coach and a reporter look like users of two
 * different products while they were handing work to each other.
 *
 * WHERE IT DIFFERS FROM THE REPORTER'S KIT. A reporter sees a fixture as two
 * strangers; a coach sees it as us and them. So every row here is written from
 * the club's point of view — the opponent's name, H or A, and whether OUR sheet
 * is filed — rather than as a neutral home-v-away.
 */

/* ── one match, from the club's side ─────────────────────────────────────── */

/**
 * "v APR FC (H)" rather than "Rayon Sports v APR FC".
 *
 * A coach already knows which club they run. Printing it on every row costs the
 * width that the thing they are actually looking for — who, and where — needs.
 */
export const OpponentLine = ({
  fixture,
  teamId,
  size = 'md',
  className,
}: {
  fixture: any;
  teamId?: number | null;
  size?: 'md' | 'lg';
  className?: string;
}) => {
  const opponent = opponentOf(fixture, teamId);
  const lg = size === 'lg';
  const hasScore = fixture?.homeScore != null && fixture?.awayScore != null;
  const side = homeOrAway(fixture, teamId);
  // Read the score from the club's side too: a coach wants to know whether they
  // won, not which column the home team was in.
  const ours = side === 'H' ? fixture?.homeScore : fixture?.awayScore;
  const theirs = side === 'H' ? fixture?.awayScore : fixture?.homeScore;

  return (
    <div className={cn('flex min-w-0 items-center', lg ? 'gap-3' : 'gap-2.5', className)}>
      <ClubCrest team={opponent} size={lg ? 'lg' : 'md'} />
      <div className="min-w-0 flex-1">
        <p className={cn('truncate font-display font-semibold text-primary', lg ? 'text-lg' : 'text-sm')}>
          <span className="font-normal text-tertiary">v </span>
          {opponent?.shortName || opponent?.name || 'To be confirmed'}
          <span className="ml-1.5 text-xs font-normal text-tertiary">({side})</span>
        </p>
        {hasScore && (
          <p className={cn('font-display font-bold tabular-nums text-primary', lg ? 'text-2xl' : 'text-base')}>
            {ours} <span className="text-tertiary">-</span> {theirs}
          </p>
        )}
      </div>
    </div>
  );
};

/* ── have we filed our sheet ─────────────────────────────────────────────── */

const AUTHOR_TEXT: Record<string, string> = {
  coach: 'Filed by your club',
  reporter: 'Recorded by the reporter',
  admin: 'Filed by a league admin',
  unknown: 'On file',
};

/**
 * The one chip a coach looks for on a fixture row.
 *
 * It says WHO filed it, not just whether something exists, because those are
 * different situations with different actions behind them: a sheet the reporter
 * transcribed from paper is one the coach may want to check, and a missing one
 * before kick-off is the only thing on this screen that is urgent.
 *
 * THE LIST KNOWS LESS THAN THE DETAIL. A list row carries the sheet record but
 * not its author's role, so it can say a sheet exists and not whose it is —
 * `unknown` renders as the neutral "On file", and the copy never claims "you
 * filed this" on the strength of a list.
 */
export const SheetChip = ({ fixture, teamId }: { fixture: any; teamId?: number | null }) => {
  const sheet = sheetFor(fixture, teamId);
  const upcoming = fixture?.status === 'SCHEDULED';

  // NOTHING RATHER THAN A GUESS. A response carrying neither the named players
  // nor the sheet record cannot say whether one exists, and the wrong guess here
  // is the loud one: a club that had filed every sheet used to see a warning on
  // every row, which trains a coach to ignore the only chip on this screen that
  // ever matters.
  if (!sheet.known) return null;

  if (!sheet.filed) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-pill border px-2 py-0.5 text-xs',
          upcoming ? 'border-live/40 text-live' : 'border-hairline text-tertiary'
        )}
      >
        {upcoming && <AlertTriangle size={11} aria-hidden="true" />}
        No team sheet
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-pill border border-hairline px-2 py-0.5 text-xs text-tertiary">
      <Check size={11} aria-hidden="true" />
      {AUTHOR_TEXT[sheet.author || 'unknown']}
    </span>
  );
};

/* ── who is covering us ──────────────────────────────────────────────────── */

/**
 * The reporters assigned to a match, with their photographs.
 *
 * This is the club's window onto the other portal, and the reason the account
 * photograph is worth having at all: before it, a coach asking "who is covering
 * us on Saturday?" got a set of initials. The names link nowhere — the reporter
 * directory needs `reporters.read`, which a coach does not hold, and a link that
 * 403s is worse than no link.
 */
export const CoveredBy = ({ fixture, className }: { fixture: any; className?: string }) => {
  const reporters = reportersOn(fixture);
  if (!reporters.length) {
    return (
      <p className={cn('text-sm text-tertiary', className)}>
        No reporter assigned yet — the league admin decides who covers this match.
      </p>
    );
  }
  return (
    <ul className={cn('space-y-2', className)}>
      {reporters.map((person: any) => (
        <li key={person.id} className="flex items-center gap-2.5">
          <Avatar src={person.avatar} name={person.fullName} size="lg" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-primary">{person.fullName}</p>
            <p className="text-xs text-tertiary">Match reporter</p>
          </div>
        </li>
      ))}
    </ul>
  );
};

/* ── one match in a list ─────────────────────────────────────────────────── */

/**
 * The standard club fixture row, identical on the dashboard, the fixture list and
 * every picker — so a coach learns it once.
 */
export const FixtureRow = ({
  fixture,
  teamId,
  to,
  trailing,
  meta,
  className,
}: {
  fixture: any;
  teamId?: number | null;
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
        <div className="flex items-center gap-2">
          <OpponentLine fixture={fixture} teamId={teamId} className="min-w-0 flex-1" />
          {fixture?.status === 'LIVE' && (
            <StatusPill status="LIVE" className="shrink-0" />
          )}
        </div>
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
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <SheetChip fixture={fixture} teamId={teamId} />
          {meta}
        </div>
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

/* ── watching the match you are not reporting ────────────────────────────── */

/**
 * The link out to the public match page.
 *
 * A coach cannot log events — they hold no `fixtures.report` — but their match is
 * being reported live by somebody, and the public page is where that feed
 * appears. Sending them there is more honest than building a read-only console
 * that would drift from it.
 */
export const WatchLive = ({ fixture, className }: { fixture: any; className?: string }) => (
  <Link
    to={`/matches/${fixture.id}`}
    className={cn(
      'inline-flex min-h-tap items-center gap-1.5 text-sm font-semibold text-live transition-colors duration-150 ease-standard hover:text-primary',
      className
    )}
  >
    <Radio size={14} className="animate-pulse" aria-hidden="true" />
    Follow it live
  </Link>
);

/* ── a labelled fact ─────────────────────────────────────────────────────── */

export const Fact = ({ label, value }: { label: React.ReactNode; value: React.ReactNode }) => (
  <div className="min-w-0">
    <p className="text-xs text-tertiary">{label}</p>
    <p className="mt-0.5 truncate text-sm font-medium text-primary">{value ?? '—'}</p>
  </div>
);

export default { OpponentLine, SheetChip, CoveredBy, FixtureRow, WatchLive, Fact };
