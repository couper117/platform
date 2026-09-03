import React from 'react';
import { Link } from 'react-router-dom';
import { ClubCrest, Skeleton } from '../ui';
import useMyTeam from '../../hooks/useMyTeam';

/**
 * The club, at the top of its own sidebar.
 *
 * WHAT IT REPLACED. A generic shield and the words "Club portal" — which tells a
 * coach the one thing they already know, in the most valuable space on the
 * screen. Every other portal's rail names the ORGANISATION it belongs to (the
 * Ministry, a federation, a league); the club's named the software.
 *
 * So it is the crest and the club's name, with the competition underneath. It
 * also does a second job the label could not: a manager who runs more than one
 * account can see at a glance WHICH club they are signed into before they file a
 * team sheet against the wrong one.
 *
 * IT IS A COMPONENT, NOT A BRANCH INSIDE `Sidebar`, for the same reason the
 * footer is: it needs `/teams/my`, and calling that hook inside Sidebar would
 * fire the request for admins and reporters too — who get a 404, because they do
 * not manage a club. The query is already in flight elsewhere in this portal, so
 * react-query serves it from cache.
 */
const TeamSidebarIdentity = ({ onNavigate }: { onNavigate?: () => void }) => {
  const { data: team, isLoading } = useMyTeam();

  if (isLoading) {
    return (
      <div className="flex min-w-0 items-center gap-2.5">
        <Skeleton className="h-9 w-9 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1 space-y-1.5">
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-2.5 w-20" />
        </div>
      </div>
    );
  }

  // No club on the account — a manager whose club was deactivated. The portal
  // still loads and says so on the dashboard; this just does not pretend.
  if (!team) {
    return (
      <div className="flex min-w-0 items-center gap-2.5">
        <ClubCrest size="md" className="h-9 w-9 shrink-0" />
        <p className="truncate font-display text-sm font-bold text-primary">No club</p>
      </div>
    );
  }

  // The competition is more use than the sport — a coach knows what they coach —
  // and the sport is the honest fallback where no league has been entered yet.
  const league = team.leagues?.[0]?.league?.name;
  const sub = league || team.sport?.name || null;

  return (
    <Link
      to="/team/profile"
      onClick={onNavigate}
      className="flex min-w-0 items-center gap-2.5"
      title={team.name}
    >
      <ClubCrest team={team} size="md" className="h-9 w-9 shrink-0" />
      <span className="min-w-0 leading-tight">
        <span className="block truncate font-display text-sm font-bold text-primary">{team.name}</span>
        {sub && <span className="block truncate text-xs text-tertiary">{sub}</span>}
      </span>
    </Link>
  );
};

export default TeamSidebarIdentity;
