import React from 'react';
import { Outlet } from 'react-router-dom';
import AppHeader from './AppHeader';
import BottomNav from './BottomNav';
import Footer from './Footer';
import SideRails from '../shared/SideRails';

/**
 * Public shell, following the Tembera reference's page frame.
 *
 * A FIXED glass header with the page pushed down to clear it — the reference does
 * exactly this (`body { padding-top: 80px }`) and it lets a hero sit *behind* the
 * bar with a negative top margin, which is where its cinematic look comes from.
 *
 * The bottom tab bar is ours, not the reference's: Tembera is a browsing site with
 * a dozen destinations behind dropdowns, so a hamburger is the right answer there.
 * A scores product has four things people came for, and they should be one thumb
 * away. The header's hamburger therefore carries only what the tabs do not.
 *
 * The footer is desktop-only: on mobile the tab bar already carries navigation,
 * and a footer sitting below a fixed tab bar is unreachable furniture.
 */
const PublicLayout = () => (
  // `relative` so SideRails can position against the whole page rather than
  // against the viewport — the rails scroll away with the content.
  <div className="relative flex min-h-screen flex-col bg-page">
    <AppHeader />

    {/* Clears the fixed header (56px mobile / 72px desktop) and, on mobile, the
        tab bar plus the home indicator in installed mode. */}
    <main className="flex-1 pt-14 pb-[calc(theme(spacing.rail)+env(safe-area-inset-bottom))] md:pt-nav md:pb-0">
      <Outlet />
    </main>

    <div className="hidden md:block">
      <Footer />
    </div>

    {/* The gutter skyscrapers. Rendered once for the whole public shell rather
        than per page: they are a run-of-site takeover, and a page that forgot to
        include them would leave a paid slot dark. Absolutely positioned against
        this container, so they sit at the top of the page and scroll away. */}
    <SideRails />

    <BottomNav />
  </div>
);

export default PublicLayout;
