import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, RefreshCw, AlertTriangle, Clock } from 'lucide-react';
import { getUmugandaCalendar } from '../../api/endpoints/umuganda';
import { useDateFormat, useDayFormat } from '../../i18n/dateLocale';
import useEnumLabel from '../../i18n/enums';
import { buildMonthGrid, bucketByDay, dayKey, kigaliDayKey, isUmugandaTouched } from '../../utils/umuganda';
import UmugandaMark from './UmugandaMark';
import { Skeleton } from '../ui';
import cn from '../ui/cn';

/**
 * The month calendar — the "calendar intelligence" surface.
 *
 * Four things must be distinguishable at a glance, and each gets its own
 * encoding rather than four colours the reader has to memorise:
 *
 *   sports event   a neutral count / row
 *   Umuganda       brand-green cell wash + the community mark
 *   rescheduled    a rotate icon, and the old date struck through in the panel
 *   conflict       a warning icon on the row
 *
 * A day is selectable; the panel underneath is the §5 "click an Umuganda date"
 * detail view, and doubles as the day view for ordinary match days.
 */

// Today, as Kigali reckons it. dayKey() would give the UTC day, which is the
// wrong day for the first two hours of every Rwandan morning.
const todayKey = () => kigaliDayKey(new Date());

const EventRow = ({ event }: { event: any }) => {
  const { t } = useTranslation();
  const fmt = useDateFormat();
  const enumLabel = useEnumLabel();

  const touched = isUmugandaTouched(event.status);
  const rescheduled = String(event.status).toUpperCase() === 'RESCHEDULED';
  const to = event.kind === 'AMASHURI' ? `/amashuri/matches/${event.id}` : `/matches/${event.id}`;

  return (
    <Link
      to={to}
      className={cn(
        'flex items-center gap-3 rounded-card border border-hairline bg-surface px-3 py-2.5',
        'transition-colors duration-150 ease-standard hover:border-brand/30'
      )}
    >
      <span className="w-12 shrink-0 font-display text-sm text-secondary">
        {event.matchDate ? fmt(event.matchDate, 'HH:mm') : t('common.tbd')}
      </span>

      <span className="min-w-0 flex-1 truncate text-sm text-primary">
        {event.homeTeam?.name || t('common.tbd')}
        <span className="mx-1.5 text-tertiary">v</span>
        {event.awayTeam?.name || t('common.tbd')}
      </span>

      {touched && (
        <span
          className={cn(
            'flex shrink-0 items-center gap-1 text-[11px] font-semibold uppercase tracking-wide',
            rescheduled ? 'text-brand-text' : 'text-secondary'
          )}
        >
          {rescheduled ? <RefreshCw size={11} aria-hidden="true" /> : <AlertTriangle size={11} aria-hidden="true" />}
          {enumLabel('match_status', event.status)}
        </span>
      )}
    </Link>
  );
};

const UmugandaCalendar = ({ className }: { className?: string }) => {
  const { t } = useTranslation();
  const fmt = useDateFormat();
  const fmtDay = useDayFormat();

  const now = new Date();
  const [cursor, setCursor] = useState({ year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 });
  const [selected, setSelected] = useState<string | null>(todayKey());

  const { data, isLoading } = useQuery({
    queryKey: ['umuganda', 'calendar', cursor.year, cursor.month],
    queryFn: () => getUmugandaCalendar(cursor.year, cursor.month),
    staleTime: 60_000,
  });

  const cells = useMemo(() => buildMonthGrid(cursor.year, cursor.month), [cursor]);
  // The `|| []` fallbacks live inside the memos on purpose: pulled out into a
  // const they build a fresh array on every render, so the memo below would see
  // a new dependency each time and never actually memoise. Keying on `data` —
  // which only changes when the query resolves — is what makes these stable.
  const eventsByDay = useMemo(() => bucketByDay(data?.data?.events || []), [data]);
  const umugandaByDay = useMemo(() => {
    const m = new Map<string, any>();
    for (const u of data?.data?.umugandaDays || []) {
      if (String(u.status).toUpperCase() === 'DISABLED') continue;
      m.set(u.dayKey || dayKey(u.date), u);
    }
    return m;
  }, [data]);

  const step = (delta: number) => {
    setCursor((c) => {
      let m = c.month + delta;
      let y = c.year;
      if (m < 1) { m = 12; y -= 1; }
      if (m > 12) { m = 1; y += 1; }
      return { year: y, month: m };
    });
  };

  // Calendar labels are days, not instants: formatting a UTC midnight in local
  // time shows the previous day west of Greenwich — and for the 1st of a month,
  // the previous month.
  const monthLabel = fmtDay(new Date(Date.UTC(cursor.year, cursor.month - 1, 1)), 'MMMM yyyy');
  // Weekday initials, Monday-first, from the active locale rather than hardcoded.
  const weekdays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => fmtDay(new Date(Date.UTC(2024, 0, 1 + i)), 'EEEEE')),
    [fmt]
  );

  const selectedUmuganda = selected ? umugandaByDay.get(selected) : null;
  const selectedEvents = selected ? eventsByDay.get(selected) || [] : [];

  return (
    <div className={cn('space-y-5', className)}>
      {/* ── Month header ── */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold text-primary sm:text-xl">{monthLabel}</h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => step(-1)}
            aria-label={t('umuganda.previousMonth')}
            className="flex h-10 w-10 items-center justify-center rounded-pill border border-hairline text-secondary transition-colors duration-150 ease-standard hover:border-brand/30 hover:text-primary"
          >
            <ChevronLeft size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setCursor({ year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 })}
            className="min-h-tap rounded-pill border border-hairline px-3 text-sm text-secondary transition-colors duration-150 ease-standard hover:border-brand/30 hover:text-primary"
          >
            {t('umuganda.thisMonth')}
          </button>
          <button
            type="button"
            onClick={() => step(1)}
            aria-label={t('umuganda.nextMonth')}
            className="flex h-10 w-10 items-center justify-center rounded-pill border border-hairline text-secondary transition-colors duration-150 ease-standard hover:border-brand/30 hover:text-primary"
          >
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* ── Legend (§5) ── */}
      <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-secondary">
        <li className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-pill bg-secondary" aria-hidden="true" />
          {t('umuganda.legendSports')}
        </li>
        <li className="flex items-center gap-1.5">
          <UmugandaMark size="dot" />
          {t('umuganda.legendUmuganda')}
        </li>
        <li className="flex items-center gap-1.5">
          <RefreshCw size={12} className="text-brand-text" aria-hidden="true" />
          {t('umuganda.legendRescheduled')}
        </li>
        <li className="flex items-center gap-1.5">
          <AlertTriangle size={12} className="text-secondary" aria-hidden="true" />
          {t('umuganda.legendConflict')}
        </li>
      </ul>

      {/* ── Grid ── */}
      {isLoading ? (
        <Skeleton className="h-80 w-full rounded-card" />
      ) : (
        <div className="overflow-hidden rounded-card border border-hairline bg-surface">
          <div className="grid grid-cols-7 border-b border-hairline">
            {weekdays.map((d, i) => (
              <div
                key={i}
                className="px-1 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-tertiary"
              >
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {cells.map((cell) => {
              const dayEvents = eventsByDay.get(cell.key) || [];
              const umuganda = umugandaByDay.get(cell.key);
              const isToday = cell.key === todayKey();
              const isSelected = cell.key === selected;
              const hasRescheduled = dayEvents.some((e: any) => String(e.status).toUpperCase() === 'RESCHEDULED');
              const hasConflict = dayEvents.some((e: any) => String(e.status).toUpperCase() === 'UMUGANDA_CONFLICT');

              return (
                <button
                  key={cell.key}
                  type="button"
                  onClick={() => setSelected(cell.key)}
                  aria-current={isToday ? 'date' : undefined}
                  aria-pressed={isSelected}
                  className={cn(
                    'relative min-h-[72px] border-b border-r border-hairline p-1.5 text-left align-top',
                    'transition-colors duration-150 ease-standard',
                    !cell.inMonth && 'opacity-40',
                    umuganda && 'bg-brand/[0.07]',
                    isSelected && 'ring-2 ring-inset ring-brand',
                    !isSelected && 'hover:bg-surface-2'
                  )}
                >
                  <span
                    className={cn(
                      'inline-flex h-6 w-6 items-center justify-center rounded-pill text-xs',
                      isToday ? 'bg-brand font-bold text-brand-on' : 'text-primary'
                    )}
                  >
                    {cell.date.getUTCDate()}
                  </span>

                  {umuganda && (
                    <span className="mt-1 block truncate text-[10px] font-semibold uppercase tracking-wide text-brand-text">
                      {t('umuganda.short')}
                    </span>
                  )}

                  <span className="absolute bottom-1.5 left-1.5 flex items-center gap-1">
                    {dayEvents.length > 0 && (
                      <span className="text-[10px] font-semibold text-secondary">
                        {dayEvents.length}
                      </span>
                    )}
                    {hasRescheduled && <RefreshCw size={10} className="text-brand-text" aria-hidden="true" />}
                    {hasConflict && <AlertTriangle size={10} className="text-secondary" aria-hidden="true" />}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Selected-day panel (§5) ── */}
      {selected && (
        <div className="rounded-card border border-hairline bg-surface p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-display text-base font-semibold text-primary">
              {fmtDay(new Date(selected + 'T00:00:00.000Z'), 'EEEE d MMMM yyyy')}
            </h3>
            {selectedUmuganda && <UmugandaMark size="sm" />}
          </div>

          {selectedUmuganda && (
            <div className="mt-3 rounded-card border border-brand/25 bg-brand/[0.06] p-3">
              <p className="text-sm font-semibold text-primary">
                {selectedUmuganda.title || t('umuganda.day')}
              </p>
              <p className="mt-1 text-sm text-secondary">
                {selectedUmuganda.description || t('umuganda.communityWorkDay')}
              </p>
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-tertiary">
                <Clock size={12} aria-hidden="true" />
                {selectedUmuganda.startTime}–{selectedUmuganda.endTime}
                <span className="mx-1" aria-hidden="true">·</span>
                {String(selectedUmuganda.status).toUpperCase() === 'EXPECTED'
                  ? t('umuganda.expectedDate')
                  : t('umuganda.confirmedDate')}
              </p>
            </div>
          )}

          <div className="mt-4 space-y-2">
            {selectedEvents.length === 0 ? (
              <p className="text-sm text-tertiary">{t('umuganda.noEventsThisDay')}</p>
            ) : (
              selectedEvents.map((e: any) => <EventRow key={`${e.kind}-${e.id}`} event={e} />)
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UmugandaCalendar;
