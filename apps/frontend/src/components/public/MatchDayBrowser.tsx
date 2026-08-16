import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Search, Trophy, CalendarDays } from 'lucide-react';
import { startOfDay, endOfDay, addDays, format, isToday, isTomorrow, isYesterday } from 'date-fns';
import { getFixtures } from '../../api/endpoints/fixtures';
import Skeleton from '../shared/Skeleton';

const initials = (name = '') => (name || '?').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

const dayLabel = (d, t) => {
  if (isYesterday(d)) return t('browser.yesterday');
  if (isToday(d)) return t('browser.today');
  if (isTomorrow(d)) return t('browser.tomorrow');
  return format(d, 'EEE');
};

const StatusCell = ({ f, t }) => {
  if (f.status === 'LIVE') {
    return (
      <div className="flex flex-col items-center min-w-[54px]">
        <span className="text-[9px] font-bold text-red uppercase tracking-tighter italic flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-red rounded-full animate-pulse" /> {t('match.live')}
        </span>
        <span className="font-display text-lg leading-none mt-1">{f.homeScore ?? 0}-{f.awayScore ?? 0}</span>
      </div>
    );
  }
  if (f.status === 'COMPLETED') {
    return (
      <div className="flex flex-col items-center min-w-[54px]">
        <span className="text-[9px] font-bold opacity-40 uppercase tracking-widest">{t('browser.ft')}</span>
        <span className="font-display text-lg leading-none mt-1">{f.homeScore ?? 0}-{f.awayScore ?? 0}</span>
      </div>
    );
  }
  if (f.status === 'POSTPONED' || f.status === 'CANCELLED') {
    return <span className="min-w-[54px] text-center text-[9px] font-bold uppercase tracking-widest text-gold">{f.status}</span>;
  }
  return (
    <span className="min-w-[54px] text-center font-display text-base opacity-70">
      {f.matchDate ? format(new Date(f.matchDate), 'HH:mm') : t('common.tbd')}
    </span>
  );
};

const TeamRow = ({ team, score, bold }: { team?: any; score?: any; bold?: boolean }) => (
  <div className="flex items-center gap-2.5 flex-1 min-w-0">
    <div className="w-7 h-7 rounded-full bg-surface-3 dark:bg-white/10 flex items-center justify-center overflow-hidden shrink-0 text-[9px] font-bold">
      {team?.logo ? <img src={team.logo} alt="" className="w-full h-full object-cover" /> : initials(team?.name)}
    </div>
    <span className={`text-sm truncate ${bold ? 'font-bold' : ''}`}>{team?.name || 'TBD'}</span>
  </div>
);

const MatchDayBrowser = ({ sportId, accent = '#E8002D', leagues = [], showSidebar = true }) => {
  const { t } = useTranslation();
  const [leagueId, setLeagueId] = useState(null);
  const [search, setSearch] = useState('');
  const [offset, setOffset] = useState(0); // 0 = today

  const days = useMemo(() => Array.from({ length: 8 }, (_, i) => addDays(new Date(), i - 1)), []);
  const activeDay = addDays(new Date(), offset);
  const from = startOfDay(activeDay).toISOString();
  const to = endOfDay(activeDay).toISOString();

  const filteredLeagues = leagues.filter((l) => l.name.toLowerCase().includes(search.toLowerCase()));

  const { data, isLoading } = useQuery({
    queryKey: ['browser-fixtures', sportId || 'all', leagueId, from],
    queryFn: async () => {
      const res = await getFixtures({ ...(sportId ? { sportId } : {}), ...(leagueId ? { leagueId } : {}), from, to, limit: 100 });
      return res.data || [];
    },
  });

  const matches = data || [];
  // Group matches by league for a clean LiveScore-style sectioned list.
  const grouped = useMemo(() => {
    const m = new Map();
    for (const f of matches) {
      const key = f.league?.name || 'Other';
      if (!m.has(key)) m.set(key, []);
      m.get(key).push(f);
    }
    return [...m.entries()];
  }, [matches]);

  return (
    <div className={showSidebar ? 'grid grid-cols-1 gap-6 lg:grid-cols-[260px_minmax(0,1fr)]' : ''}>
      {/* Left: league sidebar */}
      {showSidebar && (
      // min-w-0 is load-bearing: without it this grid item keeps its default
      // min-width:auto and the horizontal league rail below (a row of shrink-0
      // chips) forces the whole column to its content width — ~958px — which
      // dragged the entire sport page sideways on phones. min-w-0 lets the item
      // shrink to the track so the rail scrolls inside it instead.
      <aside className="min-w-0 lg:sticky lg:top-20 lg:self-start space-y-3">
        <div className="flex items-center bg-white dark:bg-white/5 rounded-xl border border-surface-3 dark:border-white/10 px-3">
          <Search size={15} className="opacity-30" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('browser.search_leagues')}
            className="bg-transparent text-sm p-2.5 w-full outline-none"
          />
        </div>
        <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-1">
          <button
            onClick={() => setLeagueId(null)}
            className={`shrink-0 flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all text-left ${leagueId === null ? 'text-white' : 'bg-white dark:bg-white/5 border border-surface-3 dark:border-white/10 hover:border-red/40'}`}
            style={leagueId === null ? { background: accent } : undefined}
          >
            <Trophy size={14} /> {t('browser.all')} {leagues.length ? `(${leagues.length})` : ''}
          </button>
          {filteredLeagues.map((l) => (
            <button
              key={l.id}
              onClick={() => setLeagueId(l.id)}
              className={`shrink-0 flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold uppercase tracking-tight transition-all text-left ${leagueId === l.id ? 'text-white' : 'bg-white dark:bg-white/5 border border-surface-3 dark:border-white/10 hover:border-red/40'}`}
              style={leagueId === l.id ? { background: accent } : undefined}
            >
              <span className="w-6 h-6 rounded-md bg-surface-3 dark:bg-white/10 flex items-center justify-center overflow-hidden shrink-0">
                {l.logo ? <img src={l.logo} alt="" className="w-full h-full object-cover" /> : <Trophy size={11} />}
              </span>
              <span className="truncate">{l.name}</span>
            </button>
          ))}
        </div>
      </aside>
      )}

      {/* Right: day selector + matches */}
      <div className="space-y-5 min-w-0">
        <div className="sticky top-16 z-10 -mx-1 px-1 py-2 bg-surface-2/90 dark:bg-surface-dark/90 backdrop-blur rounded-xl">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {days.map((d, i) => {
              const off = i - 1;
              const active = off === offset;
              return (
                <button
                  key={i}
                  onClick={() => setOffset(off)}
                  className={`shrink-0 flex flex-col items-center px-4 py-2 rounded-xl border transition-all ${active ? 'text-white border-transparent' : 'bg-white dark:bg-white/5 border-surface-3 dark:border-white/10 hover:border-red/40'}`}
                  style={active ? { background: accent } : undefined}
                >
                  <span className="text-[10px] font-bold uppercase tracking-widest">{dayLabel(d, t)}</span>
                  <span className="text-[9px] opacity-70">{format(d, 'd MMM')}</span>
                </button>
              );
            })}
          </div>
        </div>

        {isLoading ? (
          <Skeleton type="card" count={3} />
        ) : matches.length === 0 ? (
          <div className="rounded-2xl border border-surface-3 dark:border-white/10 bg-white dark:bg-surface-dark2 p-12 text-center">
            <CalendarDays size={34} className="mx-auto opacity-25 mb-3" />
            <p className="font-display text-xl uppercase tracking-widest opacity-60">{t('browser.no_matches', { day: dayLabel(activeDay, t) })}</p>
            <p className="text-xs opacity-40 mt-1">{t('browser.no_matches_hint')}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {grouped.map(([leagueName, list]) => (
              <div key={leagueName}>
                <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-50 mb-2 flex items-center gap-2">
                  <Trophy size={12} style={{ color: accent }} /> {leagueName}
                </h4>
                <div className="rounded-2xl border border-surface-3 dark:border-white/10 bg-white dark:bg-surface-dark2 divide-y divide-surface-3 dark:divide-white/5 overflow-hidden">
                  {list.map((f) => (
                    <Link key={f.id} to={`/matches/${f.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-surface-2 dark:hover:bg-white/5 transition-colors">
                      <StatusCell f={f} t={t} />
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <TeamRow team={f.homeTeam} bold={f.status !== 'SCHEDULED' && (f.homeScore ?? 0) >= (f.awayScore ?? 0)} />
                        <TeamRow team={f.awayTeam} bold={f.status !== 'SCHEDULED' && (f.awayScore ?? 0) >= (f.homeScore ?? 0)} />
                      </div>
                      {f.streamUrl && <span className="text-[8px] font-bold uppercase tracking-widest text-red border border-red/30 rounded px-1.5 py-0.5">▶ Live</span>}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchDayBrowser;
