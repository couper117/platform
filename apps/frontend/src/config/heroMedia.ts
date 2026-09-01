/**
 * Homepage hero rotation — real Rwandan sport, one file to edit.
 *
 * These are photographs of Rwandan athletes in Rwandan places: a Second Division
 * match, a Kigali court, the Nyabarongo riverbank, Amahoro Stadium, the Tour du
 * Rwanda. They replace `/landing-hero.jpg`, which was a photograph of an AMERICAN
 * college football game (NC State Wolfpack) on the front door of Rwanda's national
 * sports platform.
 *
 * EVERY FILE WAS OPENED AND LOOKED AT BEFORE IT WAS USED. A seventh candidate was
 * downloaded and thrown away: Commons filed it under Amahoro Stadium, Kigali, but
 * the supporters in it are Congolese. sportThemes.ts already learned this lesson
 * the hard way — a wrong photograph is worse than no photograph.
 *
 * LICENSING. Sources and authors are in public/hero/CREDITS.md. Most are CC BY-SA,
 * which REQUIRES attribution, which is why the hero prints a credit line rather
 * than treating the photograph as anonymous decoration.
 *
 * TO SWAP IN MINISPORTS PRESS PHOTOGRAPHY: drop the file in /public/hero/ under the
 * same name and set `credit: null`. Nothing else changes. Landscape, ~1920 wide,
 * and framed with the action to the RIGHT — the copy sits over the left third.
 */

export type HeroSlide = {
  /** Also the filename in /public/hero/. */
  id: string;
  /** i18n key for the caption naming what you are looking at. */
  labelKey: string;
  /** Where the caption links. */
  to: string;
  /** Photographer, for the CC BY-SA attribution. `null` once it is MINISPORTS' own. */
  credit: string | null;
};

export const HERO_SLIDES: HeroSlide[] = [
  // Credits are copied verbatim from public/hero/CREDITS.md, which is generated
  // from Commons' own metadata. Do not retype them from memory.
  { id: 'football', labelKey: 'explore.shot_football', to: '/sports/football', credit: 'Annick green' },
  { id: 'cycling', labelKey: 'explore.shot_cycling', to: '/sports/cycling', credit: 'Isma250' },
  { id: 'basketball', labelKey: 'explore.shot_basketball', to: '/sports/basketball', credit: 'Claude Nizeyimana' },
  { id: 'athletics', labelKey: 'explore.shot_athletics', to: '/sports/athletics', credit: 'Davyimage' },
  { id: 'volleyball', labelKey: 'explore.shot_volleyball', to: '/sports/volleyball', credit: 'Davyimage' },
  { id: 'amashuri', labelKey: 'explore.shot_amashuri', to: '/amashuri', credit: 'Claude Nizeyimana' },
];

/**
 * Every sport slug with a photograph shipped in /public/hero.
 *
 * ALL OF THEM ARE LOCAL, and that is the point: the sport tiles used to pull from
 * images.unsplash.com at render time, so on a weak connection — a meeting room, a
 * Rwandan mobile network — seven of the twelve cards were blank. Nothing on this
 * page now needs the network.
 *
 * The first six are genuine Rwandan photography (see CREDITS.md). The rest are the
 * curated per-sport stock that sportThemes.ts already used, pulled down to disk
 * rather than hotlinked — the right sport, verified by eye, just not Rwandan yet.
 * Replace any of them with a real photograph at the same filename.
 */
export const SPORT_PHOTOS = new Set([
  'football', 'basketball', 'volleyball', 'athletics', 'cycling',
  'handball', 'netball', 'swimming', 'tennis', 'judo', 'boxing', 'chess',
]);

/** Path to a slide's photograph. */
export const heroSrc = (slide: HeroSlide) => `/hero/${slide.id}.jpg`;

/** How long each photograph holds. Background pacing, not an interaction. */
export const HERO_INTERVAL = 5000;
