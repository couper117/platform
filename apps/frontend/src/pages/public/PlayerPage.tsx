import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { getPlayer } from '../../api/endpoints/players';
import PlayerProfile from '../../components/player/PlayerProfile';
import Seo from '../../components/shared/Seo';
import ClubCrest from '../../components/ui/ClubCrest';
import ErrorState from '../../components/ui/ErrorState';
import Skeleton from '../../components/ui/Skeleton';
import PageAd from '../../components/shared/PageAd';

/**
 * A club player's page: /players/:id.
 *
 * The whole of the presentation lives in PlayerProfile, which the Amashuri athlete
 * page also renders. This file is the fetch, the club-specific chrome (where back
 * goes, the crest under the name) and the loading and error states.
 */
const PlayerPage = () => {
  const { t } = useTranslation();
  const { id } = useParams();

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ['player', String(id)],
    queryFn: () => getPlayer(id),
    enabled: !!id,
  });

  const player = data?.data ?? data ?? null;

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

  if (isError || !player) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 lg:px-6">
        <ErrorState title={t('player.not_found')} hint={t('player.not_found_hint')} onRetry={refetch} />
      </div>
    );
  }

  return (
    <>
      <Seo
        title={player.fullName}
        description={t('player.seo', { name: player.fullName, team: player.team?.name })}
      />
      <PlayerProfile
        player={player}
        backTo={player.team?.id ? `/teams/${player.team.id}/players` : undefined}
        backLabel={player.team?.name}
        affiliation={player.team?.id && (
          <Link
            to={`/teams/${player.team.id}`}
            className="mt-2 inline-flex max-w-full items-center gap-2 text-sm font-semibold text-primary transition-opacity duration-150 ease-standard hover:opacity-70"
          >
            <ClubCrest team={player.team} size="sm" />
            <span className="truncate">{player.team.name}</span>
          </Link>
        )}
      />
      {/* Advertising sits at the FOOT of the page, after the content, never
          spliced into it. An advert dropped between two fixtures or two
          paragraphs interrupts the thing the reader came for; down here it is
          the last item on the screen and costs the page nothing. AdSlot
          collapses to nothing when the position has no inventory. */}
      <div className="mx-auto max-w-3xl px-4 pb-8 lg:max-w-6xl lg:px-6 lg:pb-12">
        <PageAd position="player" />
      </div>
    </>
  );
};

export default PlayerPage;
