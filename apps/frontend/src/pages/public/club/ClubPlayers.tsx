import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Users } from 'lucide-react';
import { useClub } from './ClubLayout';
import Avatar from '../../../components/ui/Avatar';
import EmptyState from '../../../components/ui/EmptyState';

/**
 * Players — the squad exactly as `team.players` sends it. Nothing derived.
 *
 * EVERY ROW IS A LINK. The squad was a dead list: a name, a position and a shirt
 * number with nowhere to go, when the player is the thing a fan actually wants to
 * open. `/players/:id` carries the season in that player's own sport.
 */
const ClubPlayers = () => {
  const { t } = useTranslation();
  const { team } = useClub();
  const players = team.players || [];

  if (players.length === 0) {
    return <EmptyState icon={Users} title={t('team.players_empty_title')} hint={t('team.players_empty_hint')} />;
  }

  return (
    <div className="overflow-hidden rounded-card border border-hairline bg-surface">
      {players.map((p: any) => (
        <Link
          key={p.id}
          to={`/players/${p.id}`}
          className="flex min-h-tap items-center gap-3 border-b border-hairline px-3 py-2.5 transition-colors duration-150 ease-standard last:border-0 hover:bg-surface-2"
        >
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
          <ChevronRight size={16} className="shrink-0 text-disabled" aria-hidden="true" />
        </Link>
      ))}
    </div>
  );
};

export default ClubPlayers;
