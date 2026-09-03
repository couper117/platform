import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';
import { getTeam } from '../../api/endpoints/teams';
import { readableOn, shade } from '../../utils/color';

/**
 * The rest of the squad, at the foot of a player's page.
 *
 * A player is only interesting next to the people they play with, and the club
 * page is one more click than anyone makes. `/teams/:id` already returns the squad
 * publicly (redacted), so this costs one request and no new endpoint.
 *
 * The player whose page this is drops out of the list — a link to the page you are
 * already on is furniture.
 */
const SquadSection = ({ team, currentPlayerId }: { team: any; currentPlayerId: number }) => {
  const { t } = useTranslation();

  const { data } = useQuery({
    queryKey: ['team-squad', String(team?.id)],
    queryFn: () => getTeam(team.id),
    enabled: !!team?.id,
  });

  const squad = ((data as any)?.data?.players ?? [])
    .filter((p: any) => p.id !== currentPlayerId && p.active !== false)
    .sort((a: any, b: any) => (a.jerseyNumber ?? 999) - (b.jerseyNumber ?? 999));

  if (squad.length === 0) return null;

  const brand = team.primaryColor || '#14161A';

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold text-primary">{t('player.teammates')}</h2>
        <Link
          to={`/teams/${team.id}/players`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-secondary transition-colors duration-150 ease-standard hover:text-brand-text"
        >
          {t('player.full_squad')}
          <ArrowRight size={13} aria-hidden="true" />
        </Link>
      </div>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {squad.map((p: any) => (
          <li key={p.id}>
            <Link
              to={`/players/${p.id}`}
              className="flex items-center gap-3 rounded-card border border-hairline bg-surface p-3 transition-colors duration-150 ease-standard hover:border-brand/40 hover:bg-surface-2"
            >
              {/* The squad number in the club's colour — on a team sheet the
                  number identifies a player faster than their face does. */}
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control font-display text-sm font-bold tabular-nums"
                style={{ background: shade(brand, 0.86), color: shade(brand, -0.1) }}
              >
                {p.jerseyNumber ?? '—'}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-primary">{p.fullName}</p>
                {p.position && <p className="truncate text-xs text-tertiary">{p.position}</p>}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default SquadSection;
