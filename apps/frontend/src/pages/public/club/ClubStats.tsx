import React from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart3 } from 'lucide-react';
import { useClub } from './ClubLayout';
import EmptyState from '../../../components/ui/EmptyState';
import SectionHeading from '../../../components/ui/SectionHeading';

/**
 * Stats — only what a fixture list can actually prove: matches played, goals
 * (or points) for and against, the difference, and a home/away split of the
 * same win/draw/loss record. Nothing here comes from a stats endpoint; there
 * isn't one. If a completed fixture has no score to compare, it is left out of
 * every total rather than counted as a 0–0.
 */

type Scored = { gf: number; ga: number; home: boolean; result: 'W' | 'D' | 'L' };

const scoreFor = (fixture: any, isTeamHome: (f: any) => boolean): Scored | null => {
  const home = isTeamHome(fixture);
  const gf = home ? fixture.homeScore : fixture.awayScore;
  const ga = home ? fixture.awayScore : fixture.homeScore;
  if (gf == null || ga == null) return null;
  return { gf, ga, home, result: gf > ga ? 'W' : gf < ga ? 'L' : 'D' };
};

const splitRecord = (rows: Scored[]) =>
  rows.reduce(
    (acc, { result }) => {
      if (result === 'W') return { ...acc, wins: acc.wins + 1 };
      if (result === 'L') return { ...acc, losses: acc.losses + 1 };
      return { ...acc, draws: acc.draws + 1 };
    },
    { wins: 0, draws: 0, losses: 0 }
  );

const StatTile = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="rounded-card border border-hairline bg-surface p-4 text-center">
    <p className="text-2xl font-bold tabular-nums text-primary">{value}</p>
    <p className="mt-1 text-xs text-tertiary">{label}</p>
  </div>
);

const SideRecord = ({
  title,
  record,
  labels,
}: {
  title: string;
  record: { wins: number; draws: number; losses: number };
  labels: { wins: string; draws: string; losses: string };
}) => (
  <div className="rounded-card border border-hairline bg-surface p-4">
    <p className="mb-3 text-sm font-semibold text-primary">{title}</p>
    <div className="grid grid-cols-3 gap-2 text-center">
      <div>
        <p className="text-lg font-bold tabular-nums text-primary">{record.wins}</p>
        <p className="text-xs text-tertiary">{labels.wins}</p>
      </div>
      <div>
        <p className="text-lg font-bold tabular-nums text-primary">{record.draws}</p>
        <p className="text-xs text-tertiary">{labels.draws}</p>
      </div>
      <div>
        <p className="text-lg font-bold tabular-nums text-primary">{record.losses}</p>
        <p className="text-xs text-tertiary">{labels.losses}</p>
      </div>
    </div>
  </div>
);

const ClubStats = () => {
  const { t } = useTranslation();
  const { completed, isTeamHome } = useClub();

  const scored = completed
    .map((f: any) => scoreFor(f, isTeamHome))
    .filter((row): row is Scored => row !== null);

  if (scored.length === 0) {
    return <EmptyState icon={BarChart3} title={t('team.stats_empty_title')} hint={t('team.stats_empty_hint')} />;
  }

  const goalsFor = scored.reduce((sum, row) => sum + row.gf, 0);
  const goalsAgainst = scored.reduce((sum, row) => sum + row.ga, 0);
  const goalDifference = goalsFor - goalsAgainst;

  const home = scored.filter((row) => row.home);
  const away = scored.filter((row) => !row.home);
  const recordLabels = { wins: t('team.wins'), draws: t('team.draws'), losses: t('team.losses') };

  return (
    <div className="flex flex-col gap-6">
      <section>
        <SectionHeading title={t('team.nav_stats')} className="mb-3" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label={t('team.stats_played')} value={scored.length} />
          <StatTile label={t('team.stats_for')} value={goalsFor} />
          <StatTile label={t('team.stats_against')} value={goalsAgainst} />
          <StatTile
            label={t('team.stats_difference')}
            value={goalDifference > 0 ? `+${goalDifference}` : goalDifference}
          />
        </div>
      </section>

      {(home.length > 0 || away.length > 0) && (
        <section>
          <SectionHeading title={t('team.stats_home_away')} className="mb-3" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {home.length > 0 && (
              <SideRecord title={t('team.stats_home')} record={splitRecord(home)} labels={recordLabels} />
            )}
            {away.length > 0 && (
              <SideRecord title={t('team.stats_away')} record={splitRecord(away)} labels={recordLabels} />
            )}
          </div>
        </section>
      )}
    </div>
  );
};

export default ClubStats;
