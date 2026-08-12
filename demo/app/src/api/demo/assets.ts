/**
 * Offline image generator for the static showcase build.
 *
 * Every "photo" and "logo" in the demo is an ORIGINAL vector graphic produced
 * here at runtime and handed to the app as a `data:image/svg+xml` URI. Nothing
 * is fetched, so the build runs with no network — the whole point of the pitch
 * demo — and nothing reproduces a real club's trademarked artwork: a crest is
 * the club's own initials set on a shield in its real kit colours, which is
 * identification, not imitation.
 *
 * responsiveImage() passes an unknown-host URL (a data URI included) straight
 * through as `src` with no srcSet rewriting, so these render in <ClubCrest> and
 * <Avatar> exactly like a hosted image would.
 *
 * OVERRIDE PATH: drop a real file at demo/public and pass its URL instead — the
 * data here is the only thing that references these generators, so swapping a
 * `logo:` value to '/logos/apr.png' is a one-line change per team.
 */

const uri = (svg: string) => `data:image/svg+xml,${encodeURIComponent(svg.replace(/\s+/g, ' ').trim())}`;

/** Deterministic 0–360 hue from a string, so a given name always looks the same. */
const hue = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) % 360;
  return h;
};

/** Initials for a monogram: up to `n` leading letters of the words. */
const mono = (name: string, n = 3) =>
  (name || '?')
    .replace(/[^A-Za-z0-9\s]/g, ' ')
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, n)
    .join('')
    .toUpperCase() || '?';

const readableOn = (hex: string) => {
  const h = hex.replace('#', '');
  if (h.length !== 6) return '#ffffff';
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  // Perceived luminance — dark backgrounds get white text, light get near-black.
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6 ? '#0b0b0f' : '#ffffff';
};

/**
 * A club / school crest: a shield in the club's colour with its monogram and a
 * founding-year ribbon. `secondary` accents the border and star.
 */
export const crest = (name: string, primary = '#0B6E3F', secondary = '#F4B400', year?: number) => {
  const ink = readableOn(primary);
  const m = mono(name);
  const fs = m.length >= 3 ? 20 : 26;
  return uri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${primary}"/>
          <stop offset="1" stop-color="${shade(primary, -0.22)}"/>
        </linearGradient>
      </defs>
      <path d="M32 2 58 10 58 30 C58 46 46 56 32 62 18 56 6 46 6 30 L6 10 Z"
            fill="url(#g)" stroke="${secondary}" stroke-width="3"/>
      <path d="M6 24 H58" stroke="${secondary}" stroke-width="2" opacity="0.55"/>
      <text x="32" y="30" font-family="Arial, sans-serif" font-size="${fs}" font-weight="800"
            fill="${ink}" text-anchor="middle" dominant-baseline="middle">${m}</text>
      <text x="32" y="50" font-family="Arial, sans-serif" font-size="8" font-weight="700"
            fill="${ink}" opacity="0.85" text-anchor="middle">${year ?? 'RWANDA'}</text>
    </svg>`);
};

/**
 * A person's avatar: a bust silhouette on a two-tone gradient, hue seeded by the
 * name so a roster of 20 reads as 20 distinct people. Round crop handled by the
 * <Avatar> component (object-cover on a rounded-pill).
 */
export const avatar = (name: string) => {
  const h = hue(name);
  const a = `hsl(${h} 55% 42%)`;
  const b = `hsl(${(h + 40) % 360} 60% 30%)`;
  return uri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
      <defs>
        <linearGradient id="b" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/>
        </linearGradient>
      </defs>
      <rect width="64" height="64" fill="url(#b)"/>
      <circle cx="32" cy="25" r="11" fill="#ffffff" opacity="0.92"/>
      <path d="M14 60 C14 46 24 40 32 40 C40 40 50 46 50 60 Z" fill="#ffffff" opacity="0.92"/>
    </svg>`);
};

/**
 * A wide cover graphic for news / hero / ad slots: a diagonal two-tone field
 * with a soft glow. `seed` varies the hue; `accent` can pin it to brand green.
 */
export const cover = (seed: string, accent?: string) => {
  const h = hue(seed);
  const a = accent || `hsl(${h} 62% 38%)`;
  const b = shade(a.startsWith('#') ? a : hslToHex(h, 62, 38), -0.35);
  const c = `hsl(${(h + 25) % 360} 70% 55%)`;
  return uri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="c" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/>
        </linearGradient>
        <radialGradient id="glow" cx="0.75" cy="0.2" r="0.8">
          <stop offset="0" stop-color="${c}" stop-opacity="0.55"/>
          <stop offset="1" stop-color="${c}" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="1200" height="675" fill="url(#c)"/>
      <rect width="1200" height="675" fill="url(#glow)"/>
      <g opacity="0.12" stroke="#ffffff" stroke-width="3" fill="none">
        <circle cx="600" cy="337" r="120"/>
        <path d="M0 500 L1200 250" /><path d="M0 620 L1200 370"/>
      </g>
    </svg>`);
};

/* ── colour helpers ─────────────────────────────────────────────────────── */

function shade(hex: string, t: number) {
  const h = hex.replace('#', '');
  if (h.length !== 6) return hex;
  const out = [0, 2, 4]
    .map((i) => {
      const v = parseInt(h.slice(i, i + 2), 16);
      const target = t < 0 ? 0 : 255;
      return Math.round(v + (target - v) * Math.abs(t));
    })
    .map((v) => v.toString(16).padStart(2, '0'))
    .join('');
  return `#${out}`;
}

function hslToHex(h: number, s: number, l: number) {
  s /= 100; l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const col = l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return Math.round(255 * col).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}
