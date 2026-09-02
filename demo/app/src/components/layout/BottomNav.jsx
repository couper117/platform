import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Compass, CalendarDays, Trophy, Newspaper, Medal } from 'lucide-react';
import { useMotionSafe, DUR, EASE } from '../../lib/motion';
import cn from '../ui/cn';

/**
 * Bottom tab bar — the primary navigation on mobile.
 *
 * Replaces a sticky top navbar that carried a horizontal sports rail, a centre
 * logo, a search button, a theme toggle, a language menu, auth actions and a
 * hamburger opening a full-height drawer. That bar cost 68px at the top of every
 * screen and put every destination two taps away behind the drawer.
 *
 * FOUR DESTINATIONS, NO "MORE"
 * Home, Matches, Leagues, News. A "More" bucket is where navigation goes to die —
 * anything worth reaching is worth naming. Account lives behind the header
 * avatar, which is where people look for it, and search is the header's job.
 *
 * 56px plus env(safe-area-inset-bottom) so it clears the iOS home indicator in
 * installed mode. Each tab is the full 56px tall and a quarter of the width, so
 * every target comfortably exceeds 44px.
 *
 * Active state is a 2px top bar — a single-sided accent, which the system
 * specifies at radius 0 — plus a colour change. No pill, no background blob.
 */

// Five destinations — Live is promoted here because live sport is a core purpose
// of the platform and must be one thumb-tap away.
/**
 * The first five destinations of the app's one navigation list, in its order.
 *
 * NO LIVE TAB. Live and Matches are the same screen with a different tab selected
 * — /live IS the fixture list filtered to in-play — so carrying both put the same
 * destination in the bar twice and left a phone with a nav the desktop bar did not
 * have. The desktop bar dropped Live for this reason; the tab bar now matches.
 * In-play matches are one tap away on the Matches screen, where Upcoming, Live and
 * Results sit side by side.
 */
const TABS = [
  { to: '/', labelKey: 'nav.explore', icon: Compass, end: true },
  { to: '/fixtures', labelKey: 'nav.matches', icon: CalendarDays },
  { to: '/sports', labelKey: 'nav.sports', icon: Medal },
  { to: '/leagues', labelKey: 'nav.leagues', icon: Trophy },
  { to: '/news', labelKey: 'nav.news', icon: Newspaper },
];

const BottomNav = () => {
  const safe = useMotionSafe();
  const { t } = useTranslation();
  return (
  <nav
    aria-label="Main"
    className={cn(
      'fixed inset-x-0 bottom-0 z-50 md:hidden',
      'border-t border-hairline bg-surface/95 shadow-nav backdrop-blur-nav',
      // The safe-area inset is padding, so the 56px row is never squeezed by it.
      'pb-[env(safe-area-inset-bottom)]'
    )}
  >
    <ul className="flex h-rail items-stretch">
      {TABS.map(({ to, labelKey, icon: Icon, end }) => (
        <li key={to} className="flex-1">
          <NavLink
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'relative flex h-full flex-col items-center justify-center gap-0.5',
                'transition-colors duration-150 ease-standard',
                isActive ? 'text-brand-text' : 'text-tertiary'
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  // A shared layoutId slides the indicator between tabs instead of
                  // blinking out and in, so the bar reads as one object moving —
                  // which is what tells you the two tabs are the same control.
                  <motion.span
                    layoutId={safe ? 'bottom-nav-indicator' : undefined}
                    aria-hidden="true"
                    transition={{ duration: DUR.base, ease: EASE }}
                    className="absolute inset-x-0 top-0 h-0.5 bg-brand"
                  />
                )}
                <motion.span
                  animate={safe ? { scale: isActive ? 1.06 : 1 } : undefined}
                  transition={{ duration: DUR.fast, ease: EASE }}
                  className="flex flex-col items-center gap-0.5"
                >
                  <Icon size={20} aria-hidden="true" />
                  <span className="text-xs leading-none">{t(labelKey)}</span>
                </motion.span>
              </>
            )}
          </NavLink>
        </li>
      ))}
    </ul>
  </nav>
  );
};

export default BottomNav;
