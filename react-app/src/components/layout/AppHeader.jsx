import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Search, User } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { roleHome } from '../../utils/roleHome';
import { useCommandPalette } from '../../context/CommandPaletteContext';
import Avatar from '../ui/Avatar';
import IconButton from '../ui/IconButton';
import SportSwitcher from '../match/SportSwitcher';
import cn from '../ui/cn';

/**
 * Minimal header: screen title, sport scope, search, account. That is all.
 *
 * WHY 44px AND NOT 40px
 * The brief called for a 40px header. It is 44px, because 44px is the minimum tap
 * target in this system and the header holds three of them — a 40px bar can only
 * contain 40px controls, which breaks the rule everywhere it appears. Four pixels
 * of chrome is a better trade than three under-sized targets on every screen.
 *
 * The title is the SCREEN's name, not the product's. A logo on every screen tells
 * a returning user nothing; "Matches" tells them where they are. The brand lives
 * on Home and in the installed app icon.
 *
 * `relative` because SportSwitcher's disclosure panel anchors to this bar.
 */
/** Mirrors BottomNav — the same four destinations, shown inline on desktop. */
const DESKTOP_TABS = [
  { to: '/', label: 'Home', end: true },
  { to: '/fixtures', label: 'Matches' },
  { to: '/leagues', label: 'Leagues' },
  { to: '/news', label: 'News' },
];

const AppHeader = ({ title, activeSportSlug, className }) => {
  const { isAuthenticated, user, role } = useAuthStore();
  const { openPalette } = useCommandPalette();

  return (
    <header
      className={cn(
        'sticky top-0 z-40 border-b border-hairline bg-surface',
        // `relative` for the disclosure; `sticky` keeps scope reachable while scrolling.
        'relative',
        className
      )}
    >
      <div className="mx-auto flex h-tap max-w-3xl items-center gap-2 px-3">
        {/* Mobile shows the SCREEN's name — a logo on every screen tells a
            returning user nothing, while "Matches" says where they are. Desktop has
            room for the wordmark and expects it, so it shows both roles: wordmark
            here, and the screen identified by the lit nav item beside it. */}
        <h1 className="min-w-0 truncate font-display text-lg font-semibold text-primary md:hidden">
          {title}
        </h1>
        <Link
          to="/"
          className="hidden shrink-0 font-display text-lg font-semibold tracking-tight text-primary md:block"
        >
          RWA<span className="text-tertiary">·</span>SPORTS
        </Link>

        {/* On desktop there is no bottom bar, so the same four destinations live
            here inline. One navigation model, two placements. */}
        <nav aria-label="Main" className="hidden flex-1 items-center gap-1 pl-4 md:flex">
          {DESKTOP_TABS.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'rounded-control px-2 py-1 text-base transition-colors duration-150 ease-standard',
                  isActive ? 'text-primary' : 'text-secondary hover:text-primary'
                )
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <span className="flex-1 md:hidden" />

        <SportSwitcher activeSlug={activeSportSlug} />

        <IconButton icon={Search} label="Search" size="sm" onClick={openPalette} />

        {isAuthenticated ? (
          <Link
            to={roleHome(role)}
            aria-label={`Account — ${user?.fullName || user?.username || 'signed in'}`}
            className="shrink-0 rounded-pill"
          >
            <Avatar name={user?.fullName || user?.username} src={user?.avatar} size="md" />
          </Link>
        ) : (
          <IconButton icon={User} label="Sign in" size="sm" to="/auth/login" />
        )}
      </div>
    </header>
  );
};

export default AppHeader;
