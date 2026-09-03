import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Radio, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { getMyReporterProfile } from '../../api/endpoints/reporter';
import useReporterFixtures from '../../hooks/useReporterFixtures';
import { timeUntil } from '../../lib/reporterMatch';
import cn from '../ui/cn';

/**
 * The two things a reporter checks without meaning to.
 *
 * The admin sidebar ends in a panel that answers the question its role holds in
 * the back of its mind — the season for a federation admin, platform health for
 * the Ministry. A reporter's equivalent is "am I marked free, and where am I
 * next?", and until now the reporter rail simply ended.
 *
 * It is a component rather than a branch inside Sidebar because it needs two
 * queries, and hooks cannot be called conditionally. Both are already in flight
 * elsewhere in the portal, so react-query serves this from cache rather than
 * spending a second request on a district ground's 3G.
 */

const AVAILABILITY_TONE: Record<string, string> = {
  AVAILABLE: 'bg-brand-tint text-brand-text',
  BUSY: 'bg-live/10 text-live',
  UNAVAILABLE: 'bg-surface-3 text-tertiary',
};

const AVAILABILITY_LABEL: Record<string, string> = {
  AVAILABLE: 'Available',
  BUSY: 'Busy',
  UNAVAILABLE: 'Unavailable',
};

const ReporterSidebarFooter = ({ onNavigate }: { onNavigate?: () => void }) => {
  const { t } = useTranslation();
  const { data: profile } = useQuery({
    queryKey: ['reporter-me'],
    queryFn: getMyReporterProfile,
    staleTime: 5 * 60 * 1000,
  });
  const { live, scheduled } = useReporterFixtures();

  // A match under way outranks the next kick-off: it is the thing the reporter
  // is meant to be doing right now, and one tap should get them back to it.
  const next = live[0] || scheduled[0] || null;
  const availability = profile?.availability || 'AVAILABLE';

  return (
    <div className="space-y-3 border-t border-hairline p-4">
      <Link
        to="/reporter/profile"
        onClick={onNavigate}
        className="flex items-center justify-between gap-2"
      >
        <span className="text-[11px] font-semibold uppercase tracking-wide text-tertiary">
          {t('portal.reporter_availability')}
        </span>
        <span
          className={cn(
            'rounded-pill px-2 py-0.5 text-xs font-semibold',
            AVAILABILITY_TONE[availability] || AVAILABILITY_TONE.UNAVAILABLE
          )}
        >
          {AVAILABILITY_LABEL[availability] || availability}
        </span>
      </Link>

      <div className="rounded-card border border-hairline bg-surface-2 p-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-tertiary">
          {t('portal.reporter_next_match')}
        </p>
        {next ? (
          <Link
            to={`/reporter/match/${next.id}`}
            onClick={onNavigate}
            className="group mt-1 flex items-start gap-2"
          >
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-primary">
                {next.homeTeam?.shortName || next.homeTeam?.name} v{' '}
                {next.awayTeam?.shortName || next.awayTeam?.name}
              </span>
              <span className="mt-0.5 block truncate text-xs tabular-nums text-tertiary">
                {next.status === 'LIVE' ? (
                  <span className="inline-flex items-center gap-1 font-semibold text-live">
                    <Radio size={11} aria-hidden="true" /> Live now
                  </span>
                ) : next.matchDate ? (
                  `${format(new Date(next.matchDate), 'EEE d MMM, HH:mm')} · ${timeUntil(next.matchDate)}`
                ) : (
                  'Date to be confirmed'
                )}
              </span>
            </span>
            <ChevronRight
              size={14}
              className="mt-0.5 shrink-0 text-tertiary transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        ) : (
          <p className="mt-1 text-sm text-tertiary">{t('portal.reporter_no_next')}</p>
        )}
      </div>
    </div>
  );
};

export default ReporterSidebarFooter;
