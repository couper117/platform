import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import cn from '../ui/cn';

/**
 * MatchStats — per-team match statistics.
 *
 * Prefers real, admin-entered stats (`live.stats`, falling back to the REST
 * payload's `stats`) — the same MatchStat[] shape the API controllers return,
 * keyed by teamId. When none have been published yet, falls back to numbers
 * derived from the event feed (goals / cards) rather than an empty panel, and
 * says so honestly instead of presenting derived counts as official stats.
 */

type TeamStat = Record<string, any> & { teamId?: any };

type MatchStatsProps = {
  fixture: { homeTeamId?: any; awayTeamId?: any; homeTeam?: any; awayTeam?: any; stats?: TeamStat[] };
  live: { events?: any[]; stats?: TeamStat[]; lastStatsUpdate?: number | null };
  isLive: boolean;
  connected: boolean;
  className?: string;
};

const StatNum = ({ value, lead }: { value: number; lead: boolean }) => (
  <motion.span
    key={value}
    initial={{ scale: 1.3 }}
    animate={{ scale: 1 }}
    transition={{ type: 'spring', stiffness: 500, damping: 22 }}
    className={cn('inline-block tabular-nums', lead ? 'font-semibold text-primary' : 'text-secondary')}
  >
    {value}
  </motion.span>
);

const StatBar = ({ label, home, away }: { label: string; home: number; away: number }) => {
  const total = home + away;
  const homePct = total ? Math.round((home / total) * 100) : 50;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3 text-sm">
        <StatNum value={home} lead={home >= away} />
        <span className="text-xs text-tertiary">{label}</span>
        <StatNum value={away} lead={away >= home} />
      </div>
      <div className="flex h-1.5 overflow-hidden rounded-pill bg-surface-2">
        <div className="bg-primary/70 transition-all duration-500 ease-standard" style={{ width: `${homePct}%` }} />
        <div className="bg-tertiary/30 transition-all duration-500 ease-standard" style={{ width: `${100 - homePct}%` }} />
      </div>
    </div>
  );
};

const MatchStats = ({ fixture, live, isLive, connected, className }: MatchStatsProps) => {
  const { t } = useTranslation();

  // Simple per-team counts derived from the event feed — the fallback when no
  // MatchStat rows have been published for this fixture yet.
  const derived = useMemo(() => {
    const init = { goals: [0, 0], yellow: [0, 0], red: [0, 0] };
    for (const e of live.events || []) {
      const side = e.teamId === fixture.homeTeamId ? 0 : 1;
      if (e.eventType === 'GOAL' || e.eventType === 'PENALTY') init.goals[side] += 1;
      if (e.eventType === 'YELLOW_CARD') init.yellow[side] += 1;
      if (e.eventType === 'RED_CARD') init.red[side] += 1;
    }
    return init;
  }, [live.events, fixture.homeTeamId]);

  const liveStats = live.stats?.length ? live.stats : fixture?.stats || [];
  const homeStat = liveStats.find((s) => s.teamId === fixture.homeTeamId);
  const awayStat = liveStats.find((s) => s.teamId === fixture.awayTeamId);
  const hasStats = !!(homeStat || awayStat);
  const justUpdated = !!live.lastStatsUpdate && Date.now() - live.lastStatsUpdate < 2500;

  const STAT_ROWS: Array<[string, string]> = [
    ['possession', t('matchstat.possession')],
    ['shots', t('matchstat.shots')],
    ['shotsOnTarget', t('matchstat.shots_on_target')],
    ['shotsInsideBox', t('matchstat.shots_inside_box')],
    ['shotsOutsideBox', t('matchstat.shots_outside_box')],
    ['corners', t('matchstat.corners')],
    ['offsides', t('matchstat.offsides')],
    ['fouls', t('matchstat.fouls')],
    ['yellowCards', t('match.yellow_cards')],
    ['redCards', t('match.red_cards')],
    ['gkSaves', t('matchstat.gk_saves')],
    ['passAccuracy', t('matchstat.pass_accuracy')],
    ['xg', t('matchstat.xg')],
  ];

  return (
    <div className={cn('rounded-card border border-hairline bg-surface p-4 sm:p-6', className)}>
      <div className="mb-5 flex items-center justify-between gap-2 text-sm">
        <span className="min-w-0 truncate font-semibold text-primary">{fixture.homeTeam?.name}</span>
        <span className="flex shrink-0 items-center gap-1.5 text-xs text-tertiary">
          {isLive && connected && (
            <span className={cn('h-1.5 w-1.5 rounded-pill', justUpdated ? 'bg-live' : 'bg-tertiary')} />
          )}
          {isLive && connected ? t('match.live_stats') : t('match.match_stats')}
        </span>
        <span className="min-w-0 truncate text-right font-semibold text-primary">{fixture.awayTeam?.name}</span>
      </div>

      {hasStats ? (
        <div className="space-y-5">
          {STAT_ROWS.map(([key, label]) => {
            const h = homeStat?.[key];
            const a = awayStat?.[key];
            if ((h == null || h === '') && (a == null || a === '')) return null;
            return <StatBar key={key} label={label} home={Number(h) || 0} away={Number(a) || 0} />;
          })}
        </div>
      ) : (
        <div className="space-y-5">
          <StatBar label={t('match.goals')} home={derived.goals[0]} away={derived.goals[1]} />
          <StatBar label={t('match.yellow_cards')} home={derived.yellow[0]} away={derived.yellow[1]} />
          <StatBar label={t('match.red_cards')} home={derived.red[0]} away={derived.red[1]} />
          <p className="mt-6 text-center text-xs text-tertiary">{t('match.stats_unpublished')}</p>
        </div>
      )}
    </div>
  );
};

export default MatchStats;
