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

/* ─── minimum-luminance clamp ──────────────────────────────────────────
 * Several real club colours are dark navy, maroon or near-black. Police FC's
 * #12386E against the #17171A dark surface is 1.2:1 — the 3px identity bar is
 * effectively invisible, so the identity system stops reading as a system.
 *
 * So a club colour is lifted until it clears 3:1 against the dark surface (the
 * WCAG floor for a graphical object, which is what the bar is). Lightening only,
 * never darkening: raising luminance for dark also keeps the colour comfortably
 * clear of a white surface, so one clamp serves both themes.
 *
 * Hue is preserved by blending toward white, so a dark navy becomes a lighter
 * navy — still recognisably the club's colour, just visible.
 *
 * KNOWN LIMITATION: a very LIGHT club colour (a yellow, say) has poor contrast
 * against the light theme's white surface. Dark is the primary theme and is
 * fixed here; if light mode ever becomes a QA gate, this needs a second,
 * theme-aware bound.
 */

/** Relative luminance of an #RRGGBB string, per WCAG. */
const luminance = (hex) => {
  const h = hex.replace('#', '');
  if (h.length !== 6) return null;
  const ch = [0, 2, 4].map((i) => {
    const s = parseInt(h.slice(i, i + 2), 16) / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
};

// Luminance of --surface in dark (#17171A) is ~0.0116. For 3:1 we need
// (L + 0.05) / (0.0116 + 0.05) >= 3, i.e. L >= 0.1348.
const MIN_LUMINANCE = 0.135;

const mixToWhite = (hex, t) => {
  const h = hex.replace('#', '');
  const out = [0, 2, 4]
    .map((i) => {
      const v = parseInt(h.slice(i, i + 2), 16);
      return Math.round(v + (255 - v) * t);
    })
    .map((v) => v.toString(16).padStart(2, '0'))
    .join('');
  return `#${out}`;
};

/** Lift `hex` toward white until it is visible on the dark surface. */
const clampLuminance = (hex) => {
  const l = luminance(hex);
  if (l == null || l >= MIN_LUMINANCE) return hex;
  // Walk in 5% steps rather than solving analytically — the perceptual result is
  // smoother and it terminates in at most 20 iterations.
  for (let t = 0.05; t <= 1; t += 0.05) {
    const candidate = mixToWhite(hex, t);
    if (luminance(candidate) >= MIN_LUMINANCE) return candidate;
  }
  return hex;
};

/**
 * Resolve a club's identity colour, clamped so it is actually visible.
 * @param   {{name?: string, slug?: string, primaryColor?: string}} team
 * @returns {string|null} a CSS colour, or null when unknown (caller falls back
 *                        to the neutral hairline — never invent a hue).
 */
export const clubColor = (team) => {
  if (!team) return null;
  // Forward-compatible: the moment the API ships a colour, it wins outright and
  // this whole file becomes dead weight. It gets clamped too — a club colour
  // entered by an admin is just as likely to be an invisible navy.
  const raw = team.primaryColor || KNOWN[key(team.slug || team.name || '')]?.color;
  return raw ? clampLuminance(raw) : null;
};

/** Exported for the /design-system route, which shows raw vs clamped. */
export const rawClubColor = (team) => {
  if (!team) return null;
  return team.primaryColor || KNOWN[key(team.slug || team.name || '')]?.color || null;
};

/** All known entries — used by the /design-system route to show coverage. */
export const knownClubColors = () => Object.entries(KNOWN).map(([k, v]) => ({ key: k, ...v }));

export default clubColor;
