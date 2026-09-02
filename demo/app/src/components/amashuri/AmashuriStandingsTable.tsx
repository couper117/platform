import React from 'react';
import { useTranslation } from 'react-i18next';
import ClubCrest from '../ui/ClubCrest';
import Skeleton from '../ui/Skeleton';

/**
 * Standings table for Amashuri Games (AkcStanding model: gf/ga, team -> school).
 *
 * A full table, not the sidebar-rail's collapsed row list (see
 * components/match/StandingsTable, which trims to pos/played/GD/Pts behind an
 * expand toggle for a 320px rail). This IS the primary content of
 * /amashuri/standings, so every column stays visible. It scrolls inside its
 * own container; the page never does.
 *
 * Loading / empty / error are the caller's job (AkcStandingsPage), same
 * division of responsibility SportStandings.tsx uses with StandingsTable.
 */
const AmashuriStandingsTable = ({ standings = [] }: { standings?: any[] }) => {
  const { t } = useTranslation();

  return (
    <div className="overflow-hidden rounded-card border border-hairline bg-surface">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-left">
          <thead>
            <tr className="bg-surface-2 text-xs font-semibold text-tertiary">
              <th className="w-10 px-3 py-3 text-center" title={t('standings.col_pos_full')}>{t('standings.col_pos')}</th>
              <th className="sticky left-0 z-10 bg-surface-2 px-3 py-3">{t('amashuri.school')}</th>
              <th className="px-3 py-3 text-center" title={t('standings.col_played_full')}>{t('standings.col_played')}</th>
              <th className="px-3 py-3 text-center" title={t('standings.col_won_full')}>{t('standings.col_won')}</th>
              <th className="px-3 py-3 text-center" title={t('standings.col_drawn_full')}>{t('standings.col_drawn')}</th>
              <th className="px-3 py-3 text-center" title={t('standings.col_lost_full')}>{t('standings.col_lost')}</th>
              <th className="hidden px-3 py-3 text-center sm:table-cell" title={t('standings.col_gf_full')}>{t('standings.col_gf')}</th>
              <th className="hidden px-3 py-3 text-center sm:table-cell" title={t('standings.col_ga_full')}>{t('standings.col_ga')}</th>
              <th className="px-3 py-3 text-center" title={t('standings.col_gd_full')}>{t('standings.col_gd')}</th>
              <th className="px-3 py-3 text-center" title={t('standings.col_points_full')}>{t('standings.col_points')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {standings.map((s: any, index: number) => {
              const school = s.team?.school;
              const name = school?.name || t('standings.team_fallback', { id: s.teamId });
              return (
                <tr key={s.id} className="group transition-colors duration-150 ease-standard hover:bg-surface-2">
                  <td className="px-3 py-3 text-center text-sm tabular-nums text-tertiary">{index + 1}</td>
                  <td className="sticky left-0 z-10 bg-surface px-3 py-3 transition-colors duration-150 ease-standard group-hover:bg-surface-2">
                    <div className="flex items-center gap-2.5">
                      <ClubCrest team={school} size="sm" />
                      <span className="whitespace-nowrap text-sm font-semibold text-primary">{name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center text-sm text-secondary">{s.played ?? 0}</td>
                  <td className="px-3 py-3 text-center text-sm text-secondary">{s.won ?? 0}</td>
                  <td className="px-3 py-3 text-center text-sm text-secondary">{s.drawn ?? 0}</td>
                  <td className="px-3 py-3 text-center text-sm text-secondary">{s.lost ?? 0}</td>
                  <td className="hidden px-3 py-3 text-center text-sm text-tertiary sm:table-cell">{s.gf ?? 0}</td>
                  <td className="hidden px-3 py-3 text-center text-sm text-tertiary sm:table-cell">{s.ga ?? 0}</td>
                  <td className="px-3 py-3 text-center text-sm font-medium text-secondary">{(s.gf ?? 0) - (s.ga ?? 0)}</td>
                  <td className="px-3 py-3 text-center text-sm font-semibold tabular-nums text-primary">{s.points ?? 0}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

AmashuriStandingsTable.Skeleton = function AmashuriStandingsTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-card border border-hairline bg-surface">
      <div className="flex items-center gap-3 border-b border-hairline px-3 py-3">
        <Skeleton className="h-3 w-6" />
        <Skeleton className="h-3 flex-1" />
        <Skeleton className="h-3 w-8" />
        <Skeleton className="h-3 w-8" />
        <Skeleton className="h-3 w-8" />
      </div>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 border-b border-hairline px-3 py-3 last:border-0">
          <Skeleton className="h-3 w-4" />
          <Skeleton className="h-6 w-6" />
          <Skeleton className="h-3 flex-1" />
          <Skeleton className="h-3 w-6" />
          <Skeleton className="h-3 w-6" />
          <Skeleton className="h-3 w-6" />
        </div>
      ))}
    </div>
  );
};

export default AmashuriStandingsTable;
