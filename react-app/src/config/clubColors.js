/**
 * ⚠️ TEMPORARY STOPGAP — delete this file once the backend ships colours.
 *
 * Club identity colour is runtime data that the API does not yet expose. The
 * `Team` model has no `primaryColor`; `jerseyHome`/`jerseyAway` exist but are
 * written by nothing, read by nothing, and badly named — do not build on them.
 *
 * MIGRATION (one commit, no component changes):
 *   1. Backend adds `Team.primaryColor` / `Team.secondaryColor` + admin fields.
 *   2. Pass `team.primaryColor` straight into <ClubCrest color> / the identity
 *      bar, which already accept an optional colour.
 *   3. Delete this file and its import.
 *
 * WHY ENTRIES ARE MISSING RATHER THAN GUESSED
 * A wrong club colour is worse than no colour: Rwandan fans know these clubs,
 * and an arbitrary hue on a familiar crest reads as a bug, not as missing data.
 * So this map holds only colours that are genuinely known. Every other club
 * falls back to `--club: var(--hairline)` — a neutral 1px accent that reads as
 * deliberate. Fill the TODO block below from real kit references; each addition
 * is inert until it lands and needs no component change.
 */

/** Normalise a club name to a lookup key: casefold, drop punctuation + noise. */
const key = (name = '') =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\b(fc|bbc|sports?|club|as|united|victory)\b/g, '')
    .replace(/\s+/g, '')
    .trim();

/**
 * Known club colours. Values are the club's primary kit colour.
 * `confidence: 'high'` = unmistakable, widely-recognised identity.
 */
const KNOWN = {
  // ─── Football — Rwanda Premier League ────────────────────────────
  rayon: { color: '#1D4ED8', label: 'Rayon Sports', confidence: 'high' }, // blue & white
  apr: { color: '#0B6E3F', label: 'APR FC', confidence: 'high' }, // green & white
  kiyovu: { color: '#0F7A3D', label: 'Kiyovu Sports', confidence: 'medium' }, // green & white
  police: { color: '#12386E', label: 'Police FC', confidence: 'medium' }, // dark blue

  // ─── Basketball ──────────────────────────────────────────────────
  patriots: { color: '#1D4ED8', label: 'Patriots BBC', confidence: 'medium' }, // blue
};

/**
 * TODO — needs someone with real kit references. Add to KNOWN above as
 * `<key>: { color: '#RRGGBB', label: '…', confidence: 'high' }`.
 *
 * Football:   AS Kigali · Mukura Victory Sports · Musanze FC · Gasogi United
 *             Etincelles FC · Bugesera FC · Marines FC · Gorilla FC
 *             Interforce FC · Amagaju FC · Rutsiro FC · Sunrise FC
 *             Heroes FC · Vision FC · Espoir FC
 * Basketball: REG BBC · Espoir BBC · APR BBC · IPRC BBC
 *
 * I left these out on purpose rather than guessing — see the note at the top.
 */

/**
 * Resolve a club's identity colour.
 * @param   {{name?: string, slug?: string, primaryColor?: string}} team
 * @returns {string|null} a CSS colour, or null when unknown (caller falls back
 *                        to the neutral hairline — never invent a hue).
 */
export const clubColor = (team) => {
  if (!team) return null;
  // Forward-compatible: the moment the API ships a colour, it wins outright and
  // this whole file becomes dead weight.
  if (team.primaryColor) return team.primaryColor;
  const entry = KNOWN[key(team.slug || team.name || '')];
  return entry?.color ?? null;
};

/** All known entries — used by the /design-system route to show coverage. */
export const knownClubColors = () => Object.entries(KNOWN).map(([k, v]) => ({ key: k, ...v }));

export default clubColor;
