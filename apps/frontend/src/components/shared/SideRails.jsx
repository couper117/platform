import React from 'react';
import { useLocation } from 'react-router-dom';
import AdSlot from './AdSlot';

/**
 * The skyscrapers that live in the page gutters.
 *
 * TWO SIZES, BECAUSE THE GUTTER IS NOT ONE SIZE. Every content column in this app
 * is `max-w-6xl` — 1152px — centred, so the space either side is
 * `(viewport - 1152) / 2`. That is 144px on a 1440 laptop and 192px on a 1536
 * desktop: enough for the classic 120x600 on the first and the wide 160x600 on the
 * second, and the unit steps down rather than disappearing. Shipping only the
 * 160px one meant nothing at all below 1536, which is most laptops.
 *
 * BELOW 1440 THERE IS NO RAIL, and that is arithmetic rather than a decision to
 * revisit. At 1280 the gutter is 64px. Nothing legible fits in 64px, and the only
 * way to make one fit would be to narrow the content column on the most common
 * laptop width in order to sell an advert — a trade the reader should not pay.
 * They are not rendered there at all: not shrunk, not scrolled to, not overlapped.
 *
 * ANCHORED TO THE COLUMN, NOT THE VIEWPORT EDGE. `right: calc(50% + 592px)` puts a
 * left rail's outer edge exactly 16px clear of the content column's left edge
 * (576px is half the column, 16px the channel). Both sizes share that anchor and
 * grow leftwards, so the channel beside the content stays constant while the slack
 * against the window edge takes up the difference.
 *
 * THEY SCROLL AWAY WITH THE PAGE. `absolute`, not `fixed`: an advert that holds
 * its place through a scroll follows the reader down every screen of every page,
 * which is what the client objected to. This one is placed near the top of the
 * content, is seen once, and is gone. PublicLayout is the containing block.
 *
 * THEY START BELOW A FULL-BLEED HERO, WHERE THERE IS ONE. Three routes open on a
 * photograph that runs the whole width of the window, and a rail pinned under the
 * header sat in the middle of it — an advert laid over the front-door image. The
 * offsets in `HERO_BOTTOM` are the measured bottom edge of each of those heroes
 * plus a little air.
 *
 * MEASURED ONCE AND WRITTEN DOWN, not read from the DOM at runtime. Reading the
 * hero's height would mean rendering the rail, measuring, then moving it — a
 * visible jump on every page load — and these three heroes are fixed heights that
 * do not vary across any width the rails appear at (checked at 1440, 1536, 1920).
 * If a hero's height changes, this map changes with it.
 *
 * NOT EVERY PAGE — ONLY THE BROWSING ONES. This started run-of-site and looked
 * wrong on half the app. A gutter pair works beside a LIST: a fixture list, a
 * league table, a directory of clubs, a news index. Those are wide, scannable and
 * dense, and a column of advertising beside them reads as furniture. Beside a
 * single MATCH, a player profile or an article it reads as an interruption of the
 * one thing the reader opened the page for, and a detail page is usually narrow
 * enough that the gutters are the only quiet space left on the screen.
 *
 * `RAIL_ROUTES` is the allowlist. Anything not on it gets no rails; the page's own
 * footer banner is inventory enough.
 *
 * The two advertisers still sit outside the page rotation, so a reader never meets
 * the same brand in the gutter and in the page banner at once — see mockData.
 */
const BASE = 'absolute z-30';

/**
 * Route prefix -> the Tailwind `top-` class that clears that route's hero.
 * Longest prefix wins. Anything not listed has no full-bleed hero and starts just
 * under the 72px desktop header.
 */
const HERO_BOTTOM = [
  ['/sports/', 'top-[400px]'], // sport identity photo ends at 372px
  ['/amashuri', 'top-[380px]'], // Games hero ends at 352px
  ['/', 'top-[740px]'], // the landing hero ends at 712px — checked last, it matches everything
];

const DEFAULT_TOP = 'top-24';

/**
 * Where a gutter pair is allowed. Prefix match; order does not matter.
 *
 * Deliberately NOT: `/matches/`, `/amashuri/matches/`, `/players/`,
 * `/amashuri/athletes/`, `/news/<slug>`, `/amashuri/schools/<id>`, `/contact`,
 * `/privacy`, `/terms` — every one of those is a single record or a piece of
 * reading, where a column of advertising is the loudest thing on the screen.
 *
 * `/calendar` is off the list too. A month grid is already a dense field of
 * boxes; flanking it with two more vertical panels turns the whole screen into
 * columns and the reader loses which one is the calendar.
 */
const RAIL_ROUTES = [
  '/fixtures',
  '/live',
  '/results',
  '/leagues',
  '/teams',
  '/sports',
  '/amashuri/fixtures',
  '/amashuri/standings',
  '/amashuri/schools',
  '/amashuri/championships',
];

/** `/news` yes, `/news/some-article` no — the index is a list, the article is not. */
const INDEX_ONLY = ['/news'];

const railsAllowed = (pathname) => {
  if (INDEX_ONLY.includes(pathname)) return true;
  // `/teams` and `/teams/12` are both lists-of-things pages; `/teams/12/players`
  // still is. The exclusions above are all detail records under other prefixes.
  return RAIL_ROUTES.some((r) => pathname === r || pathname.startsWith(`${r}/`));
};

const railTop = (pathname) => {
  for (const [prefix, cls] of HERO_BOTTOM) {
    // '/' would match every route, so it only counts as an exact match.
    if (prefix === '/' ? pathname === '/' : pathname.startsWith(prefix)) return cls;
  }
  return DEFAULT_TOP;
};

/** The 120x600, for gutters between 1440px and 1536px. */
const NARROW = `${BASE} hidden w-[120px] rail:block railwide:hidden`;
/** The 160x600, from 1536px up. */
const WIDE = `${BASE} hidden w-[160px] railwide:block`;

const LEFT = 'right-[calc(50%+37rem)]';
const RIGHT = 'left-[calc(50%+37rem)]';

const SideRails = () => {
  const { pathname } = useLocation();
  if (!railsAllowed(pathname)) return null;
  const top = railTop(pathname);
  return (
  <>
    {/* Each side renders both sizes and hides one per breakpoint. A JS media
        query would resolve after the first paint, so the rail would pop in a
        frame late — and unlike an in-flow unit there is no reserved height to
        stop it landing on top of something. */}
    <div className={`${NARROW} ${LEFT} ${top}`}>
      <AdSlot position="side-left-narrow" variant="skyscraper" />
    </div>
    <div className={`${WIDE} ${LEFT} ${top}`}>
      <AdSlot position="side-left" variant="skyscraper" />
    </div>

    <div className={`${NARROW} ${RIGHT} ${top}`}>
      <AdSlot position="side-right-narrow" variant="skyscraper" />
    </div>
    <div className={`${WIDE} ${RIGHT} ${top}`}>
      <AdSlot position="side-right" variant="skyscraper" />
    </div>
  </>
  );
};

export default SideRails;
