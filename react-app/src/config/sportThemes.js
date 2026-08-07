// Per-sport visual identity: a Rwanda-themed background + accent colour + venue
// label. Keyed by sport slug; falls back to a generic Rwanda scene. Each sport
// reuses Rwandan imagery (hills, Kigali, stadiums) tinted with its accent.
// Base URL only — width is chosen per-device by utils/responsiveImage.js, which
// builds a srcSet from this. Never hardcode a width here (it used to be 1920,
// which every phone downloaded in full).
const U = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&q=75`;

// Sports-action backdrops per game (verified to load). These are DEFAULTS —
// SportHubPage prefers a sport's `coverImage` from the DB, so MINISPORTS can
// upload real Rwandan match photos that override these.
export const SPORT_THEMES = {
  football:   { bg: U('photo-1522778119026-d647f0596c20'), accent: '#16a34a', venue: 'Pitch' },
  basketball: { bg: U('photo-1546519638-68e109498ffc'),    accent: '#f97316', venue: 'Court' },
  volleyball: { bg: U('photo-1592656094267-764a45160876'), accent: '#3b82f6', venue: 'Court' },
  cycling:    { bg: U('photo-1541625602330-2277a4c46182'), accent: '#eab308', venue: 'Road' },
  cricket:    { bg: U('photo-1531415074968-036ba1b575da'), accent: '#10b981', venue: 'Pitch' },
  rugby:      { bg: U('photo-1574280363402-2f672940b871'), accent: '#15803d', venue: 'Field' },
  handball:   { bg: U('photo-1612872087720-bb876e2e67d1'), accent: '#0ea5e9', venue: 'Court' },
  athletics:  { bg: U('photo-1461896836934-ffe607ba8211'), accent: '#ef4444', venue: 'Track' },
};

export const DEFAULT_SPORT_THEME = { bg: U('photo-1522778119026-d647f0596c20'), accent: '#E8002D', venue: 'Arena' };

// Shared home hero backdrop (a packed stadium).
export const HERO_BG = U('photo-1522778119026-d647f0596c20');

export const sportTheme = (slug) => SPORT_THEMES[slug] || DEFAULT_SPORT_THEME;
