#!/usr/bin/env node
/**
 * Attach crest images to teams.
 *
 *   node scripts/import-team-logos.mjs <folder>            # dry run — show matches
 *   node scripts/import-team-logos.mjs <folder> --apply    # convert, store, update
 *
 * Drop one image per club into <folder>, named after the club — "apr.png",
 * "rayon-sports.jpg", "mukura victory.webp". Matching is on the filename against
 * the team's name, short name and the aliases below, so exact spelling is not
 * required. Anything ambiguous or unmatched is reported and skipped rather than
 * guessed at: a crest on the wrong club is worse than no crest.
 *
 * Images are normalised the same way an upload through the API would be —
 * 512x512 WebP via sharp — and written to apps/backend/uploads/teams, which
 * app.ts serves at /uploads. Team.logo then holds that path.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const UPLOADS = path.join(ROOT, 'apps/backend/uploads/teams');

const prisma = new PrismaClient();
const [, , folderArg, ...flags] = process.argv;
const apply = flags.includes('--apply');
// Background removal is opt-in: it is guesswork on a screenshot, and a crest whose
// own colour resembles its backdrop (Mukura's yellow on white) gets eaten.
const cutout = flags.includes('--cutout');

// Clubs whose common name differs from what a file is likely called. Keys are
// matched loosely; the value is the substring hunted for in the team's own name.
const ALIASES = {
  apr: 'APR FC',
  rayon: 'Rayon Sports',
  police: 'Police FC',
  mukura: 'Mukura Victory Sports',
  mvs: 'Mukura Victory Sports',
  kiyovu: 'Kiyovu Sports',
  amagaju: 'Amagaju FC',
  rutsiro: 'Rutsiro FC Tsinda',
  tsinda: 'Rutsiro FC Tsinda',
  askigali: 'AS Kigali',
  musanze: 'Musanze FC',
  gorilla: 'Gorilla FC',
  etincelles: 'Etincelles FC',
};

const IMAGE_EXT = /\.(png|jpe?g|webp|gif|avif)$/i;

/**
 * Manual crops, keyed by the same loose token used for matching.
 *
 * Some sources are screenshots that include the club's name set beneath the
 * crest. Trimming cannot remove that — it is not uniform background — so the
 * crest region is stated explicitly. `height` is a fraction of the source, taken
 * from the top. Without this, APR's badge renders as a small shield with
 * "APR FC / UMURAVA - INTSINZI" underneath it, at crest size.
 */
const CROPS = {
  apr: { topFraction: 0.62 },
};

// Strip punctuation and the noise words every club name carries, so "APR_FC.png",
// "apr-fc.jpeg" and "APR FC logo.png" all reduce to the same token.
const normalize = (s) =>
  s.toLowerCase()
    .replace(IMAGE_EXT, '')
    .replace(/\b(fc|f\.c|logo|crest|badge|sports?|club|est|\d{4})\b/g, '')
    .replace(/[^a-z]/g, '');

/**
 * Find the crest inside a screenshot, and lift it off its background.
 *
 * sharp's own .trim() is no use on these: the sources are screenshots with
 * anti-aliased rounded corners, so trimming stops on the first corner pixel and
 * removes two pixels out of four hundred. Instead the background colour is
 * sampled from the edges (inset past the rounded corners), then:
 *
 *   - every pixel within `tolerance` of it that is reachable from the border is
 *     made transparent, so the crest sits on nothing rather than on a white or
 *     black tile — the difference between crests looking like one set and looking
 *     like a row of mismatched screenshots;
 *   - the opaque remainder gives the bounding box to crop to, so the crest fills
 *     its badge instead of floating in the middle of the source's padding.
 *
 * Flood fill from the border, not a global colour match: a white pixel inside
 * Rayon's shield or Police's dove is part of the crest and must survive.
 */
const liftCrest = async (input, { tolerance = 38, margin = 2, cutout: doCutout = false } = {}) => {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H, channels: C } = info;
  const at = (x, y) => (y * W + x) * C;

  // Sample the background from the edge midpoints, away from the rounded corners.
  const samples = [
    at(Math.floor(W / 2), 1), at(Math.floor(W / 2), H - 2),
    at(1, Math.floor(H / 2)), at(W - 2, Math.floor(H / 2)),
  ];
  const bg = [0, 1, 2].map((c) => Math.round(samples.reduce((n, p) => n + data[p + c], 0) / samples.length));
  const near = (p) =>
    Math.abs(data[p] - bg[0]) + Math.abs(data[p + 1] - bg[1]) + Math.abs(data[p + 2] - bg[2]) <= tolerance * 3;

  // Flood fill inward from every border pixel.
  const seen = new Uint8Array(W * H);
  const stack = [];
  for (let x = 0; x < W; x += 1) { stack.push([x, 0], [x, H - 1]); }
  for (let y = 0; y < H; y += 1) { stack.push([0, y], [W - 1, y]); }

  while (stack.length) {
    const [x, y] = stack.pop();
    if (x < 0 || y < 0 || x >= W || y >= H) continue;
    const i = y * W + x;
    if (seen[i]) continue;
    const p = at(x, y);
    // A rounded corner is not the background colour but is still outside the
    // crest, so anything already transparent is swallowed too.
    if (!near(p) && data[p + 3] > 8) continue;
    seen[i] = 1;
    if (doCutout) data[p + 3] = 0; // only erase when asked; otherwise just measure
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }

  // Bounding box of what survived.
  let minX = W, minY = H, maxX = -1, maxY = -1;
  for (let y = 0; y < H; y += 1) {
    for (let x = 0; x < W; x += 1) {
      // `seen` is everything the fill reached from the border — i.e. background.
      // What it never reached is the crest, whether or not alpha was changed.
      if (!seen[y * W + x]) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return sharp(input); // nothing survived — keep the original

  const left = Math.max(0, minX - margin);
  const top = Math.max(0, minY - margin);
  return sharp(data, { raw: { width: W, height: H, channels: C } })
    .extract({
      left, top,
      width: Math.min(W - left, maxX - minX + 1 + margin * 2),
      height: Math.min(H - top, maxY - minY + 1 + margin * 2),
    });
};

const run = async () => {
  if (!folderArg) {
    console.error('Usage: node scripts/import-team-logos.mjs <folder> [--apply]');
    process.exitCode = 1;
    return;
  }

  const folder = path.resolve(folderArg);
  if (!fs.existsSync(folder)) {
    console.error(`No such folder: ${folder}`);
    process.exitCode = 1;
    return;
  }

  const files = fs.readdirSync(folder).filter((f) => IMAGE_EXT.test(f));
  if (files.length === 0) {
    console.error(`No images in ${folder} (looked for png, jpg, webp, gif, avif).`);
    process.exitCode = 1;
    return;
  }

  const teams = await prisma.team.findMany({
    select: { id: true, name: true, shortName: true, logo: true },
    orderBy: { id: 'asc' },
  });

  console.log(`${apply ? 'APPLYING' : 'Dry run'} — ${files.length} image(s), ${teams.length} teams\n`);

  const matched = [];
  const unmatched = [];

  for (const file of files) {
    const token = normalize(file);
    const aliasTarget = Object.entries(ALIASES).find(([k]) => token.includes(normalize(k)))?.[1];

    // An exact alias hit is decisive. Without this, "APR FC.png" also matches
    // APR BBC — same club, different sport — and the file is skipped as ambiguous
    // when its intent was never in doubt.
    const exact = aliasTarget ? teams.filter((t) => t.name === aliasTarget) : [];
    const candidates = exact.length === 1 ? exact : teams.filter((t) => {
      const name = normalize(t.name);
      const short = normalize(t.shortName || '');
      return (token && name.includes(token)) || (short && token === short);
    });

    if (candidates.length === 1) {
      matched.push({ file, team: candidates[0] });
    } else {
      unmatched.push({ file, token, reason: candidates.length === 0 ? 'no team matched' : `matched ${candidates.length} teams: ${candidates.map((c) => c.name).join(', ')}` });
    }
  }

  for (const { file, team } of matched) {
    process.stdout.write(`  ${file.padEnd(34)} -> ${team.name}${team.logo ? ' (replacing existing)' : ''}`);
    if (!apply) { console.log(''); continue; }

    // 1. Crop away any caption baked into the source.
    let img = sharp(fs.readFileSync(path.join(folder, file)));
    const token = normalize(file);
    const crop = Object.entries(CROPS).find(([k]) => token.includes(normalize(k)))?.[1];
    if (crop?.topFraction) {
      const meta = await img.metadata();
      img = sharp(await img
        .extract({ left: 0, top: 0, width: meta.width, height: Math.round(meta.height * crop.topFraction) })
        .toBuffer());
    }

    // 2. Lift the crest off its background and crop to it.
    img = await liftCrest(await img.png().toBuffer(), { cutout });

    // 3. Fit the crest to the badge. `contain` never crops the logo, so a wide
    //    mark like Mukura's oval fills the width and bands top and bottom rather
    //    than losing its ends.
    const webp = await img
      .resize(512, 512, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .webp({ quality: 90 })
      .toBuffer();

    fs.mkdirSync(UPLOADS, { recursive: true });
    // Named for the team, not a UUID: these are seeded reference crests, and a
    // stable filename means re-running replaces rather than accumulates.
    const name = `${team.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}.webp`;
    fs.writeFileSync(path.join(UPLOADS, name), webp);

    await prisma.team.update({ where: { id: team.id }, data: { logo: `/uploads/teams/${name}` } });
    console.log(`  -> /uploads/teams/${name}`);
  }

  if (unmatched.length) {
    console.log('\n  Skipped:');
    for (const u of unmatched) console.log(`    ${u.file.padEnd(34)} ${u.reason}`);
  }

  const without = teams.filter((t) => !t.logo && !matched.some((m) => m.team.id === t.id));
  if (without.length) {
    console.log(`\n  Still without a crest: ${without.map((t) => t.name).join(', ')}`);
  }

  console.log(`\n${apply ? `Done. ${matched.length} crest(s) attached.` : `${matched.length} would be attached. Re-run with --apply.`}`);
};

run()
  .catch((e) => { console.error('Failed:', e.message); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
