import React from 'react';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { School, Layers } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useEnumLabel } from '../../i18n/enums';
import { useTheme } from '../../context/ThemeContext';
import Card from '../ui/Card';
import EmptyState from '../ui/EmptyState';

const BLUE = '#00A1DE';
const YELLOW = '#FAD201';
const GREEN = '#20603D';

const ChartCard = ({ icon: Icon, title, subtitle, children }) => (
  <Card className="p-5 sm:p-6">
    <div className="flex items-center gap-3 mb-5">
      <span className="w-9 h-9 rounded-xl bg-rwanda-blue/10 text-rwanda-blue flex items-center justify-center">
        <Icon size={18} />
      </span>
      <div>
        <h3 className="font-display text-lg uppercase tracking-tight leading-none">{title}</h3>
        {subtitle && <p className="text-[10px] uppercase tracking-widest opacity-40 mt-1">{subtitle}</p>}
      </div>
    </div>
    {children}
  </Card>
);

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-surface-3 dark:border-white/10 bg-white dark:bg-surface-dark2 px-3 py-2 shadow-xl">
      {label && <p className="text-[10px] font-bold uppercase tracking-widest text-surface-dark dark:text-white">{label}</p>}
      {payload.map((p) => (
        <p key={p.name} className="text-xs tabular-nums" style={{ color: p.color || p.payload?.fill }}>
          {p.name}: <span className="font-bold">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

/**
 * Visual insights for Amashuri Games: schools by category + championships by status.
 */
const AmashuriStats = ({ schools = [], championships = [] }) => {
  const { t } = useTranslation();
  const enumLabel = useEnumLabel();
  const theme = useTheme();
  const grid = theme?.dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const axis = theme?.dark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';

  if (!schools.length && !championships.length) {
    return <EmptyState icon={Layers} title={t('stats.none')} hint={t('amashuri.stats_none_hint')} />;
  }

  const catCount = schools.reduce((acc, s) => {
    const k = s.category || 'OTHER';
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});
  const categoryData = Object.entries(catCount).map(([raw, value]) => ({
    raw,
    name: enumLabel('school_category', raw),
    value,
  }));
  const catColors = { PRIMARY: GREEN, SECONDARY: BLUE, TVET: YELLOW, OTHER: '#94A3B8' };

  const statusCount = championships.reduce((acc, c) => {
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {categoryData.length > 0 && (
        <ChartCard icon={School} title={t('amashuri.schools_by_category')} subtitle={t('amashuri.category_subtitle')}>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3}>
                {categoryData.map((entry) => (
                  <Cell key={entry.raw} fill={catColors[entry.raw] || catColors.OTHER} stroke="none" />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
              <Legend
                verticalAlign="bottom"
                iconType="circle"
                formatter={(v) => <span className="text-[10px] uppercase tracking-widest opacity-60">{v}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {statusData.length > 0 && (
        <ChartCard icon={Layers} title={t('amashuri.championships')} subtitle={t('amashuri.by_status')}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={statusData} margin={{ left: 0, right: 8, top: 8 }}>
              <CartesianGrid vertical={false} stroke={grid} />
              <XAxis dataKey="name" tick={{ fill: axis, fontSize: 10, fontWeight: 700 }} tickLine={false} axisLine={{ stroke: grid }} />
              <YAxis allowDecimals={false} tick={{ fill: axis, fontSize: 10, fontWeight: 700 }} tickLine={false} axisLine={{ stroke: grid }} width={28} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(0,161,222,0.06)' }} />
              <Bar dataKey="count" name={t('amashuri.championships')} fill={BLUE} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
    </div>
  );
};

export default AmashuriStats;
