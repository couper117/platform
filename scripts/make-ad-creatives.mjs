/**
 * Builds the demo's ad creatives.
 *
 * The mock ads used to point at `cover(seed, accent)` — the same generated
 * abstract gradient the app uses for a missing article photo. In an ad slot that
 * reads as a placeholder that never loaded, not as an advert, which makes the
 * revenue surface look broken in a demo whose whole job is to look finished.
 *
 * These are real banners instead: one of the Rwandan sport photographs from
 * public/hero cover-cropped to the size the placement is actually sold at, a
 * scrim, a sponsor wordmark, a line of copy and a call to action — the anatomy
 * of an advert. Wordmarks are set in plain type, not the sponsors' real logos:
 * this is illustrative inventory, the same as every other record in mockData.
 *
 * FOUR SHAPES PER SPONSOR, because a placement is a shape.
 *   `-lg`  1456x180  the 728x90 leaderboard, above a desktop content column
 *   `-mb`   960x300  the 320x100 large mobile banner, in a phone column
 *   `-mr`   600x500  the 300x250 medium rectangle, in a desktop rail
 *   `-sk`  320x1200  the 160x600 wide skyscraper, in the page gutter
 *   `-skn` 240x1200  the 120x600 skyscraper, for a gutter too narrow for `-sk`
 * One creative stretched across all three is what produced a 358x63 letterbox with
 * the wordmark cropped off; a page banner and a sidebar unit are not the same
 * advert at different sizes.
 *
 * EVERY POSITION IS AN EXPLICIT PIXEL, not a ratio of the canvas. The first pass
 * derived type sizes and pill widths from the height, which put a 34px wordmark
 * and a 133px button in the same 200px of panel — the button landed on top of the
 * brand name. Sharp has no text metrics, so each shape is laid out by hand and
 * eyeballed once, which is what a real banner set is anyway.
 *
 * Run from the repo root: `node scripts/make-ad-creatives.mjs`. Output is
 * committed to both apps' public/ads, so this only needs re-running when a
 * creative or its source photograph changes.
 */
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const HERO = 'apps/frontend/public/hero';
const OUT = ['apps/frontend/public/ads', 'demo/app/public/ads'];
OUT.forEach((d) => fs.mkdirSync(d, { recursive: true }));

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const FONT = 'Segoe UI, Arial, Helvetica, sans-serif';

// Segoe UI Bold at 1em averages ~0.60em per uppercase glyph. Close enough to size
// a pill that has 22px of breathing room on each side of the label.
const pillWidth = (label, size) => Math.round(label.length * size * 0.62 + 44);

const pill = ({ x, y, label, size, height, accent, anchor = 'start' }) => {
  const w = pillWidth(label, size);
  const left = anchor === 'end' ? x - w : x;
  return `<rect x="${left}" y="${y}" rx="${height / 2}" width="${w}" height="${height}" fill="${accent}"/>
  <text x="${left + w / 2}" y="${y + height / 2 + size * 0.35}" text-anchor="middle" font-family="${FONT}" font-size="${size}" font-weight="700" fill="#fff" letter-spacing="0.6">${esc(label)}</text>`;
};

/** Landscape banner: photo, a left-to-right scrim, wordmark + line, CTA at the right. */
const banner = (c) => {
  const { w, h, pad, brandSize, lineSize, ctaSize, ctaH } = c;
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <defs>
    <linearGradient id="scrim" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#000" stop-opacity="0.86"/>
      <stop offset="0.62" stop-color="#000" stop-opacity="0.48"/>
      <stop offset="1" stop-color="#000" stop-opacity="0.18"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#scrim)"/>
  <rect x="0" y="0" width="${Math.round(h * 0.05)}" height="${h}" fill="${c.accent}"/>
  <text x="${pad}" y="${h / 2 - lineSize * 0.5}" font-family="${FONT}" font-size="${brandSize}" font-weight="700" fill="#fff" letter-spacing="-0.5">${esc(c.brand)}</text>
  <text x="${pad}" y="${h / 2 + lineSize * 1.5}" font-family="${FONT}" font-size="${lineSize}" font-weight="400" fill="#fff" fill-opacity="0.82">${esc(c.line)}</text>
  ${pill({ x: w - pad, y: (h - ctaH) / 2, label: c.cta, size: ctaSize, height: ctaH, accent: c.accent, anchor: 'end' })}
</svg>`);
};

/** Medium rectangle: photo on top, a solid brand panel beneath it. */
const rectangle = (c) => {
  const { w, h, split, pad, brandSize, lineSize, ctaSize, ctaH } = c;
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <defs>
    <linearGradient id="top" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#000" stop-opacity="0.05"/>
      <stop offset="1" stop-color="#000" stop-opacity="0.45"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${split}" fill="url(#top)"/>
  <rect y="${split}" width="${w}" height="${h - split}" fill="#0F1113"/>
  <rect y="${split}" width="${w}" height="6" fill="${c.accent}"/>
  <text x="${pad}" y="${split + pad + brandSize * 0.8}" font-family="${FONT}" font-size="${brandSize}" font-weight="700" fill="#fff" letter-spacing="-0.5">${esc(c.brand)}</text>
  <text x="${pad}" y="${split + pad + brandSize + lineSize * 1.5}" font-family="${FONT}" font-size="${lineSize}" font-weight="400" fill="#fff" fill-opacity="0.72">${esc(c.line)}</text>
  ${pill({ x: pad, y: h - pad - ctaH, label: c.cta, size: ctaSize, height: ctaH, accent: c.accent })}
</svg>`);
};

/**
 * Naive word wrap.
 *
 * A skyscraper is 160 CSS px wide. "Bank of Kigali" set on one line at a legible
 * size is half again wider than the whole unit, so the vertical shape is the one
 * that cannot assume a single line. Sharp has no text metrics, so this measures in
 * estimated glyph widths — generous enough that a wrong guess breaks early rather
 * than overflowing the canvas.
 */
const wrap = (text, maxWidth, size, ratio = 0.58) => {
  const per = size * ratio;
  const out = [];
  let line = '';
  for (const word of text.split(' ')) {
    const next = line ? `${line} ${word}` : word;
    if (next.length * per > maxWidth && line) {
      out.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) out.push(line);
  return out;
};

const lines = (items, x, y, lineHeight, attrs) =>
  items.map((l, i) => `<text x="${x}" y="${y + i * lineHeight}" ${attrs}>${esc(l)}</text>`).join('\n  ');

/**
 * Wide skyscraper: one full-bleed photograph, the copy over a scrim at its foot.
 *
 * IT IS NOT THE RECTANGLE MADE TALLER. The first attempt split the canvas into a
 * photo and a solid panel like `rectangle` does, and both halves failed. A 3:2
 * landscape cover-cropped into a 320x660 window is a vertical SLICE of the frame —
 * the cycling shot came out as a blurry telegraph pole — and the panel underneath
 * was so tall that 300px of it sat empty between the copy and the button.
 *
 * Full-bleed with a heavy foot scrim solves both. The photograph becomes texture
 * rather than subject, so a bad crop costs nothing, and there is no panel left to
 * go empty. Same reasoning as the sign-in side panel, which is the same shape
 * problem at a larger size.
 */
const skyscraper = (c) => {
  const { w, h, pad, brandSize, lineSize, ctaSize, ctaH } = c;
  const inner = w - pad * 2;
  const brandLines = wrap(c.brand, inner, brandSize, 0.62);
  const copyLines = wrap(c.line, inner, lineSize);

  // Build the stack upward from the button so the block always sits the same
  // distance off the bottom edge however many lines the wrapper produced.
  const ctaY = h - pad - ctaH;
  const copyBlock = copyLines.length * (lineSize * 1.35);
  const copyY = ctaY - 34 - copyBlock + lineSize;
  const brandY = copyY - lineSize * 0.9 - (brandLines.length - 1) * (brandSize * 1.1) - brandSize * 0.35;

  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <defs>
    <linearGradient id="foot" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#000" stop-opacity="0.15"/>
      <stop offset="0.42" stop-color="#000" stop-opacity="0.72"/>
      <stop offset="1" stop-color="#000" stop-opacity="0.95"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#foot)"/>
  <rect x="0" y="0" width="10" height="${h}" fill="${c.accent}"/>
  ${lines(brandLines, pad, brandY, brandSize * 1.1, `font-family="${FONT}" font-size="${brandSize}" font-weight="700" fill="#fff" letter-spacing="-0.5"`)}
  ${lines(copyLines, pad, copyY, lineSize * 1.35, `font-family="${FONT}" font-size="${lineSize}" font-weight="400" fill="#fff" fill-opacity="0.78"`)}
  ${pill({ x: pad, y: ctaY, label: c.cta, size: ctaSize, height: ctaH, accent: c.accent })}
</svg>`);
};

/** Per-shape geometry, shared by every sponsor. */
const SHAPES = {
  lg: { suffix: '-lg', shape: banner, crop: 'attention', w: 1456, h: 180, pad: 56, brandSize: 42, lineSize: 20, ctaSize: 16, ctaH: 48 },
  mb: { suffix: '-mb', shape: banner, crop: 'attention', w: 960, h: 300, pad: 44, brandSize: 46, lineSize: 22, ctaSize: 17, ctaH: 52 },
  mr: { suffix: '-mr', shape: rectangle, crop: 'centre', w: 600, h: 500, split: 300, pad: 34, brandSize: 36, lineSize: 18, ctaSize: 15, ctaH: 44 },
  sk: { suffix: '-sk', shape: skyscraper, crop: 'centre', w: 320, h: 1200, pad: 26, brandSize: 34, lineSize: 17, ctaSize: 14, ctaH: 44 },
  // The classic 120x600. NOT `-sk` scaled down: at 1:5 rather than 1:3.75 a
  // cover-crop of the wide creative would slice 20px off each side and take the
  // left-aligned wordmark and the button with it.
  skn: { suffix: '-skn', shape: skyscraper, crop: 'centre', w: 240, h: 1200, pad: 20, brandSize: 28, lineSize: 15, ctaSize: 12, ctaH: 38 },
};

/**
 * The sponsor book.
 *
 * Six advertisers rather than one, because the point of filling every page with
 * inventory is showing a media buyer that the site can carry a schedule — the same
 * banner on nine screens reads as one house ad, not as sold space. Each takes a
 * photograph from a sport it plausibly sponsors.
 */
/**
 * `shapes` limits which sizes a sponsor is built in. The six page advertisers take
 * the three page shapes; the two takeover advertisers take the two skyscrapers and
 * nothing else. Building every sponsor in every shape produced twelve files no
 * placement ever asked for.
 *
 * `skPhoto` overrides the source for the SKYSCRAPERS. A 320x1200 window is a
 * vertical slice, so the frame has to have a tall subject standing in the middle
 * of it or the crop returns scenery — the cycling photograph is a rider across a
 * wide frame and, sliced, came out as a blurry telegraph pole.
 */
const SPONSORS = [
  { key: 'inyange', photo: 'athletics.jpg', shapes: ['lg', 'mb', 'mr'], accent: '#1D4ED8',
    brand: 'INYANGE', line: 'Official hydration partner of Rwandan sport', cta: 'DISCOVER' },
  { key: 'bk-arena', photo: 'basketball.jpg', shapes: ['lg', 'mb', 'mr'], accent: '#0B6E3F',
    brand: 'BK ARENA', line: 'Matchday, the way it should feel', cta: 'GET TICKETS' },
  { key: 'mtn', photo: 'football.jpg', shapes: ['lg', 'mb', 'mr'], accent: '#F59E0B',
    brand: 'MTN Rwanda', line: 'Powering every league, every matchday', cta: 'LEARN MORE' },
  { key: 'skol', photo: 'volleyball.jpg', shapes: ['lg', 'mb', 'mr'], accent: '#C81E1E',
    brand: 'SKOL', line: 'Proud sponsor of the national leagues', cta: 'EXPLORE' },
  { key: 'bank-of-kigali', photo: 'cycling.jpg', shapes: ['lg', 'mb', 'mr'], accent: '#111C4E',
    brand: 'Bank of Kigali', line: 'Backing Rwandan athletes since 1966', cta: 'OPEN AN ACCOUNT' },
  { key: 'rwandair', photo: 'handball.jpg', shapes: ['lg', 'mb', 'mr'], accent: '#0E7490',
    brand: 'RwandAir', line: 'Flying the national teams to every fixture', cta: 'BOOK NOW' },

  // TAKEOVER-ONLY, and only in the skyscraper shape. The gutter pair is sold
  // run-of-site, so whichever advertiser holds it appears beside every page — if
  // it came out of the same six the pages rotate through, a reader would sooner or
  // later meet the same brand in the gutter and in the page banner at once. These
  // two are never in the page rotation, so that cannot happen.
  { key: 'primus', photo: 'football.jpg', skPhoto: 'football.jpg', accent: '#B8860B', shapes: ['sk', 'skn'],
    brand: 'PRIMUS', line: 'The beer of Rwandan football', cta: 'FIND A BAR' },
  { key: 'canal-plus', photo: 'basketball.jpg', skPhoto: 'basketball-finals.jpg', accent: '#111827', shapes: ['sk', 'skn'],
    brand: 'CANAL+', line: 'Every match, live in your living room', cta: 'SUBSCRIBE' },
];

let bytes = 0;
let count = 0;
for (const s of SPONSORS) {
  for (const [key, shape] of Object.entries(SHAPES)) {
    if (s.shapes && !s.shapes.includes(key)) continue;
    const c = { ...shape, ...s };
    const buf = await sharp(path.join(HERO, (shape.suffix.startsWith('-sk') && s.skPhoto) || s.photo))
      .resize(c.w, c.h, { fit: 'cover', position: c.crop })
      .composite([{ input: c.shape(c) }])
      .jpeg({ quality: 80, mozjpeg: true })
      .toBuffer();
    const name = `${s.key}${shape.suffix}.jpg`;
    for (const dir of OUT) fs.writeFileSync(path.join(dir, name), buf);
    bytes += buf.length;
    count += 1;
    console.log(`${name.padEnd(26)} ${c.w}x${c.h}  ${(buf.length / 1024).toFixed(0)} KB`);
  }
}
console.log(`
${count} files from ${SPONSORS.length} sponsors, ${(bytes / 1024 / 1024).toFixed(1)} MB total`);
