import React, { useEffect, useState } from 'react';
import NotificationBell from '../shared/NotificationBell';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Home, CalendarDays, Trophy, Newspaper, Compass, Search, Menu, X, Radio, Users,
  LogOut, UserPlus, Languages, GraduationCap, Mail, ChevronDown, Star, RefreshCw, Download, Share,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../../store/authStore';
import usePwaInstall from '../../hooks/usePwaInstall';
import { roleHome } from '../../utils/roleHome';
import { useCommandPalette } from '../../context/CommandPaletteContext';
import { getSports } from '../../api/endpoints/sports';
import useFavouriteSport from '../../hooks/useFavouriteSport';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import IconButton from '../ui/IconButton';
import ThemeToggle from '../ui/ThemeToggle';
import SportIcon from '../shared/SportIcon';
import cn from '../ui/cn';

/**
 * Glass header, following the Tembera reference.
 *
 * ANATOMY, straight from the reference's nav:
 *   translucent white bar + backdrop-blur(12px) + a soft `0 4px 30px` shadow
 *   a text-only wordmark, second half in Rwanda green
 *   nav links as ICON + LABEL, grey by default, lifting 2px on hover with the
 *     icon turning green
 *   a dropdown with a 3px green top border, 12px radius, and items that wash to
 *     --brand-tint and indent 5px on hover
 *   a green pill CTA on the right, with a brand glow that grows on hover
 *
 * HEIGHT: 72px on desktop, matching the reference's 80px bar. On mobile it is
 * 56px, because there a 72px header plus the 56px tab bar would spend 128px of an
 * 800px screen on chrome before a single match appeared. The reference is a
 * browsing site with no bottom bar and can afford the full height; a scores list
 * cannot.
 *
 * NAVIGATION SPLIT: the bottom tab bar owns the four primary destinations on
 * mobile, so this header's hamburger holds only what the tabs do not —
 * Amashuri, Contact, language, theme, account. No destination appears in both.
 */

// Desktop nav order, per the platform spec:
//   Explore · Live · Matches · [Sports ▾] · Leagues · Teams · News · Amashuri Games
// The Sports dropdown is rendered between PRIMARY_LEFT and PRIMARY_RIGHT.
const PRIMARY_LEFT = [
  { to: '/', labelKey: 'nav.explore', icon: Compass, end: true },
  { to: '/live', labelKey: 'nav.live', icon: Radio },
  { to: '/fixtures', labelKey: 'nav.matches', icon: CalendarDays },
];
const PRIMARY_RIGHT = [
  { to: '/leagues', labelKey: 'nav.leagues', icon: Trophy },
  { to: '/teams', labelKey: 'nav.teams', icon: Users },
  { to: '/news', labelKey: 'nav.news', icon: Newspaper },
  { to: '/amashuri', labelKey: 'nav.amashuri', icon: GraduationCap },
];

/** Extra destinations for the mobile drawer (the bottom bar owns the primaries). */
const SECONDARY = [
  { to: '/calendar', labelKey: 'nav.calendar', icon: CalendarDays },
  { to: '/teams', labelKey: 'nav.teams', icon: Users },
  { to: '/amashuri', labelKey: 'nav.amashuri', icon: GraduationCap },
  { to: '/home', labelKey: 'nav.home', icon: Home },
  { to: '/contact', labelKey: 'nav.contact', icon: Mail },
];

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'rw', label: 'Kinyarwanda' },
];

const Wordmark = () => (
  <Link
    to="/"
    className="shrink-0 font-display text-xl font-extrabold tracking-tight text-primary md:text-2xl"
  >
    Rwa<span className="text-brand-text">Sport</span>
  </Link>
);

/* ─── desktop link ──────────────────────────────────────────────────── */

const NavItem = ({ to, label, icon: Icon, end }) => (
  <NavLink
    to={to}
    end={end}
    className={({ isActive }) =>
      cn(
        'group flex items-center gap-2 rounded-control px-2.5 py-2 text-sm font-semibold',
        'transition-all duration-200 ease-standard hover:-translate-y-0.5',
        isActive ? 'text-primary' : 'text-secondary hover:text-primary'
      )
    }
  >
    {({ isActive }) => (
      <>
        <Icon
          size={14}
          aria-hidden="true"
          className={cn(
            'transition-colors duration-200',
            isActive ? 'text-brand-text' : 'text-tertiary group-hover:text-brand-text'
          )}
        />
        {label}
      </>
    )}
  </NavLink>
);

/* ─── sports dropdown ───────────────────────────────────────────────── */

const SportsMenu = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { slug: favourite, clear } = useFavouriteSport();
  // Query copied verbatim from the legacy Navbar — same key, so it shares cache.
  const { data: sportsRes } = useQuery({ queryKey: ['nav-sports'], queryFn: getSports, staleTime: 300000 });
  const sports = sportsRes?.data || [];

  if (sports.length === 0) return null;

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'group flex items-center gap-2 rounded-control px-2.5 py-2 text-sm font-semibold',
          'transition-all duration-200 ease-standard hover:-translate-y-0.5',
          open ? 'text-primary' : 'text-secondary hover:text-primary'
        )}
      >
        <Compass
          size={14}
          aria-hidden="true"
          className={cn('transition-colors', open ? 'text-brand-text' : 'text-tertiary group-hover:text-brand-text')}
        />
        {t('nav.sports')}
        <ChevronDown size={12} className={cn('opacity-60 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div
          className={cn(
            'absolute right-0 top-full z-50 w-60 animate-fade-up p-2',
            // The reference's signature: a 3px green top border on the panel.
            'rounded-input border-t-[3px] border-brand bg-surface shadow-lg'
          )}
        >
          {sports.map((s) => (
            <Link
              key={s.id}
              to={`/sports/${s.slug}`}
              onClick={() => setOpen(false)}
              className={cn(
                'flex items-center gap-2.5 rounded-control px-3 py-2.5 text-sm font-medium text-secondary',
                'transition-all duration-200 ease-standard hover:bg-brand-tint hover:pl-5 hover:text-brand-text'
              )}
            >
              <SportIcon slug={s.slug} size={16} className="shrink-0 text-brand" />
              <span className="truncate">{s.name}</span>
              {/* Marks which sport the site opens on, so the setting is visible
                  where it takes effect rather than buried in a settings screen. */}
              {s.slug === favourite && (
                <Star
                  size={12}
                  aria-label="Your sport"
                  className="ml-auto shrink-0 fill-brand text-brand"
                />
              )}
            </Link>
          ))}

          {favourite && (
            <>
              <hr className="my-2 border-hairline" />
              <button
                type="button"
                onClick={() => {
                  // Clear first, then land on the chooser — otherwise the gate would
                  // immediately redirect back to the sport being changed.
                  clear();
                  setOpen(false);
                  navigate('/');
                }}
                className="flex w-full items-center gap-2.5 rounded-control px-3 py-2.5 text-sm font-medium text-secondary transition-all duration-200 ease-standard hover:bg-brand-tint hover:pl-5 hover:text-brand-text"
              >
                <RefreshCw size={14} className="shrink-0 text-brand" aria-hidden="true" />
                {t('nav.change_sport')}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

/* ─── header ────────────────────────────────────────────────────────── */

/** @param {{ className?: string }} props */
const AppHeader = ({ className }) => {
  const { isAuthenticated, user, role, logout } = useAuthStore();
  const { openPalette } = useCommandPalette();
  const { t, i18n } = useTranslation();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const { canInstall, installed, install, isIos } = usePwaInstall();

  // Any navigation closes the drawer — otherwise it stays open over the new page.
  useEffect(() => setMenuOpen(false), [pathname]);

  const changeLanguage = (code) => {
    i18n.changeLanguage(code);
    localStorage.setItem('rnsp-lang', code);
  };

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50',
        // Translucent + blur is the reference's "permanent glass" bar.
        'border-b border-hairline bg-surface/95 shadow-nav backdrop-blur-nav',
        className
      )}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4 md:h-nav md:px-6">
        <Wordmark />

        {/* Desktop nav: Explore · Live · Matches · Sports ▾ · Leagues · Teams · News · Amashuri */}
        <nav aria-label="Main" className="ml-3 hidden flex-1 items-center gap-0.5 lg:flex xl:ml-4">
          {PRIMARY_LEFT.map((item) => (
            <NavItem key={item.to} {...item} label={t(item.labelKey)} />
          ))}
          <SportsMenu />
          {PRIMARY_RIGHT.map((item) => (
            <NavItem key={item.to} {...item} label={t(item.labelKey)} />
          ))}
        </nav>

        <span className="flex-1 lg:hidden" />

        <div className="flex shrink-0 items-center gap-1">
          <IconButton icon={Search} label={t('nav.search', 'Search')} size="sm" onClick={openPalette} />
          {/* Shown to anyone with notifications, signed in or not — following a
              team never needed an account, so hearing about it must not either.
              Renders nothing at all when there is nothing to show. */}
          <NotificationBell />
          {/* Visible at every width, phones included. Switching theme is a
              one-tap thing people do in bright sun or at night — burying it two
              taps deep behind the hamburger made the least sense on the device
              most likely to be used outdoors. */}
          <ThemeToggle />

          {isAuthenticated ? (
            <>
              <Link
                to={roleHome(role)}
                aria-label={`Account — ${user?.fullName || user?.username || 'signed in'}`}
                className="ml-1 shrink-0 rounded-pill"
              >
                <Avatar name={user?.fullName || user?.username} src={user?.avatar} size="md" />
              </Link>
              <IconButton
                icon={LogOut}
                label={t('nav.logout')}
                size="sm"
                onClick={logout}
                className="hidden md:inline-flex"
              />
            </>
          ) : (
            <>
              <Link
                to="/auth/login"
                className="hidden px-2 text-sm font-semibold text-secondary transition-colors hover:text-primary md:block"
              >
                {t('nav.login')}
              </Link>
              {/* The reference's "Plan Trip" pill, in our terms. */}
              <Button to="/auth/team/register" size="sm" icon={UserPlus} className="hidden md:inline-flex">
                {t('nav.register_team')}
              </Button>
            </>
          )}

          {/* Hamburger — secondary destinations only; the tab bar owns the rest. */}
          <IconButton
            icon={menuOpen ? X : Menu}
            label={menuOpen ? t('nav.close_menu', 'Close menu') : t('nav.open_menu', 'Open menu')}
            size="sm"
            onClick={() => setMenuOpen((v) => !v)}
            className="lg:hidden"
            aria-expanded={menuOpen}
          />
        </div>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="animate-fade-up border-t border-hairline bg-surface lg:hidden">
          <div className="mx-auto max-w-6xl space-y-4 px-4 py-4">
            {/* Install the app — RwaSport is a mobile-first installable PWA. */}
            {!installed && (canInstall || isIos) && (
              isIos ? (
                <p className="flex items-center gap-2 rounded-control border border-brand/30 bg-brand-tint px-3 py-3 text-sm font-semibold text-brand-text">
                  <Share size={16} className="shrink-0" /> {t('nav.install_ios')}
                </p>
              ) : (
                <button
                  type="button"
                  onClick={install}
                  className="flex w-full items-center justify-center gap-2 rounded-control bg-brand-strong px-3 py-3 text-sm font-bold text-white shadow-brand"
                >
                  <Download size={17} aria-hidden="true" /> {t('nav.install_app')}
                </button>
              )
            )}

            <nav aria-label="More" className="grid gap-1">
              {SECONDARY.map(({ to, labelKey, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className="flex items-center gap-3 rounded-control px-3 py-3 text-base font-semibold text-secondary transition-colors hover:bg-brand-tint hover:text-brand-text"
                >
                  <Icon size={16} className="text-brand" aria-hidden="true" />
                  {t(labelKey)}
                </Link>
              ))}
            </nav>

            <div className="border-t border-hairline pt-4">
              <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-tertiary">
                <Languages size={12} aria-hidden="true" /> {t('nav.language', 'Language')}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => changeLanguage(l.code)}
                    className={cn(
                      'rounded-pill border px-3 py-2 text-sm font-semibold transition-colors',
                      i18n.language === l.code
                        ? 'border-brand bg-brand-tint text-brand-text'
                        : 'border-hairline text-secondary'
                    )}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            {/* No Appearance row here any more — the toggle lives in the header at
                every width, and offering it in both places invites the two to drift. */}

            {isAuthenticated ? (
              <Button variant="secondary" block onClick={logout} icon={LogOut}>
                {t('nav.logout')}
              </Button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Button variant="secondary" to="/auth/login">
                  {t('nav.login')}
                </Button>
                <Button to="/auth/team/register">{t('nav.register_team')}</Button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default AppHeader;
