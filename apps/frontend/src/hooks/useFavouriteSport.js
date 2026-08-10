import { useCallback, useEffect, useState } from 'react';

/**
 * The visitor's chosen sport, remembered across visits.
 *
 * PURELY CLIENT-SIDE, ON PURPOSE. This is a preference, not a record: it needs no
 * account, works on first visit before anyone has signed up, and requires no API
 * change. localStorage is the right home for it.
 *
 * THREE STATES, not two — the distinction matters:
 *   null        never asked. Show the chooser.
 *   '__all__'   asked, and they declined to pick. Never ask again, never redirect.
 *   '<slug>'    a sport. Land them there.
 *
 * Without the middle state, "no thanks" is indistinguishable from "not asked yet"
 * and the chooser would reappear on every single visit.
 */

const KEY = 'rnsp-fav-sport';
export const NO_PREFERENCE = '__all__';

/** Read once, defensively — a private-mode browser can throw on access. */
const read = () => {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
};

export default function useFavouriteSport() {
  const [value, setValue] = useState(read);

  // Keep tabs in sync: choosing a sport in one tab should not leave another tab
  // showing the chooser.
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === KEY) setValue(e.newValue);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const choose = useCallback((slug) => {
    try {
      localStorage.setItem(KEY, slug);
    } catch {
      /* preference is best-effort; never block the UI on storage */
    }
    setValue(slug);
  }, []);

  const clear = useCallback(() => {
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* noop */
    }
    setValue(null);
  }, []);

  return {
    /** The chosen sport slug, or null when none / no preference. */
    slug: value && value !== NO_PREFERENCE ? value : null,
    /** True once the visitor has answered, either way. */
    hasAnswered: value != null,
    /** True when they explicitly asked to see everything. */
    noPreference: value === NO_PREFERENCE,
    choose,
    skip: () => choose(NO_PREFERENCE),
    clear,
  };
}
