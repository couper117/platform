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
    className="text-6xl sm:text-9xl font-display text-white tabular-nums"
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
  const dim = size === 'lg' ? 'w-20 h-20 sm:w-32 sm:h-32' : 'w-12 h-12';
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
  const [tab, setTab] = useState('timeline');

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
    { key: 'timeline', label: t('match.timeline') },
    { key: 'lineups', label: t('match.lineups') },
    { key: 'stats', label: t('match.stats') },
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
              <div className="flex-1 flex flex-col items-center text-center gap-4">
                <TeamBadge team={m.homeTeam} />
                <h2 className="text-xl sm:text-3xl font-display uppercase tracking-tight">{m.homeTeam?.name}</h2>
              </div>

              <div className="flex items-center gap-6 sm:gap-12 px-6 sm:px-16">
                <ScoreDigit value={live.homeScore} />
                <span className="text-3xl sm:text-5xl font-display opacity-20">:</span>
                <ScoreDigit value={live.awayScore} />
              </div>

              <div className="flex-1 flex flex-col items-center text-center gap-4">
                <TeamBadge team={m.awayTeam} />
                <h2 className="text-xl sm:text-3xl font-display uppercase tracking-tight">{m.awayTeam?.name}</h2>
              </div>
            </div>

            {/* Info bar */}
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-[10px] font-bold uppercase tracking-widest text-white/50 border-t border-white/5 pt-8 w-full">
              <span className="flex items-center gap-2"><Calendar size={14} className="text-red" />{m.matchDate ? format(new Date(m.matchDate), 'dd MMM yyyy') : 'TBD'}</span>
              <span className="flex items-center gap-2"><Clock size={14} className="text-red" />{m.matchDate ? format(new Date(m.matchDate), 'HH:mm') : 'TBD'} CAT</span>
              <span className="flex items-center gap-2"><MapPin size={14} className="text-red" />{m.venue || 'TBD'}</span>
              {m.referee && <span className="flex items-center gap-2"><Award size={14} className="text-red" />REF: {m.referee}</span>}
            </div>

            {m.streamActive && m.streamUrl && (
              <Button href={m.streamUrl} target="_blank" rel="noreferrer" icon={Play} size="md">
                Watch Live Stream
              </Button>
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
              className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg font-display text-sm uppercase tracking-widest transition-colors cursor-pointer ${
                tab === t.key ? 'bg-red text-white shadow-lg shadow-red/20' : 'text-surface-dark/50 dark:text-white/50 hover:text-red'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Timeline */}
        {tab === 'timeline' && (
          <div className="max-w-3xl mx-auto">
            <MatchEventTimeline events={live.events} homeTeamId={m.homeTeamId} />
          </div>
        )}

        {/* Lineups */}
        {tab === 'lineups' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[{ team: m.homeTeam, list: homeLineup }, { team: m.awayTeam, list: awayLineup }].map((side, i) => (
              <Card key={i} className="p-6">
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-surface-3 dark:border-white/5">
                  <TeamBadge team={side.team} size="sm" />
                  <h3 className="font-display text-xl uppercase tracking-tight">{side.team?.name}</h3>
                </div>
                {side.list.length ? (
                  <ul className="space-y-1">
                    {side.list.map((p) => (
                      <li key={p.id} className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-surface-2 dark:hover:bg-white/5 transition-colors">
                        <span className="w-7 h-7 rounded-md bg-surface-2 dark:bg-white/5 flex items-center justify-center text-[11px] font-display tabular-nums">{p.jerseyNo ?? '—'}</span>
                        <span className="flex-1 text-sm font-medium">{p.player?.fullName || 'Player'}</span>
                        {p.isCaptain && <span className="text-[9px] font-bold uppercase tracking-widest text-gold">C</span>}
                        <span className="text-[10px] uppercase tracking-widest opacity-40">{p.position || ''}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyState icon={Users} title="No lineup yet" hint="Team sheet not published." className="py-10" />
                )}
              </Card>
            ))}
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
            <div className="space-y-5">
              <StatBar label="Goals" home={stats.goals[0]} away={stats.goals[1]} />
              <StatBar label="Yellow Cards" home={stats.yellow[0]} away={stats.yellow[1]} />
              <StatBar label="Red Cards" home={stats.red[0]} away={stats.red[1]} />
            </div>
            <p className="mt-6 text-[10px] uppercase tracking-widest opacity-30 text-center">
              Derived live from match events
            </p>
          </Card>
        )}
      </ResponsiveWrapper>
    </div>
  );
};

export default MatchDetailsPage;
