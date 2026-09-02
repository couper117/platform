import React from 'react';
import AdSlot from './AdSlot';

/**
 * One in-page advertising placement, in the right shape for the viewport.
 *
 * WHY THIS EXISTS. Every page that wants inventory needs two units, not one: a
 * 320x100 mobile banner in a phone column and a 728x90 leaderboard above a desktop
 * one. Those are different creatives, not one image at two sizes — the first
 * attempt letterboxed a leaderboard into a 358x63 strip and cropped the wordmark
 * clean off. Rather than every page repeating the same pair of AdSlots with the
 * same breakpoint classes, a placement is one line: `<PageAd position="news" />`.
 *
 * THE `-lg` CONVENTION. A placement called `news` needs `news` in the inventory
 * for the mobile creative and `news-lg` for the desktop one. mockData generates
 * both from one table, so adding a placement is one row there and one line here.
 *
 * BOTH UNITS ARE ALWAYS RENDERED, one hidden per breakpoint, rather than switching
 * on a JS media query. A media-query hook resolves after the first paint, so the
 * slot would pop in late and shove the page down — the exact thing AdSlot reserves
 * height to avoid.
 *
 * AdSlot collapses to nothing when a position has no inventory, so a page can
 * declare a placement before anyone has sold it.
 */
const PageAd = ({ position, className = '' }) => (
  <>
    <AdSlot position={position} variant="inline" className={`lg:hidden ${className}`} />
    <AdSlot position={`${position}-lg`} variant="leaderboard" className={`hidden lg:block ${className}`} />
  </>
);

export default PageAd;
