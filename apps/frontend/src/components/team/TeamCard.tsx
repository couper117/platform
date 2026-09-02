import React from 'react';
import FollowButton from '../shared/FollowButton';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEnumLabel } from '../../i18n/enums';
import ClubCrest from '../ui/ClubCrest';
import Badge from '../ui/Badge';
import Skeleton from '../ui/Skeleton';
import SportIcon from '../shared/SportIcon';
import cn from '../ui/cn';

/**
 * NO "VIEW CLUB" FOOTER.
 *
 * The whole card is already a link, so a footer row repeating "View club" was a
 * third zone of chrome per item that said nothing — and in a 36-club directory it
 * cost ~90px each. At one column on a phone that made the page 14,700px tall.
 * The card is now two zones and the grid starts at two columns, which is what a
 * directory of crests wants.
 */
/**
 * Club directory card — /teams.
 *
 * THE PROBLEM THIS REPLACES
 * The old row was crest + name + city (or, when city was missing, the sport
 * name stood in for it) — so a club's sport only ever showed up as a last
 * resort. "APR FC", "APR BBC", "APR VC" and "APR Handball" read as the same
 * card four times over, and the four "… Athletics Club" entries were only
 * told apart by reading their full names. A club's sport is as identifying
 * as its name; it belongs on the card every time, not opportunistically.
 *
 * ANATOMY
 *   [ crest (large)                     sport badge ]
 *   [ club name                                      ]
 *   [ sport · city · founded year                     ]
 *   [ view club                                chevron]
 *
 * The sport shows twice on purpose: as a badge next to the crest (fastest
 * way to scan a grid of 36 cards) and again in the meta line in words. Same
 * card shell as LeagueCard (header/body + a footer strip) so the grid stops
 * reading as one flat, repetitive column of low rows.
 */

type TeamCardProps = { team: any };

const TeamCard = ({ team }: TeamCardProps) => {
  const { t } = useTranslation();
  const enumLabel = useEnumLabel();
  const slug = team.sport?.slug;
  const sportLabel = team.sport?.name ? enumLabel('sport', team.sport.name) : '';

  /**
   * Sport and place, and nothing else.
   *
   * The founding year was here too, which made every meta line longer than the
   * card is wide — so all 36 truncated to "Football · Kigali · Found…", and the
   * one part that was cut off was the part carrying information. The year is on
   * the club's own page, where there is room for it.
   */
  const meta = [sportLabel, team.city].filter(Boolean).join(' · ');

  return (
    <Link
      to={`/teams/${team.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-card border border-hairline bg-surface transition-colors duration-150 ease-standard hover:border-brand/40 hover:bg-surface-2"
    >
      <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-2">
          <ClubCrest team={team} size="lg" className="h-14 w-14 text-base" />
          {sportLabel && (
            <Badge className="shrink-0 gap-1">
              <SportIcon slug={slug} size={11} />
              {sportLabel}
            </Badge>
          )}
        </div>

        <div className="min-w-0">
          <h3 className="line-clamp-2 font-display text-base font-bold leading-snug text-primary group-hover:text-brand-text sm:text-lg">
            {team.name}
          </h3>
          {meta && <p className="mt-1 truncate text-xs text-tertiary">{meta}</p>}
        </div>
      </div>

      {/* Following works without an account, so this sits on the public card
          rather than behind a sign-in. Inside the link but not part of it: the
          button stops the click propagating, so following never navigates away
          to the club page. */}
      <div className="border-t border-hairline px-4 py-3 sm:px-5">
        <FollowButton teamId={team.id} size="sm" />
      </div>
    </Link>
  );
};

/** Next to the component so it can never drift from the real card's metrics. */
TeamCard.Skeleton = function TeamCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex h-full flex-col overflow-hidden rounded-card border border-hairline bg-surface', className)}>
      <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-2">
          <Skeleton className="h-14 w-14 rounded-control" />
          <Skeleton className="h-5 w-16" />
        </div>
        <div>
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="mt-2 h-3 w-1/2" />
        </div>
      </div>
      <div className="border-t border-hairline px-4 py-3 sm:px-5">
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
};

export default TeamCard;
