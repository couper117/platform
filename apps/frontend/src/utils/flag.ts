/**
 * A nationality as a flag.
 *
 * `Player.nationality` is free text — "Rwandan", "USA", "DR Congo / Rwandan" — and
 * a squad list reads faster with flags than with a column of country adjectives,
 * particularly a league carrying eight nationalities across fourteen players.
 *
 * NOT EMOJI — IMAGES. A flag emoji is its ISO 3166-1 alpha-2 code written in
 * regional-indicator letters, which is elegant and does not work: WINDOWS SHIPS NO
 * FLAG GLYPHS AT ALL, so every Windows browser draws 🇷🇼 as a box containing the
 * letters "RW". On a Rwandan platform whose staff are on Windows that is worse than
 * the word it replaced. The ISO code is still what everything is keyed on; it just
 * addresses a 20px image instead of a code point.
 *
 * THE COUNTRY NAME IS NEVER LOST. `label` carries it for the image's alt text and
 * for anything that cannot load the image, and an unrecognised nationality falls
 * back to the text it came from, which is always better than nothing.
 */

/**
 * The nationalities that actually appear in this platform's data, mapped to their
 * ISO code. Keys are lowercase; both the adjective ("Rwandan") and the country
 * ("Rwanda") resolve, because the data holds both.
 */
const ISO: Record<string, string> = {
  rwanda: 'RW', rwandan: 'RW',
  usa: 'US', america: 'US', american: 'US', 'united states': 'US',
  canada: 'CA', canadian: 'CA',
  france: 'FR', french: 'FR',
  belgium: 'BE', belgian: 'BE',
  netherlands: 'NL', holland: 'NL', dutch: 'NL',
  spain: 'ES', spanish: 'ES',
  italy: 'IT', italian: 'IT',
  germany: 'DE', german: 'DE',
  greece: 'GR', greek: 'GR',
  'great britain': 'GB', british: 'GB',
  jamaica: 'JM', jamaican: 'JM',
  australia: 'AU', australian: 'AU',
  senegal: 'SN', senegalese: 'SN',
  nigeria: 'NG', nigerian: 'NG',
  'dr congo': 'CD', congo: 'CD', congolese: 'CD',
  burundi: 'BI', burundian: 'BI',
  uganda: 'UG', ugandan: 'UG',
  kenya: 'KE', kenyan: 'KE',
  tanzania: 'TZ', tanzanian: 'TZ',
  'south sudan': 'SS',
  cameroon: 'CM', ghana: 'GH', mali: 'ML', angola: 'AO',
  'burkina faso': 'BF', zambia: 'ZM', chad: 'TD',
  'central african republic': 'CF',
  "cote d'ivoire": 'CI', 'ivory coast': 'CI',
};

/** 20px wide is the size these are drawn at; asking for it saves the downscale. */
export const flagSrc = (iso: string) => `https://flagcdn.com/w20/${iso.toLowerCase()}.png`;

export type FlagPart = { iso: string | null; src: string | null; label: string };

/**
 * Split a nationality into its parts. "USA / Rwandan" is two flags, because a dual
 * national is two nationalities and showing only the first picks one for them.
 */
export const flagParts = (nationality?: string | null): FlagPart[] => {
  const raw = String(nationality || '').trim();
  if (!raw) return [];
  return raw
    .split(/\s*[/|,]\s*/)
    .filter(Boolean)
    .map((part) => {
      const iso = ISO[part.toLowerCase()] ?? null;
      return { iso, src: iso ? flagSrc(iso) : null, label: part };
    });
};

export default flagParts;
