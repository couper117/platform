import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Radio, AlertTriangle, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import useMyTeam, { useTeamFixtures } from '../../hooks/useMyTeam';
import { opponentOf, homeOrAway, timeUntil, sheetFor } from '../../lib/coachMatch';
import cn from '../ui/cn';

/**
 * What a coach checks without meaning to: the next match, and whether we have
 * filed for it.
 *
 * The rail used to end in the season, a link to the public club page and a
 * "need help?" card — none of which answers a question anybody had. This is the
 * club's equivalent of the reporter footer's "am I free, where am I next", and
 * the missing-sheet warning is the one nag the portal is entitled to make,
 * because it is the club's single obligation to everyone else on the platform.
 *
 * Both queries are already in flight elsewhere in the portal, so react-query
 * serves this from cache rather than spending a second request on a phone.
 */
const TeamSidebarFooter = ({ onNavigate }: { onNavigate?: () => void }) => {
  const { t } = useTranslation();
  const { data: team } = useMyTeam();
  const { live, scheduled } = useTeamFixtures(team?.id);

  const next = live[0] || scheduled[0] || null;
  // A list row carries no `lineups`, so this can only tell "filed" from "not" —
  // never who filed it. The copy stays on the side it can prove.
  const filed = next ? sheetFor(next, team?.id).filed : false;
  const opponent = next ? opponentOf(next, team?.id) : null;

  return (
    <div className="space-y-3 border-t border-hairline p-4">
      <div className="rounded-card border border-hairline bg-surface-2 p-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-tertiary">
          {t('portal.club_next_match')}
        </p>
        {next ? (
          <>
            <Link
              to={`/team/match/${next.id}`}
              onClick={onNavigate}
              className="group mt-1 flex items-start gap-2"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-primary">
                  v {opponent?.shortName || opponent?.name || '—'}
                  <span className="ml-1 text-xs font-normal text-tertiary">
                    ({homeOrAway(next, team?.id)})
                  </span>
                </span>
                <span className="mt-0.5 block truncate text-xs tabular-nums text-tertiary">
                  {next.status === 'LIVE' ? (
                    <span className="inline-flex items-center gap-1 font-semibold text-live">
                      <Radio size={11} aria-hidden="true" /> Live now
                    </span>
                  ) : next.matchDate ? (
                    `${format(new Date(next.matchDate), 'EEE d MMM, HH:mm')} · ${timeUntil(next.matchDate)}`
                  ) : (
                    'Date to be confirmed'
                  )}
                </span>
              </span>
              <ChevronRight
                size={14}
                className="mt-0.5 shrink-0 text-tertiary transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>

            {!filed && next.status === 'SCHEDULED' && (
              <Link
                to={`/team/formation?fixture=${next.id}`}
                onClick={onNavigate}
                className={cn(
                  'mt-2 flex min-h-tap items-center gap-1.5 rounded-control border border-live/40 px-2.5',
                  'text-xs font-semibold text-live transition-colors duration-150 ease-standard hover:bg-live/10'
                )}
              >
                <AlertTriangle size={12} className="shrink-0" aria-hidden="true" />
                No team sheet yet — file it
              </Link>
            )}
          </>
        ) : (
          <p className="mt-1 text-sm text-tertiary">{t('portal.club_no_next')}</p>
        )}
      </div>

      {team?.id && (
        <Link
          to={`/teams/${team.id}`}
          onClick={onNavigate}
          className="flex min-h-tap items-center justify-center gap-2 rounded-control border border-hairline bg-surface-2 px-3 text-sm font-semibold text-primary transition-colors duration-150 ease-standard hover:bg-surface-3"
        >
          {t('portal.view_team_page')} <ExternalLink size={13} aria-hidden="true" />
        </Link>
      )}
    </div>
  );
};

export default TeamSidebarFooter;
