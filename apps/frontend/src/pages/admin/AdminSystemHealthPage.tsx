import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Database, Radio, Cloud, Activity, CheckCircle2, AlertCircle, Server, Cpu, Clock, Users2 } from 'lucide-react';
import apiClient from '../../api/client';
import { Skeleton } from '../../components/ui';

/**
 * Super Admin → System Health. Live status of core services + runtime metrics
 * from GET /admin/system-health (the DB check is a real round-trip). Auto-refreshes
 * every 15s so it reads as a live monitor, not a static snapshot.
 */
const SERVICE_ICON = { database: Database, api: Server, storage: Cloud, realtime: Radio };

const fmtUptime = (s = 0) => {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m ${s % 60}s`;
};

const AdminSystemHealthPage = () => {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({
    queryKey: ['admin-system-health'],
    queryFn: async () => (await apiClient.get('/admin/system-health')).data.data,
    refetchInterval: 15000,
  });

  const services = data?.services || [];
  const m = data?.metrics || {};
  const allOk = services.every((s) => s.ok);

  const metricCards = [
    { icon: Clock, label: t('admin.health.uptime'), value: fmtUptime(m.uptimeSec) },
    { icon: Cpu, label: t('admin.health.memory'), value: m.memoryMb != null ? `${m.memoryMb} MB` : '—' },
    { icon: Activity, label: t('admin.health.node'), value: m.node || '—' },
    { icon: Users2, label: t('admin.health.users'), value: m.users ?? '—' },
    { icon: Radio, label: t('admin.health.live_matches'), value: m.liveFixtures ?? 0 },
    { icon: Server, label: t('admin.health.environment'), value: m.env || '—' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="space-y-2">
        <h1 className="text-4xl font-display uppercase tracking-tighter">{t('admin.health.title')} <span className="text-red">{t('admin.health.title_accent')}</span></h1>
        <p className="text-[10px] uppercase font-bold tracking-[0.4em] opacity-40">{t('admin.health.subtitle')}</p>
      </div>

      {isLoading ? (
        <Skeleton type="card" count={2} />
      ) : (
        <>
          <div className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold uppercase tracking-wider ${allOk ? 'bg-brand/10 text-brand-text' : 'bg-red/10 text-red'}`}>
            {allOk ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            {allOk ? t('admin.health.all_operational') : t('admin.health.degraded')}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {services.map((s) => {
              const Icon = SERVICE_ICON[s.key] || Activity;
              return (
                <div key={s.key} className="flex items-center gap-3 rounded-2xl border border-hairline bg-surface p-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-tertiary"><Icon size={18} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-primary">{t(`admin.health.svc_${s.key}`, s.key)}</p>
                    <p className="text-[11px] text-tertiary">{s.detail}</p>
                  </div>
                  {s.ok ? <CheckCircle2 size={18} className="shrink-0 text-brand" /> : <AlertCircle size={18} className="shrink-0 text-red" />}
                </div>
              );
            })}
          </div>

          <div>
            <h2 className="mb-3 font-display text-lg uppercase tracking-tight text-primary">{t('admin.health.runtime')}</h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
              {metricCards.map((c) => (
                <div key={c.label} className="rounded-2xl border border-hairline bg-surface p-4">
                  <c.icon size={16} className="mb-2 text-brand" />
                  <p className="font-display text-lg font-bold tabular-nums text-primary">{c.value}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-tertiary">{c.label}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminSystemHealthPage;
