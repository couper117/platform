import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Radio, PenLine, Flag, Camera, Link2, MapPin, ChevronRight, Circle,
} from 'lucide-react';
import { getFixtures } from '../../api/endpoints/fixtures';
import useAuthStore from '../../store/authStore';
import ClubCrest from '../../components/ui/ClubCrest';
import Avatar from '../../components/ui/Avatar';

/**
 * REPORTER DASHBOARD — the reporter's assignments + live-reporting overview.
 * Dark-first, mobile-first. "Update Match" opens the live console. Built to be
 * operated quickly from a phone at the stadium (SPEED over decoration).
 */

const RECENT = [
  { m: "45+2'", icon: '⚽', label: 'Goal!', team: 'Rayon Sports', score: '1 - 1', ago: '2 min ago', color: 'text-[#2fd778]' },
  { m: "42'", icon: '🟨', label: 'Yellow Card', team: 'APR FC', ago: '2 min ago', color: 'text-[#eab308]' },
  { m: "38'", icon: '🔄', label: 'Substitution', team: 'Rayon Sports', ago: '5 min ago', color: 'text-blue-400' },
  { m: "15'", icon: '⚽', label: 'Goal!', team: 'APR FC', ago: '15 min ago', color: 'text-[#2fd778]' },
];

const QUICK = [
  { label: 'Add Update', icon: PenLine, cls: 'bg-[#12b76a] text-white' },
  { label: 'Add Event', icon: Flag, cls: 'bg-[#a16207] text-white' },
  { label: 'Add Media', icon: Camera, cls: 'bg-[#1d4ed8] text-white' },
  { label: 'Add Stream', icon: Link2, cls: 'bg-[#6d28d9] text-white' },
];

const LiveReportingPage = () => {
  const { user } = useAuthStore();
  const { data } = useQuery({ queryKey: ['reporter-fixtures'], queryFn: () => getFixtures({ status: 'LIVE' }) });
  const live = (data?.data || []).filter((f) => f.leagueId === 1);
  const match = live[0];

  return (
    <div className="min-h-screen bg-[#080b09] p-4 text-white">
      <div className="mx-auto max-w-2xl space-y-5">
        {/* Profile */}
        <div className="flex items-center gap-3">
          <Avatar src={user?.avatar} name={user?.fullName || 'John Reporter'} size="lg" />
          <div>
            <p className="font-display text-lg font-bold">{user?.fullName || 'John Reporter'}</p>
            <p className="flex items-center gap-1.5 text-xs text-white/50">Match Reporter <Circle size={6} className="fill-[#2fd778] text-[#2fd778]" /> <span className="text-[#2fd778]">Online</span></p>
          </div>
        </div>

        <div>
          <h1 className="font-display text-2xl uppercase tracking-tight">Reporter Dashboard</h1>
          <p className="text-sm text-white/50">Your assignments and live reporting overview.</p>
        </div>

        {/* Today's assignments */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="mb-3 flex items-center justify-between"><h2 className="font-display text-lg uppercase tracking-tight">Today's Assignments</h2><Link to="/reporter/dashboard" className="text-[11px] font-bold uppercase tracking-wider text-[#2fd778]">View all</Link></div>
          {match ? (
            <>
              <span className="mb-3 inline-flex items-center gap-1 rounded-md bg-red-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-400"><Circle size={7} className="animate-pulse fill-red-400" /> Live</span>
              <div className="flex items-center justify-around gap-2">
                <div className="flex flex-col items-center gap-1.5"><ClubCrest team={match.homeTeam} size="lg" /><span className="max-w-[90px] truncate text-xs font-bold">{match.homeTeam?.name}</span></div>
                <span className="font-display text-lg text-white/50">VS</span>
                <div className="flex flex-col items-center gap-1.5"><ClubCrest team={match.awayTeam} size="lg" /><span className="max-w-[90px] truncate text-xs font-bold">{match.awayTeam?.name}</span></div>
              </div>
              <p className="mt-2 text-center text-xs text-white/50">{match.league?.name}</p>
              <p className="flex items-center justify-center gap-1 text-[11px] text-white/40"><MapPin size={11} /> {match.venue}</p>
              <Link to={`/reporter/match/${match.id}`} className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-[#12b76a] py-3 text-sm font-bold text-white"><PenLine size={15} /> Update Match</Link>
            </>
          ) : <p className="py-6 text-center text-sm text-white/40">No matches assigned right now.</p>}

          <div className="mt-3 grid grid-cols-3 gap-2">
            {[['3', 'Live Updates'], ['12', 'Total Matches'], ['98%', 'Accuracy']].map(([v, l]) => (
              <div key={l} className="rounded-xl border border-white/10 bg-white/[0.02] py-3 text-center"><p className="font-display text-xl font-bold">{v}</p><p className="text-[10px] uppercase tracking-wider text-white/40">{l}</p></div>
            ))}
          </div>
        </section>

        {/* Quick actions */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <h2 className="mb-3 font-display text-lg uppercase tracking-tight">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-2">
            {QUICK.map((a) => (
              <Link key={a.label} to={match ? `/reporter/match/${match.id}` : '/reporter/dashboard'} className={`inline-flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold ${a.cls}`}>
                <a.icon size={16} /> {a.label}
              </Link>
            ))}
          </div>
        </section>

        {/* Recent updates */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="mb-3 flex items-center justify-between"><h2 className="font-display text-lg uppercase tracking-tight">Recent Updates</h2><span className="text-[11px] font-bold uppercase tracking-wider text-[#2fd778]">View all</span></div>
          <div className="space-y-2">
            {RECENT.map((e, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl bg-white/[0.03] p-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#2fd778]/30 text-[11px] font-bold tabular-nums text-[#2fd778]">{e.m}</span>
                <span className="text-lg" aria-hidden="true">{e.icon}</span>
                <div className="min-w-0 flex-1"><p className={`text-sm font-bold ${e.color}`}>{e.label}</p><p className="truncate text-[11px] text-white/50">{e.team}</p></div>
                {e.score && <span className="shrink-0 font-display text-sm font-bold text-[#2fd778]">{e.score}</span>}
                <span className="shrink-0 text-[10px] text-white/30">{e.ago}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default LiveReportingPage;
