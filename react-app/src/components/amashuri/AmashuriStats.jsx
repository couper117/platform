import React from 'react';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { School, Layers } from 'lucide-react';
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
  const theme = useTheme();
  const grid = theme?.dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const axis = theme?.dark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';

  if (!schools.length && !championships.length) {
    return <EmptyState icon={Layers} title="No statistics yet" hint="Insights appear as schools and championships are added." />;
  }

  const catCount = schools.reduce((acc, s) => {