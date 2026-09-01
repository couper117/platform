import React from 'react';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { School, Layers } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useEnumLabel } from '../../i18n/enums';
import EmptyState from '../ui/EmptyState';

/**
 * Chart colours resolve design tokens at paint time (`rgb(var(--token))`), so
 * they track the light/dark swap in tokens.css for free — no separate dark
 * branch, no `useTheme()` needed. There is no dedicated categorical chart
 * palette in tokens.css, so the four category slots reuse existing semantic
 * tokens in a fixed order (never cycled) rather than introducing new hex —
 * brand green is never one of them, since a chart series must never be
 * mistaken for the brand accent.
 */
const CATEGORY_COLOR: Record<string, string> = {
  PRIMARY: 'rgb(var(--brand))',
  SECONDARY: 'rgb(var(--live))',
  TVET: 'rgb(var(--danger))',
  OTHER: 'rgb(var(--text-3))',
};
const SERIES_COLOR = 'rgb(var(--brand))';
const GRID_COLOR = 'rgb(var(--hairline))';
const AXIS_COLOR = 'rgb(var(--text-3))';

const ChartCard = ({ icon: Icon, title, subtitle, children }: { icon: any; title?: React.ReactNode; subtitle?: React.ReactNode; children?: React.ReactNode }) => (
  <div className="rounded-card border border-hairline bg-surface p-4 sm:p-5">
    <div className="mb-4 flex items-center gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-surface-2 text-tertiary">
        <Icon size={16} aria-hidden="true" />
      </span>
      <div>
        <h3 className="font-display text-base font-semibold leading-none text-primary">{title}</h3>
        {subtitle && <p className="mt-1 text-xs text-tertiary">{subtitle}</p>}
      </div>
    </div>
    {children}
  </div>
);

const ChartTooltip = ({ active, payload, label }: { active?: boolean; payload?: any[]; label?: any }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-control border border-hairline bg-surface px-3 py-2 shadow-sm">
      {label && <p className="text-xs font-semibold text-primary">{label}</p>}
      {payload.map((p) => (
        <p key={p.name} className="text-xs tabular-nums text-secondary">
          {p.name}: <span className="font-semibold text-primary">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

/** Visual insights for Amashuri Games: schools by category + championships by status. */
const AmashuriStats = ({ schools = [], championships = [] }: { schools?: any[]; championships?: any[] }) => {
  const { t } = useTranslation();
  const enumLabel = useEnumLabel();

  if (!schools.length && !championships.length) {
    return <EmptyState icon={Layers} title={t('stats.none')} hint={t('amashuri.stats_none_hint')} />;
  }

  const catCount = schools.reduce((acc: Record<string, number>, s: any) => {
    const k = s.category || 'OTHER';
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});
  const categoryData = Object.entries(catCount).map(([raw, value]) => ({
    raw,
    name: enumLabel('school_category', raw),
    value,
  }));

  const statusCount = championships.reduce((acc: Record<string, number>, c: any) => {
    const k = c.status || 'UPCOMING';
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});
  const statusData = Object.entries(statusCount).map(([raw, count]) => ({
    raw,
    name: enumLabel('championship_status', raw),
    count,
  }));

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {categoryData.length > 0 && (
        <ChartCard icon={School} title={t('amashuri.schools_by_category')} subtitle={t('amashuri.category_subtitle')}>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3}>
                {categoryData.map((entry) => (
                  <Cell key={entry.raw} fill={CATEGORY_COLOR[entry.raw] || CATEGORY_COLOR.OTHER} stroke="none" />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
              <Legend
                verticalAlign="bottom"
                iconType="circle"
                formatter={(v) => <span className="text-xs text-secondary">{v}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {statusData.length > 0 && (
        <ChartCard icon={Layers} title={t('amashuri.championships')} subtitle={t('amashuri.by_status')}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={statusData} margin={{ left: 0, right: 8, top: 8 }}>
              <CartesianGrid vertical={false} stroke={GRID_COLOR} />
              <XAxis dataKey="name" tick={{ fill: AXIS_COLOR, fontSize: 11, fontWeight: 600 }} tickLine={false} axisLine={{ stroke: GRID_COLOR }} />
              <YAxis allowDecimals={false} tick={{ fill: AXIS_COLOR, fontSize: 11, fontWeight: 600 }} tickLine={false} axisLine={{ stroke: GRID_COLOR }} width={28} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgb(var(--brand-tint))' }} />
              <Bar dataKey="count" name={t('amashuri.championships')} fill={SERIES_COLOR} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
    </div>
  );
};

export default AmashuriStats;
