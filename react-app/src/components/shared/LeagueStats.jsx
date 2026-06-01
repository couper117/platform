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
  const grid = theme?.dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const axis = theme?.dark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';

  if (!standings.length && !topScorers.length) {
    return <EmptyState icon={TrendingUp} title="No statistics yet" hint="Stats appear once matches are played." />;
  }

  const sortedStandings = [...standings].sort((a, b) => b.points - a.points);
  const pointsData = sortedStandings.map((s) => ({
    name: shortName(s.team?.name),
    full: s.team?.name,
    points: s.points,
  }));
  const goalsData = sortedStandings.map((s) => ({
    name: shortName(s.team?.name),
    full: s.team?.name,
    For: s.goalsFor,
    Against: s.goalsAgainst,
  }));
  const scorersData = [...topScorers]
    .sort((a, b) => b.goals - a.goals)
    .slice(0, 8)
    .map((s) => ({
      name: s.player?.fullName ? s.player.fullName.split(' ').slice(-1)[0] : 'Player',
      full: s.player?.fullName,
      goals: s.goals,
      assists: s.assists || 0,
    }));

  const axisProps = {
    tick: { fill: axis, fontSize: 10, fontWeight: 700 },
    tickLine: false,
    axisLine: { stroke: grid },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Points */}
      {pointsData.length > 0 && (
        <ChartCard icon={TrendingUp} title="Points" subtitle="Table by points">
          <ResponsiveContainer width="100%" height={Math.max(220, pointsData.length * 34)}>
            <BarChart data={pointsData} layout="vertical" margin={{ left: 8, right: 24 }}>
              <CartesianGrid horizontal={false} stroke={grid} />
              <XAxis type="number" {...axisProps} />
              <YAxis type="category" dataKey="name" width={56} {...axisProps} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(232,0,45,0.06)' }} />
              <Bar dataKey="points" radius={[0, 6, 6, 0]}>
                {pointsData.map((entry, i) => (
                  <Cell key={i} fill={i === 0 ? GOLD : i === 1 ? BLUE : i === 2 ? GREEN : RED} />