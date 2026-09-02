/**
 * Installs the Amashuri Games photography into both apps' public/amashuri.
 *
 * WHY A SEPARATE FOLDER FROM public/hero. /hero is the national-league rotation —
 * professional athletes, senior competition. Amashuri is school sport, and the two
 * sets are not interchangeable: a Tour du Rwanda peloton is the wrong picture for
 * an inter-school championship, and a primary-school games day is the wrong picture
 * for the Premier League.
 *
 * EVERY FILE WAS OPENED AND LOOKED AT before it was added, the same rule
 * public/hero/CREDITS.md records. Three candidates were downloaded and rejected on
 * sight: a portrait photograph of a Catholic cathedral facade filed under
 * "secondary school" (a church, not a campus), a biogas digester in a school yard,
 * and a school kitchen stove — all correctly tagged "school in Rwanda" and all
 * useless as sport photography.
 *
 * LICENSING. Sources and authors are written to CREDITS.md beside the images. The
 * CC BY-SA files REQUIRE attribution, which is why the pages print a credit line.
 * Replace any of these with MINISPORTS' own photography at the same filename and
 * set `credit: null` in config/amashuriMedia.ts — nothing else changes.
 *
 * Run from the repo root: `node scripts/import-amashuri-photos.mjs`.
 */
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const SRC = 'C:/Users/user/AppData/Local/Temp/claude/scan/school-candidates';
const OUT = ['apps/frontend/public/amashuri', 'demo/app/public/amashuri'];
OUT.forEach((d) => fs.mkdirSync(d, { recursive: true }));

const FILES = [
  {
    src: 'guconga-ruhago.jpg',
    out: 'games-day.jpg',
    title: 'Inter-school games day',
    credit: 'Germain92',
    licence: 'CC BY-SA 4.0',
    page: 'https://commons.wikimedia.org/wiki/File:Guconga_ruhago.jpg',
    note: 'Schoolchildren playing football at a school games gathering ("karere").',
  },
  {
    src: 'kageyo-high-school.jpg',
    out: 'campus.jpg',
    title: 'Kageyo High School',
    credit: 'Tuyishimejosue',
    licence: 'CC0',
    page: 'https://commons.wikimedia.org/wiki/File:Kageyo_high_school.jpg',
    note: 'Secondary school campus — the default cover for a school with no photo.',
  },
  {
    src: 'juru-secondary-school-smart-classroom.jpg',
    out: 'classroom.jpg',
    title: 'Juru Secondary School smart classroom',
    credit: 'Joachim Hauschopp',
    licence: 'CC0',
    page: 'https://commons.wikimedia.org/wiki/File:Juru_Secondary_School_Smart_Classroom.jpg',
    note: null,
  },
  {
    src: 'wiki-clubs-closing-ceremonies-32.jpg',
    out: 'students.jpg',
    title: 'Rwandan secondary students',
    credit: 'Annick green',
    licence: 'CC BY-SA 4.0',
    page: 'https://commons.wikimedia.org/wiki/File:Wiki_clubs_closing_ceremonies_32.jpg',
    note: null,
  },
  {
    src: 'nyagatareschool.jpg',
    out: 'hills-campus.jpg',
    title: 'School complex, Nyagatare',
    credit: 'Stratogan',
    licence: 'Public domain',
    page: 'https://commons.wikimedia.org/wiki/File:NyagatareSchool.jpg',
    note: null,
  },
];

const rows = [];
for (const f of FILES) {
  const buf = await sharp(path.join(SRC, f.src))
    // 1600 wide is the largest these are ever drawn: a full-bleed section banner on
    // a desktop content column. Anything more is bytes nobody sees.
    .resize(1600, 900, { fit: 'cover', position: 'attention' })
    .jpeg({ quality: 80, mozjpeg: true })
    .toBuffer();
  for (const dir of OUT) fs.writeFileSync(path.join(dir, f.out), buf);
  rows.push(f);
  console.log(`${f.out}  ${(buf.length / 1024).toFixed(0)} KB  ${f.licence}  ${f.credit}`);
}

const credits = `# Amashuri Games photography

Photographs of Rwandan schools and school sport, from Wikimedia Commons. Every one
was opened and visually checked before it was used — the same rule as
public/hero/CREDITS.md, and for the same reason: a search for "school in Rwanda"
returns biogas digesters, kitchen stoves and a cathedral facade, all correctly
tagged and all wrong.

The CC BY-SA files REQUIRE attribution. The pages print a credit line for exactly
that reason. To swap in MINISPORTS' own photography, drop the file here under the
same name and set \`credit: null\` in src/config/amashuriMedia.ts.

${rows.map((r) => [
  `## ${r.out}`,
  ``,
  `- **${r.title}**`,
  `- ${r.licence} — ${r.credit}`,
  `- ${r.page}`,
  r.note ? `- ${r.note}` : null,
].filter(Boolean).join('\n')).join('\n\n')}
`;

for (const dir of OUT) fs.writeFileSync(path.join(dir, 'CREDITS.md'), credits);
console.log('\nCREDITS.md written');
