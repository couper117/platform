import React from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshCw, Clock, AlertTriangle, Check } from 'lucide-react';
import { useDateFormat } from '../../i18n/dateLocale';
import { isUmugandaTouched } from '../../utils/umuganda';
import UmugandaMark from './UmugandaMark';
import cn from '../ui/cn';

/**
 * Per-match Umuganda banner (§4, §13): what changed, why, and from what.
 *
 * Renders nothing unless Umuganda actually touched this fixture — a match that
 * merely happens to fall in a month with an Umuganda in it says nothing here.
 */

const DECISION_META: Record<string, { icon: any; key: string }> = {
  CONTINUE: { icon: Check, key: 'continue' },
  MOVED: { icon: RefreshCw, key: 'move' },
  AFTER_UMUGANDA: { icon: Clock, key: 'after' },
  AFFECTED: { icon: AlertTriangle, key: 'affected' },
};

const MatchUmugandaBanner = ({ fixture, className }: { fixture: any; className?: string }) => {
  const { t } = useTranslation();
  const fmt = useDateFormat();

  if (!fixture) return null;

  const decision = String(fixture.umugandaDecision || '').toUpperCase();
  const touched = isUmugandaTouched(fixture.status) || !!decision;
  if (!touched) return null;

  const meta = DECISION_META[decision] || DECISION_META.AFFECTED;
  const Icon = meta.icon;
  const moved = !!fixture.originalMatchDate && fixture.originalMatchDate !== fixture.matchDate;

  return (
    <aside
      className={cn(
        'flex gap-3 rounded-card border border-brand/25 bg-brand/[0.06] p-4',
        className
      )}
      aria-label={t('umuganda.notice')}
    >
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-pill bg-brand/10 text-brand-text">
        <Icon size={16} aria-hidden="true" />
      </span>

      <div className="min-w-0 flex-1">
        <UmugandaMark size="sm" label={t('umuganda.notice')} />

        <p className="mt-2 text-sm font-semibold text-primary">
          {t(`umuganda.banner.${meta.key}`)}
        </p>

        {moved && (
          <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            <span className="text-tertiary line-through">
              {fmt(fixture.originalMatchDate, 'EEE d MMM, HH:mm')}
            </span>
            <span className="text-tertiary" aria-hidden="true">→</span>
            <span className="font-semibold text-primary">
              {fmt(fixture.matchDate, 'EEE d MMM, HH:mm')}
            </span>
          </p>
        )}

        {fixture.rescheduleReason && (
          <p className="mt-1.5 text-xs text-secondary">
            {t('umuganda.reason')}: {fixture.rescheduleReason}
          </p>
        )}
      </div>
    </aside>
  );
};

export default MatchUmugandaBanner;
