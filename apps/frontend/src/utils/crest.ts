import { readableOn, shade } from './color';

/**
 * Generated fallback artwork — original SVG data-URIs, computed on the fly.
 *
 * Real records often have no uploaded `logo`/`coverImage` yet. Rather than a bare
 * initials chip, a club/school gets an ORIGINAL crest built from its own initials
 * on a shield in its colours (identification, not any trademarked artwork), and a
 * person gets a generated avatar. The moment a real image is uploaded it wins —
 * these only fill the gap.
 */

const uri = (svg: string) => `data:image/svg+xml,${encodeURIComponent(svg.replace(/\s+/g, ' ').trim())}`;

const hue = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) % 360;
  return h;
};

const mono = (name: string, n = 3) =>
  (name || '?')
    .replace(/[^A-Za-z0-9\s]/g, ' ')
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, n)
    .join('')
    .toUpperCase() || '?';


// A stable colour from a name, when no club colour is known.
const autoColor = (name: string) => `hsl(${hue(name)} 55% 42%)`;
const hslToHex = (hsl: string) => {
  const m = /hsl\((\d+)/.exec(hsl);
  const h = m ? Number(m[1]) : 150;
  const s = 0.55; const l = 0.42;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const col = l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return Math.round(255 * col).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
};

/** A club / school crest from initials on a shield in the club's colour. */
export const crest = (name: string, primary?: string | null, secondary = '#F4B400', year?: number) => {
  const p = primary && primary.startsWith('#') ? primary : hslToHex(autoColor(name || 'x'));
  const ink = readableOn(p);
  const m = mono(name);
  const fs = m.length >= 3 ? 20 : 26;
  return uri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
      <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p}"/><stop offset="1" stop-color="${shade(p, -0.22)}"/></linearGradient></defs>
      <path d="M32 2 58 10 58 30 C58 46 46 56 32 62 18 56 6 46 6 30 L6 10 Z" fill="url(#g)" stroke="${secondary}" stroke-width="3"/>
      <path d="M6 24 H58" stroke="${secondary}" stroke-width="2" opacity="0.55"/>
      <text x="32" y="30" font-family="Arial, sans-serif" font-size="${fs}" font-weight="800" fill="${ink}" text-anchor="middle" dominant-baseline="middle">${m}</text>
      <text x="32" y="50" font-family="Arial, sans-serif" font-size="8" font-weight="700" fill="${ink}" opacity="0.85" text-anchor="middle">${year ?? 'RWANDA'}</text>
    </svg>`);
};

/** A person's avatar — bust silhouette on a two-tone gradient, hue seeded by name. */
export const avatar = (name: string) => {
  const h = hue(name || 'x');
  return uri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
      <defs><linearGradient id="b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${h} 55% 42%)"/><stop offset="1" stop-color="hsl(${(h + 40) % 360} 60% 30%)"/></linearGradient></defs>
      <rect width="64" height="64" fill="url(#b)"/>
      <circle cx="32" cy="25" r="11" fill="#ffffff" opacity="0.92"/>
      <path d="M14 60 C14 46 24 40 32 40 C40 40 50 46 50 60 Z" fill="#ffffff" opacity="0.92"/>
    </svg>`);
};

/** A wide cover graphic for sport/news/hero slots. */
export const cover = (seed: string, accent?: string) => {
  const h = hue(seed || 'x');
  const a = accent || `hsl(${h} 62% 38%)`;
  const b = shade(a.startsWith('#') ? a : hslToHex(a), -0.35);
  const c = `hsl(${(h + 25) % 360} 70% 55%)`;
  return uri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="c" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>
        <radialGradient id="glow" cx="0.75" cy="0.2" r="0.8"><stop offset="0" stop-color="${c}" stop-opacity="0.55"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient>
      </defs>
      <rect width="1200" height="675" fill="url(#c)"/><rect width="1200" height="675" fill="url(#glow)"/>
      <g opacity="0.12" stroke="#ffffff" stroke-width="3" fill="none"><circle cx="600" cy="337" r="120"/><path d="M0 500 L1200 250"/><path d="M0 620 L1200 370"/></g>
    </svg>`);
};
