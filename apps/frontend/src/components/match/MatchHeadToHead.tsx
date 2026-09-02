import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FormStrip } from './StandingsTable';
import ClubCrest from '../ui/ClubCrest';
import { useDateFormat } from '../../i18n/dateLocale';
import cn from '../ui/cn';

/**
 * The two questions a reader asks before a match that a scoreline cannot answer:
 * who usually wins this fixture, and who is playing well right now.
 *
 * NEITHER IS NEW DATA. Both are derived in mockData from the fixture list the app
 * already carries — `h2h` is the previous completed meetings between these two
 * clubs and `form` is each side's last five results. A league table gives points
 * to date; it cannot tell you that the team fourth on points has won its last
 * four, which is the thing that decides whether a fixture is worth watching.
 *
 * THE BAR IS A RECORD, NOT A CHART. Three segments sized by wins / draws / wins,
 * because the only comparison that matters is the relative one and a reader takes
 * it in without reading a number. It falls back to nothing — not an empty bar —
 * when two clubs have never met, which is the common case early in a season.
 *
 * FORM IS OLDEST-FIRST, matching FormStrip and the league table beside it. A strip
 * that runs the other way to the table on the same screen is worse than no strip.
 */

const Side = ({ team, form, align = 'left' }: { team: any; form?: string; align?: 'left' | 'right' }) => (
  <div className={cn('flex min-w-0 flex-1 flex-col gap-2', align === 'right' ? 'items-end' : 'items-start')}>
    <div className={cn('flex min-w-0 items-center gap-2', align === 'right' && 'flex-row-reverse')}>
      <ClubCrest team={team} size="sm" />
      <span className="min-w-0 truncate text-sm font-semibold text-primary">{team?.name}</span>
    </div>
    {form ? <FormStrip form={form} /> : null}
  </div>
);

const MatchHeadToHead = ({ fixture }: { fixture: any }) => {
  const { t } = useTranslation();
  const df = useDateFormat();

  const h2h = fixture?.h2h;
  const form = fixture?.form || {};
  const record = h2h?.record;
  const meetings = h2h?.meetings || [];

  // Nothing to say at all — no previous meetings and neither side has played.
  if (!record && !form.home && !form.away) return null;

  const total = (record?.home ?? 0) + (record?.draws ?? 0) + (record?.away ?? 0);
  const pct = (n: number) => (total ? `${(n / total) * 100}%` : '0%');

  return (
    <section className="rounded-card border border-hairline bg-surface p-4 sm:p-6">
      <h2 className="font-display text-lg font-bold text-primary">{t('match.head_to_head')}</h2>

      <div className="mt-4 flex items-start gap-3">
        <Side team={fixture.homeTeam} form={form.home} />
        <Side team={fixture.awayTeam} form={form.away} align="right" />
      </div>

      {total > 0 ? (
        <>
          <div className="mt-5 flex items-center justify-between text-xs text-tertiary">
            <span className="font-semibold text-primary">{t('match.h2h_wins', { count: record.home })}</span>
            <span>{t('match.h2h_draws', { count: record.draws })}</span>
            <span className="font-semibold text-primary">{t('match.h2h_wins', { count: record.away })}</span>
          </div>
          {/* One bar, three segments. `flex` with percentage widths rather than a
              grid, so a 0-win side simply contributes no segment instead of an
              empty cell that reads as a gap in the data. */}
          <div className="mt-1.5 flex h-1.5 overflow-hidden rounded-pill bg-surface-3">
            <span style={{ width: pct(record.home) }} className="bg-brand" />
            <span style={{ width: pct(record.draws) }} className="bg-tertiary" />
            <span style={{ width: pct(record.away) }} className="bg-live" />
          </div>

          <ul className="mt-4 divide-y divide-hairline border-t border-hairline">
            {meetings.map((m: any) => (
              <li key={m.id}>
                <Link
                  to={`/matches/${m.id}`}
                  className="flex min-h-tap items-center gap-3 py-2.5 transition-colors duration-150 ease-standard hover:opacity-70"
                >
                  <span className="w-20 shrink-0 text-xs text-tertiary">{df(m.date, 'd MMM yy')}</span>
                  <span className="min-w-0 flex-1 truncate text-sm text-secondary">
                    {m.homeTeam?.name} {t('match.versus')} {m.awayTeam?.name}
                  </span>
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-primary">
                    {m.homeScore}-{m.awayScore}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="mt-4 border-t border-hairline pt-4 text-sm text-tertiary">
          {t('match.h2h_none')}
        </p>
      )}
    </section>
  );
};

export default MatchHeadToHead;
