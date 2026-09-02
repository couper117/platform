import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Database, Radio, Cloud, Activity, CheckCircle2, AlertCircle, Server, Cpu, Clock, Users2 } from 'lucide-react';
import apiClient from '../../api/client';
import { PageHeader, StatCard, Panel } from '../../components/admin/AdminUI';
import { Skeleton, SkeletonList, cn } from '../../components/ui';

/**
 * Super Admin → System Health. Live status of core services + runtime metrics
 * from GET /admin/system-health (the DB check is a real round-trip). Auto-refreshes
 * every 15s so it reads as a live monitor, not a static snapshot.
 *
 * This is the full version of the dashboard's Platform health panel and shares its
 * vocabulary: the same service list, the same one-line verdict, and the runtime
 * figures on the kit's stat card so they line up with every other number in the
 * portal.
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

  // A version string and an environment name are words, not figures — they take a
  // smaller size than a count so a long one still fits its card.
  const word = (v: React.ReactNode) => <span className="text-xl">{v}</span>;

  const metricCards = [
    { icon: Clock, label: t('admin.health.uptime'), value: fmtUptime(m.uptimeSec) },
    { icon: Cpu, label: t('admin.health.memory'), value: m.memoryMb != null ? `${m.memoryMb} MB` : '—' },
    { icon: Activity, label: t('admin.health.node'), value: word(m.node || '—') },
    { icon: Users2, label: t('admin.health.users'), value: m.users ?? '—' },
    { icon: Radio, label: t('admin.health.live_matches'), value: m.liveFixtures ?? 0 },
    { icon: Server, label: t('admin.health.environment'), value: word(m.env || '—') },
  ];

  return (
    <div>
      <PageHeader title={`${t('admin.health.title')} ${t('admin.health.title_accent')}`} subtitle={t('admin.health.subtitle')} />

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <SkeletonList count={4} className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-card border border-hairline bg-surface p-4">
              <Skeleton className="h-10 w-10" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          </SkeletonList>
        </div>
      ) : (
        <div className="space-y-4">
          <p
            className={cn(
              'flex items-center justify-center gap-2 rounded-control py-2.5 text-sm font-semibold',
              allOk ? 'bg-brand-tint text-brand-text' : 'bg-danger/10 text-danger-text'
            )}
          >
            {allOk ? <CheckCircle2 size={16} aria-hidden="true" /> : <AlertCircle size={16} aria-hidden="true" />}
            {allOk ? t('admin.health.all_operational') : t('admin.health.degraded')}
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            {services.map((s) => {
              const Icon = SERVICE_ICON[s.key] || Activity;
              return (
                <div key={s.key} className="flex items-center gap-3 rounded-card border border-hairline bg-surface p-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-surface-2 text-tertiary">
                    <Icon size={18} aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-primary">{String(t(`admin.health.svc_${s.key}`, s.key))}</p>
                    {/* The real detail — "3 ms", "SSE active" — not the word
                        "Operational" repeated four times. */}
                    <p className="truncate text-xs tabular-nums text-tertiary">{s.detail}</p>
                  </div>
                  {s.ok
                    ? <CheckCircle2 size={18} className="shrink-0 text-brand" aria-hidden="true" />
                    : <AlertCircle size={18} className="shrink-0 text-danger-text" aria-hidden="true" />}
                </div>
              );
            })}
          </div>

          <Panel title={t('admin.health.runtime')}>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
              {metricCards.map((c) => (
                <StatCard key={String(c.label)} icon={c.icon} value={c.value} label={c.label} />
              ))}
            </div>
          </Panel>
        </div>
      )}
    </div>
  );
};

export default AdminSystemHealthPage;
