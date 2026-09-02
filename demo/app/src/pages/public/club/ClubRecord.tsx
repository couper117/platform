import React from 'react';
import { useTranslation } from 'react-i18next';
import { Trophy } from 'lucide-react';
import { useClub } from './ClubLayout';
import EmptyState from '../../../components/ui/EmptyState';
import SectionHeading from '../../../components/ui/SectionHeading';
import cn from '../../../components/ui/cn';

/**
 * Wins & losses — a record derived by reducing over this team's COMPLETED
 * fixtures, comparing its own score to the opponent's. Nothing here is read off
 * a `record` object, because the API does not send one.
 *
 * The recent-form strip is the same derivation restated as a short sequence:
 * the result of each of the last five completed (and scored) fixtures, oldest
 * to newest, so the rightmost chip is the most recent result — the reading
 * order standings tables already use for a club's form.
 */

/** W / D / L for this team in one fixture, or null when there is no score to compare. */
const resultFor = (fixture: any, isTeamHome: (f: any) => boolean): 'W' | 'D' | 'L' | null => {
  const home = isTeamHome(fixture);
  const gf = home ? fixture.homeScore : fixture.awayScore;
  const ga = home ? fixture.awayScore : fixture.homeScore;
  if (gf == null || ga == null) return null;
  if (gf > ga) return 'W';
  if (gf < ga) return 'L';
  return 'D';
};

/**
 * No colour semantics here on purpose — this system reserves brand green for
 * the tab underline/hover/one primary button, and a loss is not a "danger"
 * state. Weight of ink is the only signal: a win reads darker than a loss.
 */
const FormChip = ({ result }: { result: 'W' | 'D' | 'L' }) => (
  <span
    className={cn(
      'flex h-7 w-7 shrink-0 items-center justify-center rounded-pill border border-hairline text-xs font-bold',
      result === 'W' ? 'bg-surface-2 text-primary' : result === 'D' ? 'text-secondary' : 'text-tertiary'
    )}
  >
    {result}
  </span>
);

const ClubRecord = () => {
  const { t } = useTranslation();
  const { completed, isTeamHome } = useClub();

  const scored = completed
    .map((f: any) => ({ fixture: f, result: resultFor(f, isTeamHome) }))
    .filter((row) => row.result !== null) as { fixture: any; result: 'W' | 'D' | 'L' }[];

  if (scored.length === 0) {
    return <EmptyState icon={Trophy} title={t('team.record_empty_title')} hint={t('team.record_empty_hint')} />;
  }

  const record = scored.reduce(
    (acc, { result }) => {
      if (result === 'W') return { ...acc, wins: acc.wins + 1 };
      if (result === 'L') return { ...acc, losses: acc.losses + 1 };
      return { ...acc, draws: acc.draws + 1 };
    },
    { wins: 0, draws: 0, losses: 0 }
  );

  const recentForm = [...scored]
    .sort((a, b) => new Date(a.fixture.matchDate).getTime() - new Date(b.fixture.matchDate).getTime())
    .slice(-5);

  return (
    <div className="flex flex-col gap-6">
      <section>
        <SectionHeading title={t('team.record_title')} className="mb-3" />
        <div className="grid grid-cols-3 gap-3 rounded-card border border-hairline bg-surface p-4 text-center">
          <div>
            <p className="text-2xl font-bold tabular-nums text-primary">{record.wins}</p>
            <p className="text-xs text-tertiary">{t('team.wins')}</p>
          </div>
          <div>
            <p className="text-2xl font-bold tabular-nums text-primary">{record.draws}</p>
            <p className="text-xs text-tertiary">{t('team.draws')}</p>
          </div>
          <div>
            <p className="text-2xl font-bold tabular-nums text-primary">{record.losses}</p>
            <p className="text-xs text-tertiary">{t('team.losses')}</p>
          </div>
        </div>
      </section>

      {recentForm.length > 0 && (
        <section>
          <SectionHeading title={t('team.recent_form')} className="mb-3" />
          <div className="flex items-center gap-2 rounded-card border border-hairline bg-surface p-4">
            {recentForm.map(({ fixture, result }) => (
              <FormChip key={fixture.id} result={result} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ClubRecord;
