import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, AlertTriangle, CircleAlert, CheckCircle2, ExternalLink } from 'lucide-react';
import apiClient from '../../api/client';
import { Skeleton } from '../../components/ui';

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
 */
const TONE = {
  ok:      { icon: CheckCircle2,  ring: 'border-brand/40 bg-brand/5',   text: 'text-brand-text', label: 'Satisfied' },
  action:  { icon: AlertTriangle, ring: 'border-gold/50 bg-gold/5',     text: 'text-gold',       label: 'Needs action' },
  blocked: { icon: CircleAlert,   ring: 'border-danger/50 bg-danger/5', text: 'text-danger-text',label: 'Not lawful as configured' },
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
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="space-y-2">
        <h1 className="text-4xl font-display uppercase tracking-tighter">
          {t('admin.compliance.title', 'Data')} <span className="text-red">{t('admin.compliance.title_accent', 'Protection')}</span>
        </h1>
        <p className="text-[10px] uppercase font-bold tracking-[0.4em] opacity-40">
          {t('admin.compliance.subtitle', 'Law N° 058/2021 of 13/10/2021 — obligations and standing')}
        </p>
      </div>

      {isLoading ? (
        <Skeleton type="card" count={4} />
      ) : isError ? (
        <div className="py-16 text-center opacity-50 font-display uppercase tracking-widest">
          {t('admin.users.load_error', 'Could not load')}
        </div>
      ) : (
        <>
          <div className={`flex items-start gap-3 rounded-2xl border p-5 ${Head.ring}`}>
            <Head.icon size={22} className={`mt-0.5 shrink-0 ${Head.text}`} />
            <div>
              <p className={`font-display text-xl uppercase tracking-tight ${Head.text}`}>{Head.label}</p>
              <p className="mt-1 text-sm text-secondary">
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
                <div key={item.key} className={`rounded-2xl border p-5 ${tone.ring}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <Icon size={18} className={`mt-0.5 shrink-0 ${tone.text}`} />
                      <div className="min-w-0">
                        <h2 className="font-semibold text-primary">{item.title}</h2>
                        <p className="mt-0.5 text-sm text-secondary">{item.summary}</p>
                      </div>
                    </div>
                    <span className="shrink-0 rounded-full border border-hairline px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-tertiary">
                      {item.article}
                    </span>
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
                            <dt className="text-[10px] font-bold uppercase tracking-wider text-tertiary">
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

          <p className="flex items-start gap-2 rounded-xl bg-surface-2 p-4 text-xs text-tertiary">
            <ShieldCheck size={15} className="mt-0.5 shrink-0 text-brand" />
            <span>
              {t('admin.compliance.note',
                'Counted from the data, not copied from a document — a consent backlog or an overdue request changes on its own. The obligations that need a person are in docs/DATA_PROTECTION.md §6, with the filing checklists beside it.')}
              {' '}
              <a href="https://www.risa.gov.rw/data-protection-and-privacy-law" target="_blank" rel="noreferrer"
                 className="inline-flex items-center gap-0.5 font-semibold text-brand-text">
                RISA <ExternalLink size={11} />
              </a>
            </span>
          </p>
        </>
      )}
    </div>
  );
};

export default AdminCompliancePage;
