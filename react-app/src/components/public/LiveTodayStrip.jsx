import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { startOfDay, endOfDay, format } from 'date-fns';
import { Radio } from 'lucide-react';
import { getFixtures } from '../../api/endpoints/fixtures';
import ResponsiveWrapper from '../shared/ResponsiveWrapper';

const initials = (n = '') => (n || '?').split(' ').map((w) => w[0]).join('').slice(0, 3).toUpperCase();

const TeamLine = ({ team, score, showScore, lead }) => (
  <div className="flex items-center justify-between py-0.5">
    <div className="flex items-center gap-2 min-w-0">
      <span className="w-5 h-5 rounded-full bg-surface-3 dark:bg-white/10 flex items-center justify-center overflow-hidden text-[8px] font-bold shrink-0">
        {team?.logo ? <img src={team.logo} alt="" className="w-full h-full object-cover" /> : initials(team?.name)}
      </span>
      <span className={`text-xs truncate ${lead ? 'font-bold' : 'font-medium'}`}>{team?.name || 'TBD'}</span>
    </div>
    {showScore && <span className="font-display text-sm tabular-nums ml-2">{score ?? 0}</span>}
  </div>
);

const Chip = ({ f, t }) => {
  const live = f.status === 'LIVE';
  const done = f.status === 'COMPLETED';
  const showScore = live || done;
  const hs = f.homeScore ?? 0;
  const as = f.awayScore ?? 0;
  return (
    <Link
      to={`/matches/${f.id}`}
      className="shrink-0 w-[210px] snap-start rounded-2xl border border-surface-3 dark:border-white/10 bg-white dark:bg-surface-dark2 p-3 hover:border-red/40 hover:shadow-lg transition-all"
    >
      <div className="flex items-center justify-between mb-2 text-[9px] font-bold uppercase tracking-widest">
        <span className="truncate opacity-40 max-w-[60%]">{f.league?.name || 'Match'}</span>
        {live ? (
          <span className="flex items-center gap-1 text-red"><span className="w-1.5 h-1.5 bg-red rounded-full animate-pulse" />{t('match.live')}</span>
        ) : done ? (
          <span className="opacity-40">{t('browser.ft')}</span>
        ) : (
          <span className="opacity-60">{f.matchDate ? format(new Date(f.matchDate), 'HH:mm') : t('common.tbd')}</span>
        )}
      </div>
      <TeamLine team={f.homeTeam} score={hs} showScore={showScore} lead={showScore && hs >= as} />
      <TeamLine team={f.awayTeam} score={as} showScore={showScore} lead={showScore && as >= hs} />
    </Link>
  );
};

const LiveTodayStrip = () => {
  const { t } = useTranslation();
  const from = startOfDay(new Date()).toISOString();
  const to = endOfDay(new Date()).toISOString();

  const { data: live } = useQuery({
    queryKey: ['strip-live'],
    queryFn: async () => (await getFixtures({ status: 'LIVE', limit: 30 })).data || [],
    refetchInterval: 30000,
  });
  const { data: today } = useQuery({
    queryKey: ['strip-today', from],
    queryFn: async () => (await getFixtures({ from, to, limit: 50 })).data || [],
  });

  // Merge live + today, dedupe, live first then by kickoff time.
  const seen = new Set();
  const items = [];
  for (const f of [...(live || []), ...(today || [])]) {
    if (seen.has(f.id)) continue;
    seen.add(f.id);
    items.push(f);
  }
  items.sort((a, b) => {
    if ((a.status === 'LIVE') !== (b.status === 'LIVE')) return a.status === 'LIVE' ? -1 : 1;
    return new Date(a.matchDate || 0) - new Date(b.matchDate || 0);
  });

  if (!items.length) return null;
  const liveCount = items.filter((f) => f.status === 'LIVE').length;

  return (
    <ResponsiveWrapper className="mt-10">
      <div className="flex items-center gap-2 mb-3">
        <Radio size={15} className="text-red" />
        <h2 className="text-[10px] uppercase font-bold tracking-[0.4em]">{t('browser.live_today')}</h2>
        {liveCount > 0 && (
          <span className="text-[9px] font-bold uppercase tracking-widest text-red bg-red/10 border border-red/20 rounded-full px-2 py-0.5">
            {t('browser.live_count', { count: liveCount })}
          </span>
        )}
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 snap-x scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
        {items.map((f) => <Chip key={f.id} f={f} />)}
      </div>
    </ResponsiveWrapper>
  );
};

export default LiveTodayStrip;
