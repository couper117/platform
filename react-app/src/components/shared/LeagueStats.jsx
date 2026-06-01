import React from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell,
  CartesianGrid, LabelList,
} from 'recharts';
import { Goal, TrendingUp, Shield } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import Card from '../ui/Card';
import EmptyState from '../ui/EmptyState';

const RED = '#E8002D';
const BLUE = '#00A1DE';
const GOLD = '#F5A623';
const GREEN = '#00C853';

const ChartCard = ({ icon: Icon, title, subtitle, children }) => (
  <Card className="p-5 sm:p-6">
    <div className="flex items-center gap-3 mb-5">
      <span className="w-9 h-9 rounded-xl bg-red/10 text-red flex items-center justify-center">
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
      <p className="text-[10px] font-bold uppercase tracking-widest text-surface-dark dark:text-white">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="text-xs tabular-nums" style={{ color: p.color || p.fill }}>
          {p.name}: <span className="font-bold">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

const shortName = (name = '') =>
  name.length > 12 ? name.split(' ').map((w) => w[0]).join('').slice(0, 4).toUpperCase() : name;

const LeagueStats = ({ standings = [], topScorers = [] }) => {
  const theme = useTheme();