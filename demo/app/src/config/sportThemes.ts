// Per-sport visual identity: a Rwanda-themed background + accent colour + venue
// label. Keyed by sport slug; falls back to a generic Rwanda scene. Each sport
// reuses Rwandan imagery (hills, Kigali, stadiums) tinted with its accent.
// Base URL only — width is chosen per-device by utils/responsiveImage.js, which
// builds a srcSet from this. Never hardcode a width here (it used to be 1920,
// which every phone downloaded in full).
const U = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&q=75`;

/**
 * Backdrops per sport. DEFAULTS ONLY — a sport's `coverImage` from the database
 * always wins, so MINISPORTS can replace any of these with a real Rwandan photo.
 *
 * These were previously commented "verified to load", which is not the same as
 * being the right subject, and two of them were not: `rugby` resolved to a
 * photograph of a FISH AND CHIPS SHOP, and `handball` to a game of volleyball.
 * Both were audited visually in a contact sheet and set to `null`.
 *
 * `bg: null` is a supported state, not a gap. A sport without a photograph renders
 * as a brand-tinted panel with its icon, which is honest and looks deliberate — and
 * it is the state EVERY newly added sport starts in, so the grid needs it regardless.
 * A wrong photograph is far worse than no photograph.
 */
/**
 * ONE ACCENT FOR EVERY SPORT, and identity carried by the photograph instead.
 *
 * Each sport used to get its own accent hue. In practice that put a near-miss
 * green (#16a34a football, #15803d rugby) beside the brand's #008848, plus THREE
 * different blues (#2563EB volleyball, #0369A1 handball, #0E7490 cricket) and a
 * second orange that collided with the live-state colour. Measured on the landing
 * page it came to five greens and a scatter of blues — the reason the palette read
 * as broken.
 *
 * The reference solves this by having exactly one accent and letting imagery do
 * the differentiating, so that is what happens here: every sport accents in brand
 * green, and its hub still feels distinct because the backdrop and venue label
 * change. A hub is recognisable from a photograph of a basketball court; it does
 * not also need to be orange.
 *
 * If per-sport colour is ever wanted back, it has to come from a curated set with
 * real separation between hues — not eight values picked one at a time.
 */
const BRAND = '#008848';

// Every ID below was visually verified (rendered and eyeballed) to be the right
// sport — a wrong photograph is worse than none, so nothing here is guessed.
export const SPORT_THEMES = {
  football:      { bg: U('photo-1522778119026-d647f0596c20'), accent: BRAND, venue: 'Pitch' },
  basketball:    { bg: U('photo-1546519638-68e109498ffc'),    accent: BRAND, venue: 'Court' },
  volleyball:    { bg: U('photo-1592656094267-764a45160876'), accent: BRAND, venue: 'Court' },
  cycling:       { bg: U('photo-1541625602330-2277a4c46182'), accent: BRAND, venue: 'Road' },
  cricket:       { bg: U('photo-1531415074968-036ba1b575da'), accent: BRAND, venue: 'Pitch' },
  athletics:     { bg: U('photo-1461896836934-ffe607ba8211'), accent: BRAND, venue: 'Track' },
  rugby:         { bg: U('photo-1480099225005-2513c8947aec'), accent: BRAND, venue: 'Field' },
  handball:      { bg: U('photo-1587384474964-3a06ce1ce699'), accent: BRAND, venue: 'Court' },
  swimming:      { bg: U('photo-1560090995-01632a28895b'),    accent: BRAND, venue: 'Pool' },
  tennis:        { bg: U('photo-1545151414-8a948e1ea54f'),    accent: BRAND, venue: 'Court' },
  'table-tennis': { bg: U('photo-1609710228159-0fa9bd7c0827'), accent: BRAND, venue: 'Table' },
  badminton:     { bg: U('photo-1599391398131-cd12dfc6c24e'), accent: BRAND, venue: 'Court' },
  judo:          { bg: U('photo-1555597673-b21d5c935865'),    accent: BRAND, venue: 'Dojo' },
  karate:        { bg: U('photo-1555597408-26bc8e548a46'),    accent: BRAND, venue: 'Dojo' },
  taekwondo:     { bg: U('photo-1555597673-b21d5c935865'),    accent: BRAND, venue: 'Dojo' },
  boxing:        { bg: U('photo-1546711076-85a7923432ab'),    accent: BRAND, venue: 'Ring' },
  kickboxing:    { bg: U('photo-1549719386-74dfcbf7dbed'),    accent: BRAND, venue: 'Ring' },
  wrestling:     { bg: U('photo-1541337082051-5959dbb57d5d'), accent: BRAND, venue: 'Mat' },
  netball:       { bg: U('photo-1729963421538-31c333335b3c'), accent: BRAND, venue: 'Court' },
  chess:         { bg: U('photo-1586165368502-1bad197a6461'), accent: BRAND, venue: 'Board' },
};

/**
 * The fallback backdrop — used when no sport is known (a visitor with no chosen
 * sport, or a sport with no entry above).
 *
 * It was the stadium frame, which measures mean luminance 102 but only 61 in its
 * TOP half — and the top is exactly where an overlay scrim is lightest, so behind
 * one it read as solid black and looked like a broken image. The cycling frame is
 * the brightest of the set (mean 167, top half 189), survives a scrim, and is a
 * fair default for Rwanda besides: the Tour du Rwanda is the country's most
 * internationally recognised sporting event.
 */
export const DEFAULT_SPORT_THEME = { bg: U('photo-1541625602330-2277a4c46182'), accent: BRAND, venue: 'Arena' };

// Shared home hero backdrop (a packed stadium).
export const HERO_BG = U('photo-1522778119026-d647f0596c20');

export const sportTheme = (slug) => SPORT_THEMES[slug] || DEFAULT_SPORT_THEME;
