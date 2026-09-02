/**
 * What each role is allowed to *do*.
 *
 * Pure data and pure functions — no database, no request, no Prisma — so the
 * whole authorisation policy can be read in one sitting and unit-tested without
 * a server (test/unit/capabilities.test.ts). Same split as eligibility.rules.ts
 * and matchClock.logic.ts.
 *
 * ── The distinction that matters ──
 * A capability says what *kind* of action someone may perform: "may edit
 * fixtures". It never says *which* fixture. Row-level scope stays where it
 * already lives and works — canManageFixture(), enforceSportScope(), the
 * akcSchoolId check — because those need the database and this must not.
 *
 * A LEAGUE_ADMIN holds `fixtures.write` (capability) and canManageFixture()
 * still decides whether this particular fixture belongs to a league they were
 * assigned to (scope). Both must pass. Collapsing the two would mean either
 * querying the database to answer "what can this role do", or writing row
 * ownership into a static table — and neither is true to how the app works.
 *
 * ── Why not a Permission/RolePermission table ──
 * A permissions matrix living in the database is invisible: it cannot be read in
 * a diff, cannot be tested, and drifts between environments until production
 * quietly enforces a different policy from staging. The map below *is* the
 * policy. Only per-account exceptions are stored, in User.grantedCapabilities
 * and User.revokedCapabilities — so the common case stays reviewable in git, and
 * one person can still be handed one extra key without inventing a role for them.
 *
 * ── How this map was built ──
 * Every entry below mirrors a role list already enforced on a route, so adopting
 * capabilities changes who can do what by exactly nothing. That was deliberate:
 * a change of mechanism and a change of policy must not arrive together, or
 * neither can be reviewed. Tightening or widening any of this is a separate,
 * stated decision. A capability is added here only when a route enforces it —
 * an unenforced entry would be a promise the server does not keep.
 */

// ── The catalogue ───────────────────────────────────────────────────────────
// Every capability the platform recognises. One that is not listed is not a typo
// the system tolerates: assertKnown() rejects it, so a misspelled string in a
// route throws when routes are built rather than silently denying at runtime —
// including to the Super Admin, which is the failure mode that makes
// string-keyed permissions dangerous.

const CAPABILITIES = {
  // Platform administration
  'admin.stats':          'See the administrative dashboard',
  'users.read':           'View user accounts',
  'users.write':          'Create, edit, deactivate accounts and change their role',
  'system.health':        'View system health',
  'settings.write':       'Change platform settings and competition rules',
  'audit.read':           'Read the activity log',
  'contacts.read':        'Read messages sent through the contact form',
  'media.read':           'Browse the media library',
  'privacy.dsr':          'Handle data-subject requests (Law 058/2021, arts. 18-24)',
  'requests.review':      'Approve or reject organisations asking to join',

  // Sports and governing bodies
  'sports.write':         'Add sports and change how they are scored and organised',
  'federations.write':    'Create and edit federations',
  'federations.admins':   'Appoint and remove administrators',

  // Competitions
  'leagues.write':        'Create and edit leagues, their teams and their fixtures',
  'leagues.delete':       'Delete a league',
  'leagues.admins':       'Assign an administrator to a league',
  'venues.write':         'Manage venues',
  'races.write':          'Manage races and classifications',
  'umuganda.write':       'Curate the Umuganda calendar',
  'umuganda.delete':      'Remove a day from the Umuganda calendar',

  // Clubs and athletes
  'teams.create':         'Register a new team',
  'teams.write':          'Edit a team',
  'teams.approve':        'Approve or reject a team',
  'players.read':         'View player records',
  'players.write':        'Create and edit player records',
  'players.documents':    'Review player documents and approve or reject them',
  'transfers.read':       'View transfers',
  'transfers.write':      'Record a transfer',
  'suspensions.read':     'View suspensions',
  'suspensions.write':    'Impose or lift a suspension',
  'registrations.read':   'View competition entries',
  'registrations.review': 'Accept or reject a competition entry',

  // Matches
  'fixtures.write':       'Schedule, reschedule and edit fixtures',
  'fixtures.report':      'Report a match live — clock, events, score and stats',
  'fixtures.lineups':     'Submit and publish team sheets',
  'reporters.read':       'View reporters',
  'reporters.assign':     'Assign a reporter to a league or fixture',
  'reporters.profile':    'Maintain your own reporter profile and availability',

  // School sport (Amashuri)
  'akc.read':             'View school-sport athletes across all schools',
  'akc.write':            'Manage school-sport schools, teams and competitions',
  'akc.import':           'Import athletes from a roster file, for any school',
  'akc.school':           'Use the school portal, for your own school only',

  // Content and money
  'news.write':           'Write and publish news',
  'ads.write':            'Manage advertisements and sponsors',
  'payments.subscribe':   'Pay a club subscription',
  'payments.verify':      'Verify a payment manually',
};

const ALL = Object.keys(CAPABILITIES);

/**
 * A Super Admin holds every capability, including ones added after this file was
 * written. Spelling the list out would mean each newly added capability is
 * silently denied to the one role that must never be locked out of its own
 * platform.
 */
const WILDCARD = '*';

// ── The policy ──────────────────────────────────────────────────────────────

/**
 * Role to capabilities. Read each list as "what this kind of account can do
 * *somewhere*" — never "everywhere". The scope helpers decide where.
 */
const ROLE_CAPABILITIES = {
  SUPERADMIN: [WILDCARD],

  /**
   * Runs one sport, end to end, but only that sport: enforceSportScope() filters
   * every one of these to their federation's sportId.
   *
   * `federations.write` is absent on purpose — a federation administrator runs a
   * federation, they do not create or delete them.
   */
  FEDERATION_ADMIN: [
    'admin.stats',
    'leagues.write', 'leagues.delete', 'leagues.admins',
    'teams.create', 'teams.write', 'teams.approve',
    'players.read', 'players.write', 'players.documents',
    'transfers.read', 'suspensions.read', 'registrations.read',
    'fixtures.write', 'fixtures.report', 'fixtures.lineups',
    'reporters.read',
    'races.write', 'umuganda.write',
    'news.write',
  ],

  /**
   * Runs the competitions they were assigned to, decided per league by the
   * LeagueAdminAssignment table.
   */
  LEAGUE_ADMIN: [
    'admin.stats',
    'leagues.write',
    'players.read', 'players.write',
    'transfers.read', 'transfers.write',
    'suspensions.read', 'suspensions.write',
    'registrations.read', 'registrations.review',
    'fixtures.write', 'fixtures.report', 'fixtures.lineups',
    'reporters.read', 'reporters.assign',
    'umuganda.write',
  ],

  /**
   * Covers the matches they are assigned to and nothing else — canManageFixture()
   * checks the assignment per fixture. `fixtures.write` is absent deliberately: a
   * reporter reports a match, they do not reschedule it.
   */
  MATCH_REPORTER: [
    'fixtures.report',
    'fixtures.lineups',
    'reporters.profile',
  ],

  /**
   * Runs one club. The managerUserId check and canManageTeamSheet() are what
   * confine each of these to that club.
   */
  TEAM_MANAGER: [
    'teams.write',
    'players.read', 'players.write',
    'fixtures.lineups',
    'payments.subscribe',
  ],

  /** Runs school sport across every school. */
  AMASHURI_ADMIN: [
    'akc.read', 'akc.write', 'akc.import',
    'umuganda.write',
  ],

  /**
   * Registers athletes for exactly one school, through the school portal.
   *
   * `akc.read` and `akc.import` are absent and must stay absent: those are the
   * platform-wide versions, and granting either would let one school read or
   * write another school's children. The portal's own confinement is the
   * akcSchoolId check in withOwnSchool and the import service.
   */
  SCHOOL_COORDINATOR: [
    'akc.school',
  ],

  /** A signed-in visitor. Reading the public site is not a capability. */
  PUBLIC: [],
};

// ── Resolution ──────────────────────────────────────────────────────────────

const isKnown = (capability) => capability === WILDCARD || ALL.includes(capability);

/** Reject a capability nobody defined, naming the offending string. */
const assertKnown = (capability) => {
  if (!isKnown(capability)) {
    throw new Error(
      `Unknown capability "${capability}". Add it to CAPABILITIES in services/capabilities.rules.ts.`,
    );
  }
  return capability;
};

/** The capabilities a role holds, before any per-account exception. */
const roleCapabilities = (role) => ROLE_CAPABILITIES[role] || [];

/**
 * Everything this account can do, exceptions applied.
 *
 * A revoke beats a grant: the safe reading of a contradictory instruction is the
 * narrower one. A wildcard role is expanded first, so a Super Admin account can
 * still be deliberately barred from something — reading personal data, say —
 * without demoting it out of the role that runs the platform.
 */
const capabilitiesFor = (user) => {
  if (!user || user.active === false) return [];

  const base = roleCapabilities(user.role);
  const granted = user.grantedCapabilities || [];
  const revoked = new Set(user.revokedCapabilities || []);
  const expanded = base.includes(WILDCARD) ? ALL : base;

  return [...new Set([...expanded, ...granted])].filter((c) => !revoked.has(c));
};

/**
 * Whether this account holds a capability. Every check routes through here — the
 * wildcard included — so there is exactly one place the answer is decided.
 */
const can = (user, capability) => {
  if (!user || user.active === false) return false;
  if ((user.revokedCapabilities || []).includes(capability)) return false;
  if ((user.grantedCapabilities || []).includes(capability)) return true;

  const base = roleCapabilities(user.role);
  return base.includes(WILDCARD) || base.includes(capability);
};

/** Whether the account holds at least one of these. */
const canAny = (user, capabilities) => (capabilities || []).some((c) => can(user, c));

/** Whether the account holds all of these. */
const canAll = (user, capabilities) =>
  (capabilities || []).length > 0 && capabilities.every((c) => can(user, c));

/**
 * Capabilities that carry access to identifiable personal data (Law 058/2021).
 *
 * Derived from the policy rather than kept as a second list of roles, so a role
 * that gains `players.read` cannot be forgotten here — the two cannot drift.
 */
const PERSONAL_DATA_CAPABILITIES = ['players.read', 'akc.read', 'akc.school', 'users.read'];

const handlesPersonalData = (user) => canAny(user, PERSONAL_DATA_CAPABILITIES);

module.exports = {
  CAPABILITIES,
  ALL,
  WILDCARD,
  ROLE_CAPABILITIES,
  isKnown,
  assertKnown,
  roleCapabilities,
  capabilitiesFor,
  can,
  canAny,
  canAll,
  PERSONAL_DATA_CAPABILITIES,
  handlesPersonalData,
};
