import React from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarDays } from 'lucide-react';
import { useClub } from './ClubLayout';
import MatchRow from '../../../components/match/MatchRow';
import EmptyState from '../../../components/ui/EmptyState';
import SectionHeading from '../../../components/ui/SectionHeading';

/**
 * Matches — this club's whole fixture list, upcoming and completed.
 *
 * `scheduled` and `completed` arrive ready-split from ClubLayout, which already
 * fetched this team's fixtures once. Upcoming sorts soonest-first (the next
 * kickoff leads); results sort most-recent-first — newest-relevant at the top
 * of each list, same ordering TeamDetailPage used.
 */
const ClubMatches = () => {
  const { t } = useTranslation();
  const { scheduled, completed } = useClub();

  const upcoming = [...scheduled].sort(
    (a: any, b: any) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime()
  );
  const results = [...completed].sort(
    (a: any, b: any) => new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime()
  );

  if (upcoming.length === 0 && results.length === 0) {
    return <EmptyState icon={CalendarDays} title={t('team.no_fixtures_title')} hint={t('team.no_fixtures_hint')} />;
  }

  return (
    <div className="flex flex-col gap-6">
      {upcoming.length > 0 && (
        <section>
          <SectionHeading title={t('team.upcoming_fixtures')} className="mb-3" />
          <div className="overflow-hidden rounded-card border border-hairline bg-surface">
            {upcoming.map((f: any) => (
              <MatchRow key={f.id} fixture={f} showDate />
            ))}
          </div>
        </section>
      )}

      {results.length > 0 && (
        <section>
          <SectionHeading title={t('team.recent_results')} className="mb-3" />
          <div className="overflow-hidden rounded-card border border-hairline bg-surface">
            {results.map((f: any) => (
              <MatchRow key={f.id} fixture={f} showDate />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ClubMatches;
