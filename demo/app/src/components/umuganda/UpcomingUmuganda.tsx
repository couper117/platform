import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Clock, RefreshCw } from 'lucide-react';
import { getUmugandaDays } from '../../api/endpoints/umuganda';
import { useDateFormat } from '../../i18n/dateLocale';
import UmugandaMark from './UmugandaMark';
import cn from '../ui/cn';

/**
 * "Upcoming Umuganda" — the home-page presence for the feature.
 *
 * Deliberately quiet: one row, the date, and the two counts that actually
 * matter to a fan (how many matches are touched, how many already moved). It
 * renders nothing when no Umuganda date is known, rather than showing an empty
 * shell on the busiest page in the product.
 */
const UpcomingUmuganda = ({ className }: { className?: string }) => {
  const { t } = useTranslation();
  const fmt = useDateFormat();

  const { data, isLoading } = useQuery({
    queryKey: ['umuganda', 'upcoming'],
    queryFn: () => getUmugandaDays({ months: 3 }),
    staleTime: 5 * 60_000,
  });

  const next = data?.data?.next;
  if (isLoading || !next) return null;

  const affected = next.affectedCount || 0;
  const rescheduled = next.rescheduledCount || 0;

  return (
    <section
      className={cn(
        'rounded-card border border-brand/25 bg-brand/[0.06] p-5 sm:p-6',
        className
      )}
      aria-labelledby="umuganda-upcoming-heading"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <UmugandaMark size="md" label={t('umuganda.upcoming')} />

          <h2
            id="umuganda-upcoming-heading"
            className="mt-3 font-display text-xl font-semibold text-primary sm:text-2xl"
          >
            {fmt(next.date, 'EEEE d MMMM')}
          </h2>

          <p className="mt-1 text-sm text-secondary">
            {next.description || t('umuganda.communityWorkDay')}
          </p>

          <p className="mt-1 flex items-center gap-1.5 text-xs text-tertiary">
            <Clock size={12} aria-hidden="true" />
            {next.startTime}–{next.endTime}
            {/* An EXPECTED date is the calculation talking; a CONFIRMED one is
                an administrator's word. Saying which is the honest thing. */}
            <span className="mx-1 text-hairline" aria-hidden="true">·</span>
            {String(next.status).toUpperCase() === 'EXPECTED'
              ? t('umuganda.expectedDate')
              : t('umuganda.confirmedDate')}
          </p>
        </div>

        {(affected > 0 || rescheduled > 0) && (
          <dl className="flex gap-6">
            <div>
              <dt className="text-xs uppercase tracking-wide text-tertiary">
                {t('umuganda.sportsAffected')}
              </dt>
              <dd className="mt-0.5 font-display text-2xl font-semibold text-primary">
                {affected}
              </dd>
            </div>
            <div>
              <dt className="flex items-center gap-1 text-xs uppercase tracking-wide text-tertiary">
                <RefreshCw size={11} aria-hidden="true" />
                {t('umuganda.rescheduled')}
              </dt>
              <dd className="mt-0.5 font-display text-2xl font-semibold text-primary">
                {rescheduled}
              </dd>
            </div>
          </dl>
        )}
      </div>

      <Link
        to="/calendar"
        className={cn(
          'mt-4 inline-flex min-h-tap items-center gap-1.5 rounded-pill border border-brand/30',
          'px-4 text-sm font-semibold text-brand-text transition-colors duration-150 ease-standard',
          'hover:bg-brand hover:text-brand-on'
        )}
      >
        {t('umuganda.viewCalendar')}
        <ArrowRight size={14} aria-hidden="true" />
      </Link>
    </section>
  );
};

export default UpcomingUmuganda;
