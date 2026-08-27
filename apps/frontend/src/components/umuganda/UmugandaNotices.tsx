import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { RefreshCw, Clock, Megaphone, AlertTriangle, Check } from 'lucide-react';
import { getUmugandaNotices } from '../../api/endpoints/umuganda';
import { useDateFormat } from '../../i18n/dateLocale';
import UmugandaMark from './UmugandaMark';
import { SectionHeading } from '../ui';
import cn from '../ui/cn';

/**
 * Public Umuganda notices — what changed, why, and what it changed from.
 *
 * Rendered on the home page, the match page and the calendar. Each notice
 * carries its own before/after snapshot from the server, so it keeps reading
 * correctly even after the fixture is edited again later.
 */

const KIND_ICON: Record<string, any> = {
  CONTINUE: Check,
  RESCHEDULED: RefreshCw,
  AFTER_UMUGANDA: Clock,
  AFFECTED: AlertTriangle,
  GENERAL: Megaphone,
};

/**
 * The server stores an English sentence in `body` so the notice still reads
 * correctly anywhere it is exported or emailed. On screen we prefer the
 * translated form, because a Kinyarwanda page showing one English paragraph is
 * worse than no paragraph at all.
 *
 * GENERAL is absent on purpose — that is an administrator's own words, and
 * there is nothing to translate it to.
 */
const KIND_BODY: Record<string, string> = {
  CONTINUE: 'continue',
  RESCHEDULED: 'move',
  AFTER_UMUGANDA: 'after',
  AFFECTED: 'affected',
};

export const NoticeRow = ({ notice, compact = false }: { notice: any; compact?: boolean }) => {
  const { t } = useTranslation();
  const fmt = useDateFormat();
  const kind = String(notice?.kind).toUpperCase();
  const Icon = KIND_ICON[kind] || Megaphone;
  const bodyKey = KIND_BODY[kind];
  const body = bodyKey ? t(`umuganda.banner.${bodyKey}`) : notice?.body;

  const original = notice?.originalDate;
  const next = notice?.newDate;

  return (
    <div
      className={cn(
        'flex gap-3 rounded-card border border-hairline bg-surface p-4',
        compact && 'p-3'
      )}
    >
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-pill bg-brand/10 text-brand-text">
        <Icon size={15} aria-hidden="true" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <UmugandaMark size="sm" label={t('umuganda.notice')} />
          <p className="truncate text-sm font-semibold text-primary">{notice?.title}</p>
        </div>

        <p className="mt-1 text-sm text-secondary">{body}</p>

        {(original || next) && (
          <dl className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
            {original && (
              <div className="flex items-center gap-1.5">
                <dt className="text-tertiary">{t('umuganda.originally')}</dt>
                {/* Struck through because the whole point of the row is that
                    this date no longer holds. */}
                <dd className="text-tertiary line-through">{fmt(original, 'EEE d MMM, HH:mm')}</dd>
              </div>
            )}
            {next && (
              <div className="flex items-center gap-1.5">
                <dt className="text-tertiary">{t('umuganda.newDate')}</dt>
                <dd className="font-semibold text-primary">{fmt(next, 'EEE d MMM, HH:mm')}</dd>
              </div>
            )}
          </dl>
        )}

        {notice?.reason && (
          <p className="mt-1.5 text-xs text-tertiary">
            {t('umuganda.reason')}: {notice.reason}
          </p>
        )}
      </div>
    </div>
  );
};

/**
 * The notices feed. Renders nothing at all when there is nothing to say —
 * an empty "no notices" panel on the home page would be pure noise.
 *
 * `heading` is rendered here rather than by the caller on purpose: a heading
 * placed outside this component survives the early return and leaves a title
 * standing over nothing.
 */
const UmugandaNotices = ({
  limit = 5,
  heading,
  className,
}: {
  limit?: number;
  heading?: string;
  className?: string;
}) => {
  const { data, isLoading } = useQuery({
    queryKey: ['umuganda', 'notices', limit],
    queryFn: () => getUmugandaNotices(limit),
    staleTime: 60_000,
  });

  const notices = data?.data || [];
  if (isLoading || !notices.length) return null;

  return (
    <section className={cn('space-y-3', className)}>
      {heading && <SectionHeading title={heading} />}
      {notices.map((n: any) => (
        <NoticeRow key={n.id} notice={n} />
      ))}
    </section>
  );
};

export default UmugandaNotices;
