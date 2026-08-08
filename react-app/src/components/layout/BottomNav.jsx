import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, CalendarDays, Trophy, Newspaper } from 'lucide-react';
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

const TABS = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/fixtures', label: 'Matches', icon: CalendarDays },
  { to: '/leagues', label: 'Leagues', icon: Trophy },
  { to: '/news', label: 'News', icon: Newspaper },
];

const BottomNav = () => {
  const safe = useMotionSafe();
  return (
  <nav
    aria-label="Main"
    className={cn(
      'fixed inset-x-0 bottom-0 z-50 md:hidden',
      'border-t border-hairline bg-surface',
      // The safe-area inset is padding, so the 56px row is never squeezed by it.
      'pb-[env(safe-area-inset-bottom)]'
    )}
  >
    <ul className="flex h-rail items-stretch">
      {TABS.map(({ to, label, icon: Icon, end }) => (
        <li key={to} className="flex-1">
          <NavLink
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'relative flex h-full flex-col items-center justify-center gap-0.5',
                'transition-colors duration-150 ease-standard',
                isActive ? 'text-primary' : 'text-tertiary'
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
                    className="absolute inset-x-0 top-0 h-0.5 bg-primary"
                  />
                )}
                <motion.span
                  animate={safe ? { scale: isActive ? 1.06 : 1 } : undefined}
                  transition={{ duration: DUR.fast, ease: EASE }}
                  className="flex flex-col items-center gap-0.5"
                >
                  <Icon size={20} aria-hidden="true" />
                  <span className="text-xs leading-none">{label}</span>
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
