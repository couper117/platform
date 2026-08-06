import React, { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  Trophy, Clock, MapPin, ChevronLeft, Calendar, Users, Play, Award, Wifi,
} from 'lucide-react';
import { format } from 'date-fns';
import { getFixture } from '../../api/endpoints/fixtures';
import useLiveMatch from '../../hooks/useLiveMatch';
import ResponsiveWrapper from '../../components/shared/ResponsiveWrapper';
import MatchEventTimeline from '../../components/shared/MatchEventTimeline';
import Skeleton from '../../components/shared/Skeleton';
import Seo from '../../components/shared/Seo';
import { LiveBadge } from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';

// Animated score digit that pops when the value changes.
const ScoreDigit = ({ value }) => (
  <motion.span
    key={value}
    initial={{ scale: 1.5, color: '#E8002D' }}
    animate={{ scale: 1, color: 'currentColor' }}
    transition={{ type: 'spring', stiffness: 400, damping: 18 }}
    className="text-5xl sm:text-9xl font-display text-white tabular-nums"
  >
    {value ?? 0}
  </motion.span>
);

const StatBar = ({ label, home, away }) => {
  const total = (home || 0) + (away || 0);
  const homePct = total ? Math.round((home / total) * 100) : 50;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs font-bold tabular-nums">
        <span className={home >= away ? 'text-red' : 'opacity-50'}>{home}</span>
        <span className="text-[10px] uppercase tracking-widest opacity-40">{label}</span>
        <span className={away >= home ? 'text-red' : 'opacity-50'}>{away}</span>
      </div>
      <div className="flex h-1.5 rounded-full overflow-hidden bg-surface-3 dark:bg-white/10">
        <div className="bg-red transition-all duration-500" style={{ width: `${homePct}%` }} />
        <div className="bg-rwanda-blue transition-all duration-500" style={{ width: `${100 - homePct}%` }} />
      </div>
    </div>
  );
};

const TeamBadge = ({ team, size = 'lg' }) => {
  const dim = size === 'lg' ? 'w-16 h-16 sm:w-32 sm:h-32' : 'w-12 h-12';
  return (
    <div className={`${dim} rounded-full bg-white/5 border-2 border-white/10 flex items-center justify-center p-4 overflow-hidden`}>
      {team?.logo ? (
        <img src={team.logo} alt={team.name} className="w-full h-full object-contain" />
      ) : (
        <Trophy size={size === 'lg' ? 48 : 20} className="opacity-10" />
      )}
    </div>
  );
};

const MatchDetailsPage = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const [tab, setTab] = useState('overview');

  const { data: fixture, isLoading } = useQuery({
    queryKey: ['match-details', id],
    queryFn: () => getFixture(id),
  });

  const m = fixture?.data;
  const { live, connected } = useLiveMatch(id, m);
  const isLive = live.status === 'LIVE';
  const isCompleted = live.status === 'COMPLETED';

  // Derive simple team stats from events (goals / cards) for the stats tab.
  const stats = useMemo(() => {
    const init = { goals: [0, 0], yellow: [0, 0], red: [0, 0] };
    if (!m) return init;
    for (const e of live.events || []) {
      const side = e.teamId === m.homeTeamId ? 0 : 1;
      if (e.eventType === 'GOAL' || e.eventType === 'PENALTY') init.goals[side] += 1;
      if (e.eventType === 'YELLOW_CARD') init.yellow[side] += 1;
      if (e.eventType === 'RED_CARD') init.red[side] += 1;
    }
    return init;
  }, [live.events, m]);

  const lineups = m?.lineups || [];
  const homeLineup = lineups.filter((l) => l.teamId === m?.homeTeamId);
  const awayLineup = lineups.filter((l) => l.teamId === m?.awayTeamId);
  const sheetFor = (teamId) => (m?.teamSheets || []).find((s) => s.teamId === teamId);

  // Real per-team statistics (entered by the admin), with event-derived fallback.
  const homeStat = (m?.stats || []).find((s) => s.teamId === m?.homeTeamId);
  const awayStat = (m?.stats || []).find((s) => s.teamId === m?.awayTeamId);
  const hasStats = !!(homeStat || awayStat);
  const STAT_ROWS = [
    ['possession', 'Possession %'], ['shots', 'Shots'], ['shotsOnTarget', 'Shots on Target'],
    ['shotsInsideBox', 'Shots Inside Box'], ['shotsOutsideBox', 'Shots Outside Box'],
    ['corners', 'Corners'], ['offsides', 'Offsides'], ['fouls', 'Fouls'],
    ['yellowCards', 'Yellow Cards'], ['redCards', 'Red Cards'], ['gkSaves', 'GK Saves'],
    ['passAccuracy', 'Pass Accuracy %'], ['xg', 'Expected Goals (xG)'],
  ];
  // Newest-first timeline while the match is live.
  const orderedEvents = isLive
    ? [...(live.events || [])].sort((a, b) => (b.minute || 0) - (a.minute || 0))
    : (live.events || []);

  if (isLoading) {
    return <div className="py-20"><ResponsiveWrapper><Skeleton type="card" /></ResponsiveWrapper></div>;
  }

  if (!m) {
    return (
      <div className="py-32">
        <ResponsiveWrapper>
          <EmptyState title={t('match.not_found')} hint={t('match.not_found_hint')} />
        </ResponsiveWrapper>
      </div>
    );
  }

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'stats', label: 'Stats' },
    { key: 'lineups', label: 'Lineups' },
    { key: 'summary', label: 'Summary' },
  ];

  return (
    <div className="bg-surface-2 dark:bg-surface-dark min-h-screen pb-24">
      <Seo title={`${m.homeTeam?.name} vs ${m.awayTeam?.name}`} description={`Live coverage of ${m.homeTeam?.name} vs ${m.awayTeam?.name}.`} />

      {/* Breadcrumb */}
      <div className="bg-surface-dark border-b border-white/5 py-4">
        <ResponsiveWrapper>
          <Link to="/fixtures" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-red transition-colors">
            <ChevronLeft size={14} />
            <span>{t('match.back_to_schedule')}</span>
          </Link>
        </ResponsiveWrapper>
      </div>

      {/* Scoreboard */}
      <section className="bg-surface-dark py-12 sm:py-20 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red/10 via-transparent to-rwanda-blue/5 opacity-50" />

        <ResponsiveWrapper className="relative z-10">
          <div className="flex flex-col items-center gap-10 sm:gap-12">
            {/* Status */}
            <div className="flex flex-col items-center gap-3">
              <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/30">{m.league?.name}</span>
              {isLive ? (
                <div className="flex items-center gap-3">
                  <LiveBadge minute={live.minute} />
                  {connected && (
                    <span className="flex items-center gap-1 text-[9px] uppercase tracking-widest text-green/80">
                      <Wifi size={11} /> Real-time
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-xs font-bold uppercase tracking-widest opacity-40">
                  {isCompleted ? 'Full Time' : live.status}
                </span>
              )}
            </div>

            {/* Score */}
            <div className="w-full flex items-center justify-between max-w-4xl">
              <div className="flex-1 flex flex-col items-center text-center gap-3 sm:gap-4 min-w-0">
                <TeamBadge team={m.homeTeam} />
                <h2 className="text-sm sm:text-3xl font-display uppercase tracking-tight leading-tight line-clamp-2">{m.homeTeam?.name}</h2>
              </div>

              <div className="flex items-center gap-2 sm:gap-12 px-2 sm:px-16 shrink-0">
                <ScoreDigit value={live.homeScore} />
                <span className="text-2xl sm:text-5xl font-display opacity-20">:</span>
                <ScoreDigit value={live.awayScore} />
              </div>

              <div className="flex-1 flex flex-col items-center text-center gap-3 sm:gap-4 min-w-0">
                <TeamBadge team={m.awayTeam} />
                <h2 className="text-sm sm:text-3xl font-display uppercase tracking-tight leading-tight line-clamp-2">{m.awayTeam?.name}</h2>
              </div>
            </div>

            {/* Info bar */}
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-[10px] font-bold uppercase tracking-widest text-white/50 border-t border-white/5 pt-8 w-full">
              <span className="flex items-center gap-2"><Calendar size={14} className="text-red" />{m.matchDate ? format(new Date(m.matchDate), 'dd MMM yyyy') : 'TBD'}</span>
              <span className="flex items-center gap-2"><Clock size={14} className="text-red" />{m.matchDate ? format(new Date(m.matchDate), 'HH:mm') : 'TBD'} CAT</span>
              <span className="flex items-center gap-2"><MapPin size={14} className="text-red" />{m.venue || 'TBD'}</span>
              {m.referee && <span className="flex items-center gap-2"><Award size={14} className="text-red" />REF: {m.referee}</span>}
            </div>

            {m.streamUrl ? (
              <a
                href={m.streamUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2.5 bg-red text-white font-display text-lg uppercase tracking-widest px-8 py-3.5 rounded-xl hover:bg-red-dark transition-all shadow-xl shadow-red/30 hover:scale-[1.03]"
              >
                <Play size={20} fill="currentColor" /> Watch Live
              </a>
            ) : (
              <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-white/30 border border-white/10 rounded-xl px-5 py-3">
                <Play size={14} /> Live streaming is unavailable
              </span>
            )}
          </div>
        </ResponsiveWrapper>
      </section>

      {/* Tabbed content */}
      <ResponsiveWrapper className="mt-10">
        {/* Tabs */}
        <div className="flex items-center gap-1 p-1 bg-white dark:bg-surface-dark2 rounded-xl border border-surface-3 dark:border-white/5 w-full sm:w-auto sm:inline-flex mb-8">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 sm:flex-none px-2 sm:px-6 py-2.5 rounded-lg font-display text-xs sm:text-sm uppercase tracking-wide sm:tracking-widest transition-colors cursor-pointer ${
                tab === t.key ? 'bg-red text-white shadow-lg shadow-red/20' : 'text-surface-dark/50 dark:text-white/50 hover:text-red'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Overview */}
        {tab === 'overview' && (
          <div className="grid gap-6 lg:grid-cols-3 max-w-5xl mx-auto">
            <Card className="p-6 lg:col-span-2 space-y-4">
              <h3 className="font-display text-lg uppercase tracking-tight">Match Info</h3>
              <dl className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
                {[
                  ['Competition', m.league?.name],
                  ['Status', isCompleted ? 'Full Time' : live.status],
                  ['Date', m.matchDate ? format(new Date(m.matchDate), 'EEEE, dd MMM yyyy') : 'TBD'],
                  ['Kick-off', m.matchDate ? `${format(new Date(m.matchDate), 'HH:mm')} CAT` : 'TBD'],
                  ['Venue', m.venue || 'TBD'],
                  ['Referee', m.referee || '—'],
                  ['Matchday', m.matchday ? `Round ${m.matchday}` : '—'],
                  ['Attendance', m.attendance ? m.attendance.toLocaleString() : '—'],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-[10px] uppercase font-bold tracking-widest opacity-40">{k}</dt>
                    <dd className="mt-0.5 font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
            </Card>
            <Card className="p-6 flex flex-col items-center justify-center text-center gap-4">
              <span className="text-[10px] uppercase font-bold tracking-widest opacity-40">Result</span>
              <div className="flex items-center gap-4">
                <TeamBadge team={m.homeTeam} size="sm" />
                <span className="font-display text-4xl tabular-nums">{live.homeScore ?? 0}<span className="opacity-20 mx-1">:</span>{live.awayScore ?? 0}</span>
                <TeamBadge team={m.awayTeam} size="sm" />
              </div>
              <p className="text-xs opacity-50">{m.homeTeam?.name} vs {m.awayTeam?.name}</p>
            </Card>
          </div>
        )}

        {/* Stats */}
        {tab === 'stats' && (
          <Card className="p-6 sm:p-8 max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-6 text-[10px] uppercase tracking-widest font-bold">
              <span className="text-red truncate max-w-[40%]">{m.homeTeam?.name}</span>
              <span className="opacity-40">Match Stats</span>
              <span className="text-rwanda-blue truncate max-w-[40%] text-right">{m.awayTeam?.name}</span>
            </div>
            {hasStats ? (
              <div className="space-y-5">
                {STAT_ROWS.map(([key, label]) => {
                  const h = homeStat?.[key]; const a = awayStat?.[key];
                  if ((h == null || h === '') && (a == null || a === '')) return null;
                  return <StatBar key={key} label={label} home={Number(h) || 0} away={Number(a) || 0} />;
                })}
              </div>
            ) : (
              <div className="space-y-5">
                <StatBar label="Goals" home={stats.goals[0]} away={stats.goals[1]} />
                <StatBar label="Yellow Cards" home={stats.yellow[0]} away={stats.yellow[1]} />
                <StatBar label="Red Cards" home={stats.red[0]} away={stats.red[1]} />
                <p className="mt-6 text-[10px] uppercase tracking-widest opacity-30 text-center">
                  Detailed statistics not published yet — derived live from match events
                </p>
              </div>
            )}
          </Card>
        )}

        {/* Lineups */}
        {tab === 'lineups' && (
          (homeLineup.length || awayLineup.length) ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[{ team: m.homeTeam, list: homeLineup, sheet: sheetFor(m.homeTeamId) }, { team: m.awayTeam, list: awayLineup, sheet: sheetFor(m.awayTeamId) }].map((side, i) => {
                const starters = side.list.filter((p) => p.isStarter);
                const bench = side.list.filter((p) => !p.isStarter);
                const Row = (p) => (
                  <li key={p.id} className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-surface-2 dark:hover:bg-white/5 transition-colors">
                    <span className="w-7 h-7 rounded-md bg-surface-2 dark:bg-white/5 flex items-center justify-center text-[11px] font-display tabular-nums">{p.jerseyNo ?? '—'}</span>
                    <span className="flex-1 text-sm font-medium">{p.player?.fullName || 'Player'}</span>
                    {p.isCaptain && <span className="text-[9px] font-bold uppercase tracking-widest text-gold">C</span>}
                    <span className="text-[10px] uppercase tracking-widest opacity-40">{p.position || ''}</span>
                  </li>
                );
                return (
                  <Card key={i} className="p-6">
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-surface-3 dark:border-white/5">
                      <div className="flex items-center gap-3">
                        <TeamBadge team={side.team} size="sm" />
                        <div>
                          <h3 className="font-display text-lg uppercase tracking-tight leading-none">{side.team?.name}</h3>
                          {side.sheet?.coachName && <p className="text-[10px] uppercase tracking-widest opacity-40 mt-1">Coach: {side.sheet.coachName}</p>}
                        </div>
                      </div>
                      {side.sheet?.formation && <span className="text-xs font-display px-3 py-1 rounded-lg bg-red/10 text-red">{side.sheet.formation}</span>}
                    </div>
                    {starters.length > 0 && <>
                      <p className="text-[10px] uppercase font-bold tracking-widest opacity-40 mb-1">Starting XI</p>
                      <ul className="space-y-1 mb-4">{starters.map(Row)}</ul>
                    </>}
                    {bench.length > 0 && <>
                      <p className="text-[10px] uppercase font-bold tracking-widest opacity-40 mb-1">Substitutes</p>
                      <ul className="space-y-1 opacity-80">{bench.map(Row)}</ul>
                    </>}
                  </Card>
                );
              })}
            </div>
          ) : (
            <EmptyState icon={Users} title="Lineups not available yet" hint="Team sheets have not been published for this match." className="py-16" />
          )
        )}

        {/* Summary — event timeline (newest first while live) */}
        {tab === 'summary' && (
          <div className="max-w-3xl mx-auto">
            {orderedEvents.length ? (
              <MatchEventTimeline events={orderedEvents} homeTeamId={m.homeTeamId} />
            ) : (
              <EmptyState icon={Clock} title="No events yet" hint="Match events will appear here as they happen." className="py-16" />
            )}
          </div>
        )}
      </ResponsiveWrapper>
    </div>
  );
};

export default MatchDetailsPage;
