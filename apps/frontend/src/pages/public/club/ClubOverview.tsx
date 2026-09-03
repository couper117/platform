import React from 'react';
import { useTranslation } from 'react-i18next';
import { Info } from 'lucide-react';
import { useClub } from './ClubLayout';
import MatchRow from '../../../components/match/MatchRow';
import { CompetitionHeader } from '../../../components/match/MatchGroup';
import Avatar from '../../../components/ui/Avatar';
import EmptyState from '../../../components/ui/EmptyState';
import SectionHeading from '../../../components/ui/SectionHeading';
import UpcomingGames from '../../../components/club/UpcomingGames';

/**
 * Team — the index tab. A snapshot, not a repeat of the other four tabs: the
 * season record, the next fixture, the last result, and a handful of the squad,
 * each with a way through to the tab that has the rest.
 */

const ClubOverview = () => {
  const { t } = useTranslation();
  const { team, teamId, completed, scheduled, isTeamHome } = useClub();

  const record = completed.reduce(
    (acc: any, f: any) => {
      const home = isTeamHome(f);
      const gf = home ? f.homeScore : f.awayScore;
      const ga = home ? f.awayScore : f.homeScore;
      if (gf == null || ga == null) return acc;
      if (gf > ga) return { ...acc, wins: acc.wins + 1 };
      if (gf < ga) return { ...acc, losses: acc.losses + 1 };
      return { ...acc, draws: acc.draws + 1 };
    },
    { wins: 0, draws: 0, losses: 0 }
  );
  const hasRecord = record.wins + record.draws + record.losses > 0;

  const nextFixture = [...scheduled].sort(
    (a: any, b: any) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime()
  )[0];
  const lastResult = [...completed].sort(
    (a: any, b: any) => new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime()
  )[0];

  const players = (team.players || []).slice(0, 6);
  const base = `/teams/${teamId}`;
  const hasContent = hasRecord || !!nextFixture || !!lastResult || players.length > 0;

  if (!hasContent) {
    return <EmptyState icon={Info} title={t('team.overview_empty_title')} hint={t('team.overview_empty_hint')} />;
  }

  // Soonest first, and only what is actually still to come.
  const upcoming = [...scheduled]
    .filter((f: any) => f.matchDate)
    .sort((a: any, b: any) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime())
    .slice(0, 10);

  return (
    <div className="flex flex-col gap-8">
      {/* The next matches lead, the way they do on a club's own site — it is what
          most visitors came to check. */}
      <UpcomingGames fixtures={upcoming} teamId={teamId} seeAllTo={`${base}/matches`} />

      {hasRecord && (
        <section>
          <SectionHeading
            title={t('team.record_title')}
            action={t('team.view_record')}
            actionTo={`${base}/record`}
            className="mb-3"
          />
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
      )}

      {(nextFixture || lastResult) && (
        <section>
          <SectionHeading
            title={t('team.nav_matches')}
            action={t('team.view_all_matches')}
            actionTo={`${base}/matches`}
            className="mb-3"
          />
          <div className="overflow-hidden rounded-card border border-hairline bg-surface">
            {nextFixture && (
              <>
                <CompetitionHeader name={t('team.next_match')} className="bg-surface-2" />
                <MatchRow fixture={nextFixture} showDate />
              </>
            )}
            {lastResult && (
              <>
                <CompetitionHeader
                  name={t('team.last_result')}
                  className={nextFixture ? 'border-t border-hairline bg-surface-2' : 'bg-surface-2'}
                />
                <MatchRow fixture={lastResult} showDate />
              </>
            )}
          </div>
        </section>
      )}

      {players.length > 0 && (
        <section>
          <SectionHeading
            title={t('team.squad')}
            action={t('team.view_full_squad')}
            actionTo={`${base}/players`}
            className="mb-3"
          />
          <div className="overflow-hidden rounded-card border border-hairline bg-surface">
            {players.map((p: any) => (
              <div key={p.id} className="flex items-center gap-3 border-b border-hairline px-3 py-2.5 last:border-0">
                <Avatar src={p.photo} name={p.fullName} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-primary">{p.fullName}</p>
                  {p.position && <p className="truncate text-xs text-tertiary">{p.position}</p>}
                </div>
                {typeof p.jerseyNumber === 'number' && (
                  <span className="shrink-0 text-sm tabular-nums text-secondary">
                    {t('team.jersey_no', { number: p.jerseyNumber })}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ClubOverview;
