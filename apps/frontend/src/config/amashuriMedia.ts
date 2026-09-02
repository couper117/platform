/**
 * Amashuri Games photography — one file to edit.
 *
 * SCHOOL SPORT IS NOT LEAGUE SPORT, so this is a separate set from heroMedia's.
 * A Tour du Rwanda peloton is the wrong picture for an inter-school championship,
 * and the national basketball league is the wrong picture for a games day.
 *
 * Files live in /public/amashuri and are installed by
 * scripts/import-amashuri-photos.mjs, which also writes CREDITS.md beside them.
 * Sources and licences are there; the CC BY-SA ones REQUIRE the attribution, which
 * is why pages print a credit line rather than treating a photograph as anonymous
 * decoration.
 *
 * TO SWAP IN MINISPORTS PHOTOGRAPHY: drop the file in /public/amashuri under the
 * same name and set `credit: null`. Nothing else changes.
 */

export type AmashuriPhoto = {
  /** Also the filename in /public/amashuri (or /public/hero for the shared hero). */
  src: string;
  /** Photographer, for the CC BY-SA attribution. `null` once it is MINISPORTS' own. */
  credit: string | null;
};

/** The section hero: school basketball, already shipped with the homepage set. */
export const AMASHURI_HERO: AmashuriPhoto = { src: '/hero/amashuri.jpg', credit: 'Claude Nizeyimana' };

/** Games in progress — the banner over the competitions section. */
export const AMASHURI_GAMES: AmashuriPhoto = { src: '/amashuri/games-day.jpg', credit: 'Germain92' };

/**
 * Covers for a school that has no photograph of its own.
 *
 * A DIRECTORY OF GREY RECTANGLES IS NOT A DIRECTORY. Every school card used to be
 * a crest on a plain surface, which made 40 schools look like 40 database rows.
 * These are real Rwandan campuses and classrooms; a school is assigned one by id,
 * so a given school always shows the same cover rather than reshuffling on every
 * render. `school.photo` from the API wins whenever it exists.
 */
export const SCHOOL_COVERS: AmashuriPhoto[] = [
  { src: '/amashuri/campus.jpg', credit: null }, // CC0
  // Client-supplied: a Giants of Africa youth camp. Children with a ball is the
  // single most on-subject frame in this set, so it leads the competition pool.
  { src: '/amashuri/youth-basketball.jpg', credit: null },
  { src: '/amashuri/classroom.jpg', credit: null }, // CC0
  { src: '/amashuri/students.jpg', credit: 'Annick green' },
  { src: '/amashuri/hills-campus.jpg', credit: null }, // public domain
];

/** The cover for one school — its own photo if it has one, else a stable stand-in. */
export const schoolCover = (school: any): string => {
  if (school?.photo) return school.photo;
  if (school?.coverImage) return school.coverImage;
  const n = Number(school?.id) || 0;
  return SCHOOL_COVERS[Math.abs(n) % SCHOOL_COVERS.length].src;
};

/**
 * Covers for a competition, as distinct from a school.
 *
 * The classroom is deliberately not in here. It is a good photograph of a school
 * and a poor one of a championship — a sports competition illustrated by children
 * at desks reads as a mismatch, however correctly it is captioned.
 */
const COMPETITION_COVERS: AmashuriPhoto[] = [
  { src: '/amashuri/youth-basketball.jpg', credit: null },
  AMASHURI_GAMES,
  { src: '/amashuri/campus.jpg', credit: null },
  { src: '/amashuri/students.jpg', credit: 'Annick green' },
  { src: '/amashuri/hills-campus.jpg', credit: null },
];

/**
 * The banner for a school competition.
 *
 * NOT `/hero/<sport>.jpg`. The competition cards borrowed the national-league
 * photography, so the Kigali SCHOOLS Football League was illustrated with the
 * senior game at Kigali Pelé Stadium and the schools basketball league with the
 * BAL at BK Arena. Wrong competition, wrong age group, and in a section whose
 * whole argument is that school sport is its own thing.
 *
 * An uploaded cover still wins — but only a real one. `cover()` in the demo data
 * returns a generated gradient as a `data:` URI, which is a placeholder this app
 * drew for itself and loses to a photograph, the same precedence LeagueCard uses.
 */
export const competitionCover = (competition: any): string => {
  const uploaded = competition?.coverImage && !String(competition.coverImage).startsWith('data:')
    ? competition.coverImage
    : null;
  if (uploaded) return uploaded;
  const n = Number(competition?.id) || 0;
  // `- 1` because competition ids start at 1, and without it the first four
  // competitions took the four SCHOOL_COVERS and the games-day photograph — the
  // only one of the set that actually shows sport — was never drawn.
  return COMPETITION_COVERS[Math.abs(n - 1) % COMPETITION_COVERS.length].src;
};
