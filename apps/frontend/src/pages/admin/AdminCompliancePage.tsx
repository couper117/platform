import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, AlertTriangle, CircleAlert, CheckCircle2, ExternalLink } from 'lucide-react';
import apiClient from '../../api/client';
import { PageHeader } from '../../components/admin/AdminUI';
import { Badge, ErrorState, Skeleton, SkeletonList, cn } from '../../components/ui';

/**
 * Super Admin → Data Protection.
 *
 * What the platform owes under Law N° 058/2021, as a live reading rather than a
 * document. docs/DATA_PROTECTION.md §6 lists the same obligations in prose, and a
 * document nobody opens is a document nobody acts on — a consent backlog and an
 * overdue data-subject request are facts that change on their own, and they
 * belong where an administrator will see them.
 *
 * The items that need a person — registering with the regulator, appointing a
 * DPO, signing processor contracts — are reported as configuration rather than
 * dressed up as progress. A checklist that implies work nobody has done is worse
 * than no checklist.
 *
 * The tint on each card is the status, so the page can be read at arm's length:
 * brand for satisfied, live amber for needs action, danger for not lawful. It is
 * never colour alone — every card also carries an icon and a named state.
 */
const TONE = {
  ok:      { icon: CheckCircle2,  ring: 'border-brand/40 bg-brand-tint',  text: 'text-brand-text',  pill: 'bg-brand-tint text-brand-text',   label: 'Satisfied' },
  action:  { icon: AlertTriangle, ring: 'border-live/40 bg-live/5',       text: 'text-live',        pill: 'bg-live/10 text-live',            label: 'Needs action' },
  blocked: { icon: CircleAlert,   ring: 'border-danger/40 bg-danger/5',   text: 'text-danger-text', pill: 'bg-danger/10 text-danger-text',   label: 'Not lawful as configured' },
};

const AdminCompliancePage = () => {
  const { t } = useTranslation();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['compliance'],
    queryFn: async () => (await apiClient.get('/privacy/compliance')).data.data,
    refetchInterval: 5 * 60 * 1000,
  });

  const overall = data?.overall || 'ok';
  const Head = TONE[overall] || TONE.ok;

  return (
    <div>
      <PageHeader
        title={`${t('admin.compliance.title', 'Data')} ${t('admin.compliance.title_accent', 'Protection')}`}
        subtitle={t('admin.compliance.subtitle', 'Law N° 058/2021 of 13/10/2021 — obligations and standing')}
      />

      {isLoading ? (
        <SkeletonList count={4} className="grid gap-3">
          <div className="rounded-card border border-hairline bg-surface p-4">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="mt-2 h-3 w-full max-w-md" />
          </div>
        </SkeletonList>
      ) : isError ? (
        <div className="rounded-card border border-hairline bg-surface">
          <ErrorState title={t('admin.users.load_error', 'Could not load')} />
        </div>
      ) : (
        <div className="space-y-4">
          <div className={cn('flex items-start gap-3 rounded-card border p-4', Head.ring)}>
            <Head.icon size={20} className={cn('mt-0.5 shrink-0', Head.text)} aria-hidden="true" />
            <div className="min-w-0">
              <p className={cn('text-base font-semibold', Head.text)}>{Head.label}</p>
              <p className="mt-0.5 text-sm text-secondary tabular-nums">
                {data.counts.ok || 0} satisfied · {data.counts.action || 0} need action
                {data.counts.blocked ? ` · ${data.counts.blocked} not lawful as configured` : ''}
              </p>
            </div>
          </div>

          <div className="grid gap-3">
            {data.items.map((item: any) => {
              const tone = TONE[item.status] || TONE.ok;
              const Icon = tone.icon;
              return (
                <div key={item.key} className={cn('rounded-card border p-4', tone.ring)}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <Icon size={18} className={cn('mt-0.5 shrink-0', tone.text)} aria-hidden="true" />
                      <div className="min-w-0">
                        <h2 className="font-display text-base font-semibold text-primary">{item.title}</h2>
                        <p className="mt-0.5 text-sm text-secondary">{item.summary}</p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className={cn('rounded-pill px-2 py-0.5 text-xs font-semibold', tone.pill)}>
                        {tone.label}
                      </span>
                      <Badge>{item.article}</Badge>
                    </div>
                  </div>

                  {item.notes?.length > 0 && (
                    <ul className="mt-3 space-y-1 border-t border-hairline pt-3">
                      {item.notes.map((n: string) => (
                        <li key={n} className="text-xs text-tertiary">{n}</li>
                      ))}
                    </ul>
                  )}

                  {item.detail && Object.keys(item.detail).length > 0 && (
                    <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 border-t border-hairline pt-3">
                      {Object.entries(item.detail)
                        .filter(([, v]) => typeof v !== 'object')
                        .map(([k, v]) => (
                          <div key={k} className="flex items-baseline gap-1.5">
                            <dt className="text-xs capitalize text-tertiary">
                              {k.replace(/([A-Z])/g, ' $1')}
                            </dt>
                            <dd className="text-sm font-semibold tabular-nums text-primary">{String(v ?? '—')}</dd>
                          </div>
                        ))}
                    </dl>
                  )}
                </div>
              );
            })}
          </div>

          <p className="flex items-start gap-2 rounded-card border border-hairline bg-surface-2 p-4 text-xs text-tertiary">
            <ShieldCheck size={15} className="mt-0.5 shrink-0 text-brand-text" aria-hidden="true" />
            <span>
              {t('admin.compliance.note',
                'Counted from the data, not copied from a document — a consent backlog or an overdue request changes on its own. The obligations that need a person are in docs/DATA_PROTECTION.md §6, with the filing checklists beside it.')}
              {' '}
              <a href="https://www.risa.gov.rw/data-protection-and-privacy-law" target="_blank" rel="noreferrer"
                 className="inline-flex items-center gap-0.5 font-semibold text-brand-text">
                RISA <ExternalLink size={11} aria-hidden="true" />
              </a>
            </span>
          </p>
        </div>
      )}
    </div>
  );
};

export default AdminCompliancePage;
