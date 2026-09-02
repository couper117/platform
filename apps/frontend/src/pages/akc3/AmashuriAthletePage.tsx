import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { getAkcAthlete } from '../../api/endpoints/amashuri';
import { useEnumLabel } from '../../i18n/enums';
import PlayerProfile from '../../components/player/PlayerProfile';
import Seo from '../../components/shared/Seo';
import ClubCrest from '../../components/ui/ClubCrest';
import ErrorState from '../../components/ui/ErrorState';
import Skeleton from '../../components/ui/Skeleton';

/**
 * A school athlete's page: /amashuri/athletes/:id.
 *
 * Same component as a club player — see PlayerProfile — with a school crest under
 * the name instead of a club one, "back" pointing at their team rather than a
 * squad tab, and the one row a schools competition has that a league does not:
 * whether the athlete's eligibility document has been verified. Age is the whole
 * point of an age-group competition, so it stays where PlayerProfile puts it.
 */
const AmashuriAthletePage = () => {
  const { t } = useTranslation();
  const enumLabel = useEnumLabel();
  const { id } = useParams();

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ['akc-athlete', String(id)],
    queryFn: () => getAkcAthlete(id),
    enabled: !!id,
  });

  const athlete = data?.data ?? data ?? null;

  if (isPending) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-4 lg:max-w-5xl lg:px-6 lg:py-6">
        <Skeleton className="h-28 rounded-card" />
        <div className="grid grid-cols-3 gap-3">
          <Skeleton className="h-20 rounded-card" />
          <Skeleton className="h-20 rounded-card" />
          <Skeleton className="h-20 rounded-card" />
        </div>
        <Skeleton className="h-48 rounded-card" />
      </div>
    );
  }

  if (isError || !athlete) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 lg:px-6">
        <ErrorState title={t('player.not_found')} hint={t('player.not_found_hint')} onRetry={refetch} />
      </div>
    );
  }

  const teamLabel = `${enumLabel('gender', athlete.team?.gender)} ${t('amashuri.school_profile.team')}`;

  return (
    <div className="min-h-screen bg-page">
      <Seo
        title={athlete.fullName}
        description={t('player.seo', { name: athlete.fullName, team: athlete.school?.name })}
      />
      <PlayerProfile
        player={athlete}
        backTo={athlete.teamId ? `/amashuri/teams/${athlete.teamId}` : undefined}
        backLabel={teamLabel}
        matchBase="/amashuri/matches"
        affiliation={athlete.school?.id && (
          <Link
            to={`/amashuri/schools/${athlete.school.id}`}
            className="mt-2 inline-flex max-w-full items-center gap-2 text-sm font-semibold text-primary transition-opacity duration-150 ease-standard hover:opacity-70"
          >
            <ClubCrest team={athlete.school} size="sm" />
            <span className="truncate">{athlete.school.name}</span>
          </Link>
        )}
        extraRows={
          <>
            {athlete.team?.ageCategory && (
              <div className="flex items-center justify-between gap-3 border-b border-hairline px-3 py-2.5 last:border-0">
                <span className="text-sm text-secondary">{t('amashuri.athlete.age_group')}</span>
                <span className="text-sm font-semibold text-primary">{enumLabel('age_category', athlete.team.ageCategory)}</span>
              </div>
            )}
            <div className="flex items-center justify-between gap-3 border-b border-hairline px-3 py-2.5 last:border-0">
              <span className="text-sm text-secondary">{t('amashuri.athlete.eligibility')}</span>
              <span className={athlete.docVerified ? 'text-sm font-semibold text-brand-text' : 'text-sm font-semibold text-secondary'}>
                {t(athlete.docVerified ? 'amashuri.athlete.verified' : 'amashuri.athlete.pending')}
              </span>
            </div>
          </>
        }
      />
    </div>
  );
};

export default AmashuriAthletePage;
