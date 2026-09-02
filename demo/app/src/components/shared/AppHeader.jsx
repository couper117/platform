import React, { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  CalendarDays, Trophy, Newspaper, Compass, Medal, Search, Menu, X, Users,
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
 * ONE MAP, THREE SURFACES. The desktop bar, the mobile drawer and the bottom tab
 * bar now list the SAME destinations in the SAME order — the drawer is the full
 * list, the tab bar is the first five of it, the desktop bar is the full list
 * again. It used to be three different products: the drawer carried Calendar and
 * Contact that the bar did not, called `/` "Home" where the bar called it
 * "Explore", and had no Sports entry at all, while the tab bar carried Live, which
 * the desktop bar had already dropped. A visitor who learned the app on a phone
 * could not find the same things on a laptop.
 */

// Desktop nav order, per the platform spec:
//   Explore · Live · Matches · [Sports ▾] · Leagues · Teams · News · Amashuri Games
// The Sports dropdown is rendered between PRIMARY_LEFT and PRIMARY_RIGHT.
const PRIMARY_LEFT = [
  { to: '/', labelKey: 'nav.explore', end: true },
  { to: '/fixtures', labelKey: 'nav.matches' },
];
const PRIMARY_RIGHT = [
  { to: '/leagues', labelKey: 'nav.leagues' },
  { to: '/teams', labelKey: 'nav.teams' },
  { to: '/news', labelKey: 'nav.news' },
  { to: '/amashuri', labelKey: 'nav.amashuri_short' },
];

/**
 * The drawer's destinations — the desktop bar, in the desktop bar's order.
 *
 * It reads `PRIMARY_LEFT · Sports · PRIMARY_RIGHT` off the same two arrays the
 * desktop bar renders, so the two cannot drift again: adding a destination to the
 * bar adds it to the drawer, and an icon is the only thing this list adds.
 */
const DRAWER_ICONS = {
  '/': Compass,
  '/fixtures': CalendarDays,
  '/sports': Medal,
  '/leagues': Trophy,
  '/teams': Users,
  '/news': Newspaper,
  '/amashuri': GraduationCap,
};

const DRAWER_PRIMARY = [
  ...PRIMARY_LEFT,
  { to: '/sports', labelKey: 'nav.sports' },
  ...PRIMARY_RIGHT,
].map((item) => ({ ...item, icon: DRAWER_ICONS[item.to] ?? Compass }));

/**
 * Utility destinations, below a rule.
 *
 * Contact only. Calendar used to sit here and nowhere on desktop, which is half of
 * why the drawer was longer than the bar; it is reachable from the Matches page on
 * both, which is where someone looking for a date actually goes.
 */
const DRAWER_SECONDARY = [
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

const NavItem = ({ to, label, end }) => (
  <NavLink
    to={to}
    end={end}
    className={({ isActive }) =>
      cn(
        'relative flex items-center whitespace-nowrap px-0.5 py-2 text-sm font-semibold',
        'transition-colors duration-150 ease-standard',
        'after:absolute after:inset-x-0 after:-bottom-1 after:h-0.5 after:rounded-pill after:content-[\"\"]',
        isActive
          ? 'text-primary after:bg-brand'
          : 'text-secondary after:bg-transparent hover:text-primary'
      )
    }
  >
    {label}
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
          'flex items-center gap-1 whitespace-nowrap px-0.5 py-2 text-sm font-semibold',
          'transition-colors duration-150 ease-standard',
          open ? 'text-primary' : 'text-secondary hover:text-primary'
        )}
      >
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

  /**
   * A PANEL, NOT AN ACCORDION.
   *
   * The menu used to render inline underneath the bar, shoving the page down and
   * pushing the fixture list off-screen — so opening the menu destroyed the thing
   * you were looking at, and closing it threw you back to a different scroll
   * position. It is a fixed overlay now: a scrim over the page, a panel sliding in
   * from the right, the page untouched behind it.
   *
   * An overlay owes the user three things a dropdown does not: Escape closes it,
   * the page behind must not scroll under your finger, and focus has to land
   * inside it so a keyboard or screen-reader user is not left behind on the page.
   */
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKey = (e) => e.key === 'Escape' && setMenuOpen(false);
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const changeLanguage = (code) => {
    i18n.changeLanguage(code);
    localStorage.setItem('rnsp-lang', code);
  };

  return (
    <>
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
        <nav aria-label="Main" className="ml-4 hidden min-w-0 flex-1 items-center gap-5 lg:flex xl:ml-8 xl:gap-6">
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
              <Button to="/auth/team/register" size="sm" icon={UserPlus} className="hidden whitespace-nowrap xl:inline-flex">
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

    </header>

      {/* Mobile drawer — a right-hand panel over a scrim. */}
    {menuOpen && (
      <div className="fixed inset-0 z-[60] lg:hidden">
        <button
          type="button"
          aria-label={t('nav.close_menu', 'Close menu')}
          onClick={() => setMenuOpen(false)}
          className="absolute inset-0 h-full w-full cursor-default bg-black/50 backdrop-blur-[2px] motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200"
        />
        <aside
          role="dialog"
          aria-modal="true"
          aria-label={t('nav.menu', 'Menu')}
          className={cn(
            'absolute inset-y-0 right-0 flex w-[86%] max-w-sm flex-col',
            'border-l border-hairline bg-surface shadow-lg',
            'motion-safe:animate-in motion-safe:slide-in-from-right motion-safe:duration-200 motion-safe:ease-out'
          )}
        >
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-hairline px-4">
            <span className="font-display text-base font-semibold text-primary">
              {t('nav.menu', 'Menu')}
            </span>
            <IconButton
              icon={X}
              label={t('nav.close_menu', 'Close menu')}
              size="sm"
              onClick={() => setMenuOpen(false)}
            />
          </div>

        <div className="flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
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

          {/* The active destination is marked, so the drawer tells you where you
              already are instead of listing five places that look identical.
              The icon is grey until then — six green icons in a column was the
              loudest thing in the panel and none of it meant anything. */}
          <nav aria-label={t('nav.menu', 'Menu')} className="grid gap-0.5">
            {DRAWER_PRIMARY.map(({ to, labelKey, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'flex min-h-tap items-center gap-3 rounded-control px-3 text-base font-semibold',
                    'transition-colors duration-150 ease-standard',
                    isActive
                      ? 'bg-brand-tint text-brand-text'
                      : 'text-secondary hover:bg-surface-2 hover:text-primary'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon size={17} aria-hidden="true" className={isActive ? 'text-brand' : 'text-tertiary'} />
                    {t(labelKey)}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="grid gap-0.5 border-t border-hairline pt-3">
            {DRAWER_SECONDARY.map(({ to, labelKey, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    'flex min-h-tap items-center gap-3 rounded-control px-3 text-sm font-semibold',
                    'transition-colors duration-150 ease-standard',
                    isActive ? 'bg-brand-tint text-brand-text' : 'text-secondary hover:bg-surface-2 hover:text-primary'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon size={16} aria-hidden="true" className={isActive ? 'text-brand' : 'text-tertiary'} />
                    {t(labelKey)}
                  </>
                )}
              </NavLink>
            ))}
          </div>

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
            /* Registering a club is the real action here and keeps the filled
               button; signing in is a text link beneath it. Two equal-weight
               buttons side by side made neither of them the primary one, and a
               full-width green slab was the loudest thing in a panel of quiet
               links. */
            <div className="flex flex-col gap-2">
              <Button to="/auth/team/register" block>
                {t('nav.register_team')}
              </Button>
              <Link
                to="/auth/login"
                className="flex min-h-tap items-center justify-center rounded-control text-sm font-semibold text-secondary transition-colors duration-150 ease-standard hover:bg-surface-2 hover:text-primary"
              >
                {t('nav.login')}
              </Link>
            </div>
          )}
        </div>
        </aside>
      </div>
    )}
    </>
  );
};

export default AppHeader;
