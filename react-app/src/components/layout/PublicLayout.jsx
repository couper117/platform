import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AppHeader from './AppHeader';
import BottomNav from './BottomNav';
import Footer from './Footer';

/**
 * Public shell: a 44px header, the screen, and a 56px bottom tab bar on mobile.
 *
 * The old shell was a 68px sticky navbar (sports rail + centre logo + search +
 * theme toggle + language menu + auth + hamburger), a full-height slide-in drawer,
 * and a long footer. On a 360x800 phone that chrome plus a decorative hero left
 * roughly 140px for content.
 *
 * WHY THE TITLE LIVES HERE
 * Screens do not render their own header — the shell derives the title from the
 * route. That guarantees every public screen has navigation from the moment this
 * lands, including the ones not yet rewritten, instead of leaving them headless
 * until their phase comes round.
 *
 * The footer is desktop-only: on mobile the bottom bar already carries navigation,
 * and a footer below a fixed tab bar is unreachable furniture.
 */

const TITLES = [
  [/^\/$/, 'RwaSport'],
  [/^\/fixtures/, 'Matches'],
  [/^\/results/, 'Results'],
  [/^\/leagues\/[^/]+/, 'League'],
  [/^\/leagues/, 'Leagues'],
  [/^\/matches\//, 'Match'],
  [/^\/news\//, 'Article'],
  [/^\/news/, 'News'],
  [/^\/sports\//, 'Sport'],
  [/^\/amashuri\/schools\//, 'School'],
  [/^\/amashuri\/schools/, 'Schools'],
  [/^\/amashuri\/standings/, 'Standings'],
  [/^\/amashuri\/fixtures/, 'Amashuri matches'],
  [/^\/amashuri\/results/, 'Amashuri results'],
  [/^\/amashuri\/championships/, 'Championships'],
  [/^\/amashuri\/matches\//, 'Match'],
  [/^\/amashuri/, 'Amashuri Games'],
  [/^\/contact/, 'Contact'],
  [/^\/privacy/, 'Privacy'],
  [/^\/terms/, 'Terms'],
];

const titleFor = (pathname) => TITLES.find(([re]) => re.test(pathname))?.[1] ?? 'RwaSport';

const PublicLayout = () => {
  const { pathname } = useLocation();
  // Read the sport straight off the path. useParams() is no use here: a layout
  // route has no path of its own, so it never sees the child's :slug. Only
  // /sports/:slug carries a sport, and elsewhere the switcher shows "All sports"
  // rather than inventing a scope.
  const slug = pathname.match(/^\/sports\/([^/]+)/)?.[1];

  return (
    <div className="flex min-h-screen flex-col bg-page">
      <AppHeader title={titleFor(pathname)} activeSportSlug={slug} />

      {/* Clears the fixed 56px tab bar plus the home indicator in installed mode. */}
      <main className="flex-1 pb-[calc(theme(spacing.rail)+env(safe-area-inset-bottom))] md:pb-0">
        <Outlet />
      </main>

      <div className="hidden md:block">
        <Footer />
      </div>

      <BottomNav />
    </div>
  );
};

export default PublicLayout;
