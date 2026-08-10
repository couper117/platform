import { useEffect, useState } from 'react';

/**
 * Subscribe to a media query.
 *
 * Exists so a desktop-only panel can gate its QUERY, not just its rendering.
 * Hiding a component with `hidden lg:block` still mounts it, so its useQuery would
 * fire on every phone and spend mobile data fetching a card nobody can see.
 *
 * @param {string} query e.g. '(min-width: 1024px)'
 */
export default function useMediaQuery(query) {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = (e) => setMatches(e.matches);
    // Re-read on mount: the query may have changed between render and effect.
    setMatches(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

/** The lg breakpoint — where /fixtures becomes two columns. */
export const useIsDesktop = () => useMediaQuery('(min-width: 1024px)');
