/**
 * Personal-data rules for the platform, in one place.
 *
 * Written against Law N° 058/2021 of 13/10/2021 relating to the protection of
 * personal data and privacy (Rwanda), supervised by the NCSA. The articles that
 * drive what is here:
 *
 *   Art. 3(2)  "sensitive personal data" includes health status and medical records.
 *              Disability information on an athlete is health data.
 *   Art. 9     A child under 16 may only have their data processed with the consent
 *              of a parent or guardian, given in the child's interest.
 *   Art. 11    Sensitive personal data must be stored separately, or encrypted or
 *              pseudonymised.
 *   Art. 46    Processing needs a lawful basis.
 *   Art. 47    Appropriate technical measures against loss, damage or destruction.
 *   Art. 52    Data is kept only until the purpose of processing is fulfilled.
 *
 * The rule the projections below encode: publishing a fixture, a result or a team
 * sheet needs a name, a shirt number and a position. It never needs a date of
 * birth, a national ID, a guardian's phone number, a student code or a disability.
 * Those are collected to run eligibility and safeguarding, and are visible only to
 * the people who carry out those duties.
 */

// ── Field groups ────────────────────────────────────────────────────────────

/**
 * Sensitive personal data under Art. 3(2). Never leaves the platform except to a
 * user whose role performs the duty it was collected for.
 */
const SENSITIVE_ATHLETE_FIELDS = ['hasDisability', 'disabilityType'];

/**
 * Identifying data that is not sensitive under Art. 3(2) but must not be public:
 * a date of birth plus a national ID is enough to impersonate a person, and a
 * guardian's phone number belongs to a third party who never used this platform.
 */
const RESTRICTED_ATHLETE_FIELDS = [
  'dob', 'idNumber', 'idType', 'guardianPhone', 'guardianName', 'studentCode', 'schoolClass',
];

/** Never public, whoever the player is. */
const RESTRICTED_PLAYER_FIELDS = ['dateOfBirth', 'idNumber'];

/**
 * Squad-sheet measurements: public for PROFESSIONALS, withheld for everyone else.
 *
 * These sat with the birth date and the ID number, which made a professional
 * basketball player's height as private as their national ID. It is not: every
 * league in the world prints it on the team sheet, the club publishes it itself,
 * and a page that cannot say a centre is 2.13 m is not describing the sport.
 *
 * The line is drawn at `skillLevel`, not at role. An amateur registered through a
 * club has not signed up to be a public figure, and an Amashuri athlete is a CHILD
 * — their measurements stay restricted whatever the sport says.
 *
 * Approved by the client on 3 September 2026 for professionals only; anything
 * wider is a decision for MINISPORTS and their data-protection officer.
 */
const SQUAD_SHEET_FIELDS = ['height', 'weight'];

// ── Public projections (Prisma `select`) ────────────────────────────────────

/**
 * An Amashuri athlete as the public site may see them: enough to render a team
 * sheet, and nothing that identifies the child off the pitch.
 */
const PUBLIC_ATHLETE_SELECT = {
  id: true,
  teamId: true,
  fullName: true,
  gender: true,
  ageCategory: true,
  position: true,
  jersey: true,
  active: true,
};

/** A professional player as the public site may see them. */
const PUBLIC_PLAYER_SELECT = {
  id: true,
  teamId: true,
  fullName: true,
  photo: true,
  nationality: true,
  position: true,
  jerseyNumber: true,
  skillLevel: true,
  gender: true,
  // Fetched so a professional's team sheet can show them; redactPlayer strips
  // them again for anyone who is not one.
  height: true,
  weight: true,
  bio: true,
  status: true,
  active: true,
  createdAt: true,
};

/**
 * Roles that may see the restricted and sensitive fields, because their duties —
 * eligibility checks, document verification, safeguarding — are the purpose the
 * data was collected for (Art. 46). A school coordinator sees only their own
 * school's athletes; that narrowing is enforced by the route, not here.
 */
const PERSONAL_DATA_ROLES = [
  'SUPERADMIN',
  'AMASHURI_ADMIN',
  'FEDERATION_ADMIN',
  'LEAGUE_ADMIN',
  'SCHOOL_COORDINATOR',
  'TEAM_MANAGER',
];

const canSeePersonalData = (user: any) => !!user && PERSONAL_DATA_ROLES.includes(user.role);

/**
 * Strip restricted and sensitive fields from an already-loaded record.
 *
 * Prefer the `*_SELECT` projections — not fetching the data at all is stronger
 * than fetching and deleting. This exists for responses assembled from includes
 * where a select would mean restructuring the whole query.
 */
const redactAthlete = (athlete: any) => {
  if (!athlete) return athlete;
  const out = { ...athlete };
  for (const f of [...RESTRICTED_ATHLETE_FIELDS, ...SENSITIVE_ATHLETE_FIELDS]) delete out[f];
  return out;
};

const redactPlayer = (player: any) => {
  if (!player) return player;
  const out = { ...player };
  for (const f of RESTRICTED_PLAYER_FIELDS) delete out[f];
  if (player.skillLevel !== 'PROFESSIONAL') {
    for (const f of SQUAD_SHEET_FIELDS) delete out[f];
  }
  // Verification documents evidence a person's identity — reviewers only.
  delete out.documents;
  return out;
};

// ── Retention (Art. 52) ─────────────────────────────────────────────────────

/**
 * How long each category is kept once its purpose is served. Enforced by
 * scripts/purge-expired-data.mjs, which is meant to run on a schedule.
 *
 * Athlete and player records are deliberately absent: they are competition
 * records whose retention is tied to the seasons they belong to, and are removed
 * through an erasure request (Art. 23) rather than a blanket timer.
 */
const RETENTION_DAYS = {
  // Page views exist to size the audience, which needs recent data only. They
  // carry an IP address, so they are personal data and cannot be kept forever.
  visitorLogs: 90,
  // Administrative audit trail — who changed what. Kept longer because it is the
  // evidence for a dispute over a result or a registration.
  activityLogs: 365,
  // Expired and revoked refresh tokens serve no purpose once past their expiry.
  refreshTokens: 30,
  // Contact-form messages, once handled.
  contactMessages: 365,
  // A closed data-subject request is kept as proof the request was honoured.
  dataSubjectRequests: 730,
};

// ── Children (Art. 9) ───────────────────────────────────────────────────────

/** Below this age, a parent or guardian must consent on the child's behalf. */
const CHILD_CONSENT_AGE = 16;

/**
 * Whether an athlete needs recorded guardian consent, from their date of birth.
 *
 * Uses the same birth-year convention as the eligibility rules, so an athlete is
 * treated consistently by the age cap and by the consent requirement. Unknown age
 * is treated as a child — the safer default when the record is a school roster.
 */
const requiresGuardianConsent = (dob: any, refYear: number) => {
  if (!dob) return true;
  const birthYear = new Date(dob).getUTCFullYear();
  if (Number.isNaN(birthYear)) return true;
  return refYear - birthYear < CHILD_CONSENT_AGE;
};

/**
 * Prisma `where` matching athletes whose data may not lawfully be processed:
 * a child (or an athlete of unknown age) with no parent/guardian consent on file.
 *
 * Mirrors requiresGuardianConsent, but as a query so the outstanding set can be
 * counted and listed rather than filtered in memory. Birth-year convention:
 * age = refYear - birthYear, so "under 16" is birthYear >= refYear - 15.
 */
const missingConsentWhere = (refYear: number) => ({
  guardianConsent: false,
  active: true,
  OR: [
    { dob: null },
    { dob: { gte: new Date(Date.UTC(refYear - (CHILD_CONSENT_AGE - 1), 0, 1)) } },
  ],
});

/**
 * Prisma `where` for athletes the public site may show.
 *
 * Art. 9 gives no lawful basis for processing a child's data without a guardian's
 * consent, and publishing is processing. So an athlete awaiting consent is
 * withheld from public team sheets — their record stays intact and visible to the
 * administrators chasing the consent, but it is not published in the meantime.
 */
const publiclyVisibleAthleteWhere = (refYear: number) => ({
  active: true,
  NOT: {
    guardianConsent: false,
    OR: [
      { dob: null },
      { dob: { gte: new Date(Date.UTC(refYear - (CHILD_CONSENT_AGE - 1), 0, 1)) } },
    ],
  },
});

module.exports = {
  missingConsentWhere,
  publiclyVisibleAthleteWhere,
  SENSITIVE_ATHLETE_FIELDS,
  RESTRICTED_ATHLETE_FIELDS,
  RESTRICTED_PLAYER_FIELDS,
  PUBLIC_ATHLETE_SELECT,
  PUBLIC_PLAYER_SELECT,
  PERSONAL_DATA_ROLES,
  canSeePersonalData,
  redactAthlete,
  redactPlayer,
  RETENTION_DAYS,
  CHILD_CONSENT_AGE,
  requiresGuardianConsent,
};
