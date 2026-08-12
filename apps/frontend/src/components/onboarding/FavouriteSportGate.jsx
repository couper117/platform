import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import useFavouriteSport from '../../hooks/useFavouriteSport';
import { getSports } from '../../api/endpoints/sports';
import SportChooser from './SportChooser';

/**
 * Wraps the landing route. Decides, on `/` only, between three outcomes:
 *
 *   never asked         → render the landing page with the chooser over it
 *   chose a sport       → redirect straight to that sport's hub
 *   chose "everything"  → render the landing page, and never ask again
 *
 * ONLY `/` IS GATED. A visitor arriving on a shared link to a match or a league is
 * there for that thing; interrupting them with a preference dialog would be
 * hostile, and silently redirecting them away from the link they clicked would be
 * worse. The prompt belongs on the front door, not on every door.
 *
 * THE STORED SLUG IS VALIDATED before redirecting. A sport can be renamed or
 * deactivated after someone picks it, and a blind redirect would then send them to
 * a dead hub on every visit with no obvious way out. If the slug no longer matches
 * a live sport the preference is cleared and the chooser returns.
 *
 * The route path is untouched — this wraps the element only.
 */
const FavouriteSportGate = ({ children }) => {
  const { slug, hasAnswered, choose, skip, clear } = useFavouriteSport();
  const navigate = useNavigate();

  // Same key as the header and the chooser, so this is usually already cached.
  const { data: sportsRes, isPending } = useQuery({
    queryKey: ['nav-sports'],
    queryFn: getSports,
    staleTime: 300000,
    enabled: !!slug,
  });

  if (slug) {
    // Wait for the sports list before acting, otherwise a slow network would show
    // the landing page and then yank it away.
    if (isPending) return children;

    const live = (sportsRes?.data ?? []).some((s) => s.slug === slug);
    if (live) return <Navigate to={`/sports/${slug}`} replace />;

    // Stale preference — drop it and fall through to the chooser.
    clear();
    return children;
  }

  return (
    <>
      {children}
      <SportChooser
        // The redesigned landing is the front door — show it directly rather than
        // popping the chooser over it. The favourite-sport preference still drives
        // the redirect above when one is already set.
        open={false}
        onSkip={skip}
        onChoose={(chosen) => {
          choose(chosen);
          navigate(`/sports/${chosen}`);
        }}
      />
    </>
  );
};

export default FavouriteSportGate;
