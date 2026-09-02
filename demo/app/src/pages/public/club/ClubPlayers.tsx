import React from 'react';
import { useTranslation } from 'react-i18next';
import { Users } from 'lucide-react';
import { useClub } from './ClubLayout';
import Avatar from '../../../components/ui/Avatar';
import EmptyState from '../../../components/ui/EmptyState';

/** Players — the squad exactly as `team.players` sends it. Nothing derived. */
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
  );
};

export default ClubPlayers;
