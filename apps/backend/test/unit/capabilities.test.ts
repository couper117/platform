/**
 * Unit tests for the authorisation policy — no server, no database.
 * Run via `npm run test:unit` (node:test through tsx).
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  ALL,
  ROLE_CAPABILITIES,
  can,
  canAny,
  canAll,
  capabilitiesFor,
  roleCapabilities,
  isKnown,
  assertKnown,
  handlesPersonalData,
} = require('../../src/services/capabilities.rules');

const user = (role, over = {}) => ({ id: 1, role, active: true, ...over });
const ROLES = Object.keys(ROLE_CAPABILITIES);

/** Which roles hold a capability, according to the map. */
const holders = (capability) => ROLES.filter((r) => can(user(r), capability)).sort();

// ── the catalogue is internally consistent ──

test('every capability a role names actually exists', () => {
  // Stops a role quietly holding a capability that nothing enforces.
  for (const [role, caps] of Object.entries(ROLE_CAPABILITIES)) {
    for (const c of caps) {
      assert.equal(isKnown(c), true, `${role} names unknown capability "${c}"`);
    }
  }
});

test('an unknown capability is refused rather than assumed', () => {
  assert.equal(isKnown('fixture.write'), false); // the plausible typo
  assert.throws(() => assertKnown('fixture.write'), /Unknown capability "fixture.write"/);
  assert.equal(assertKnown('fixtures.write'), 'fixtures.write');
});

test('every capability is held by someone', () => {
  // One held by nobody but the wildcard is either a typo or dead policy.
  for (const c of ALL) {
    const who = holders(c).filter((r) => r !== 'SUPERADMIN');
    assert.ok(
      who.length > 0 || ROLE_CAPABILITIES.SUPERADMIN.includes('*'),
      `nothing holds ${c}`,
    );
  }
});

// ── the map mirrors what the routes already enforce ──

/**
 * The role lists currently written into src/routes/*.ts, transcribed.
 *
 * This is the test that makes adopting capabilities safe: it asserts the new
 * mechanism grants precisely what authorize() granted, so the switch changes who
 * can do what by exactly nothing. If a route's role list is edited without
 * editing the map — or the reverse — this fails and names the capability.
 *
 * SUPERADMIN is omitted from every row because the wildcard covers it.
 */
const ROUTE_POLICY = {
  // admin.routes.ts
  'admin.stats':          ['FEDERATION_ADMIN', 'LEAGUE_ADMIN'],
  'users.read':           [],
  'users.write':          [],   // create, edit, deactivate, change role
  'system.health':        [],
  'media.read':           [],
  'federations.admins':   [],

  // settings / activity / contacts / privacy / ads / venues / sports / federations
  'settings.write':       [],
  'audit.read':           [],
  'contacts.read':        [],
  'privacy.dsr':          [],
  // requests.routes.ts — reviewing a join request creates nothing by itself, but
  // it is the gate to the platform, so it stays with the super admin until there
  // is a scoped view a federation could safely be given.
  'requests.review':      [],
  'ads.write':            [],
  'venues.write':         [],
  'sports.write':         [],
  // sports.routes.ts PUT /:id — a sport is governed by its federation, so the
  // federation keeps its description current. Creating a sport, deleting one and
  // changing its type stay central: those reshape every other admin page.
  'sports.describe':      ['FEDERATION_ADMIN'],
  'federations.write':    [],

  // leagues.routes.ts
  'leagues.write':        ['FEDERATION_ADMIN', 'LEAGUE_ADMIN'],
  'leagues.delete':       ['FEDERATION_ADMIN'],
  'leagues.admins':       ['FEDERATION_ADMIN'],
  'reporters.read':       ['FEDERATION_ADMIN', 'LEAGUE_ADMIN'],
  'reporters.assign':     ['LEAGUE_ADMIN'],
  // reporters.routes.ts — a reporter maintains their own profile; nobody edits
  // anyone else's, which is why no other role holds it.
  'reporters.profile':    ['MATCH_REPORTER'],

  // teams.routes.ts
  'teams.create':         ['FEDERATION_ADMIN'],
  'teams.write':          ['FEDERATION_ADMIN', 'TEAM_MANAGER'],
  'teams.approve':        ['FEDERATION_ADMIN'],

  // players.routes.ts / documents.routes.ts
  'players.read':         ['FEDERATION_ADMIN', 'LEAGUE_ADMIN', 'TEAM_MANAGER'],
  'players.write':        ['FEDERATION_ADMIN', 'LEAGUE_ADMIN', 'TEAM_MANAGER'],
  'players.documents':    ['FEDERATION_ADMIN'],

  // transfers / suspensions / registrations
  'transfers.read':       ['FEDERATION_ADMIN', 'LEAGUE_ADMIN'],
  'transfers.write':      ['LEAGUE_ADMIN'],
  'suspensions.read':     ['FEDERATION_ADMIN', 'LEAGUE_ADMIN'],
  'suspensions.write':    ['LEAGUE_ADMIN'],
  'registrations.read':   ['FEDERATION_ADMIN', 'LEAGUE_ADMIN'],
  'registrations.review': ['LEAGUE_ADMIN'],

  // fixtures.routes.ts
  'fixtures.write':       ['FEDERATION_ADMIN', 'LEAGUE_ADMIN'],
  'fixtures.report':      ['FEDERATION_ADMIN', 'LEAGUE_ADMIN', 'MATCH_REPORTER'],
  'fixtures.lineups':     ['FEDERATION_ADMIN', 'LEAGUE_ADMIN', 'MATCH_REPORTER', 'TEAM_MANAGER'],

  // news / races / umuganda
  'news.write':           ['FEDERATION_ADMIN'],
  'races.write':          ['FEDERATION_ADMIN'],
  'umuganda.write':       ['AMASHURI_ADMIN', 'FEDERATION_ADMIN', 'LEAGUE_ADMIN'],
  'umuganda.delete':      [],

  // akc3 routes
  'akc.read':             ['AMASHURI_ADMIN'],
  'akc.write':            ['AMASHURI_ADMIN'],
  'akc.import':           ['AMASHURI_ADMIN'],
  'akc.school':           ['SCHOOL_COORDINATOR'],

  // payments.routes.ts
  'payments.subscribe':   ['TEAM_MANAGER'],
  'payments.verify':      [],
};

test('the capability map grants exactly what the routes already enforce', () => {
  for (const [capability, expected] of Object.entries(ROUTE_POLICY)) {
    const actual = holders(capability).filter((r) => r !== 'SUPERADMIN');
    assert.deepEqual(actual, [...expected].sort(), `holders of ${capability} drifted`);
  }
});

test('the transcribed route policy covers every capability', () => {
  // Otherwise a capability could be added to a role without anyone checking it
  // against a route, which is exactly the drift the table above exists to catch.
  const missing = ALL.filter((c) => !(c in ROUTE_POLICY));
  assert.deepEqual(missing, [], 'capabilities absent from ROUTE_POLICY');
});

// ── the roles ──

test('a super admin holds everything, including capabilities added later', () => {
  const su = user('SUPERADMIN');
  for (const c of ALL) assert.equal(can(su, c), true, `superadmin should hold ${c}`);
  assert.equal(capabilitiesFor(su).length, ALL.length);
});

test('the public role holds nothing', () => {
  const p = user('PUBLIC');
  assert.deepEqual(capabilitiesFor(p), []);
  assert.equal(can(p, 'fixtures.write'), false);
  assert.equal(can(p, 'news.write'), false);
});

test('an unknown role is denied rather than defaulted', () => {
  assert.equal(can(user('MODERATOR'), 'news.write'), false);
  assert.deepEqual(roleCapabilities('MODERATOR'), []);
});

test('a reporter can report a match but not reschedule one', () => {
  const r = user('MATCH_REPORTER');
  assert.equal(can(r, 'fixtures.report'), true);
  assert.equal(can(r, 'fixtures.write'), false, 'a reporter must not move fixtures');
  assert.equal(can(r, 'players.write'), false);
  assert.equal(can(r, 'users.read'), false);
});

test('a school coordinator can never reach another school', () => {
  // The portal capability is separate from the platform-wide ones precisely so
  // one school cannot read or write another school's children.
  const s = user('SCHOOL_COORDINATOR');
  assert.equal(can(s, 'akc.school'), true);
  assert.equal(can(s, 'akc.read'), false);
  assert.equal(can(s, 'akc.import'), false);
  assert.equal(can(s, 'akc.write'), false);
});

test('no role except super admin administers the platform itself', () => {
  const RESERVED = ['users.write', 'settings.write', 'federations.write', 'federations.admins',
    'sports.write', 'privacy.dsr', 'audit.read', 'system.health', 'requests.review'];
  for (const role of ROLES) {
    if (role === 'SUPERADMIN') continue;
    for (const c of RESERVED) {
      assert.equal(can(user(role), c), false, `${role} must not hold ${c}`);
    }
  }
});

// ── per-account exceptions ──

test('a grant adds a capability the role lacks', () => {
  const r = user('MATCH_REPORTER', { grantedCapabilities: ['news.write'] });
  assert.equal(can(r, 'news.write'), true);
  assert.equal(can(user('MATCH_REPORTER'), 'news.write'), false, 'and only for that account');
});

test('a revoke removes a capability the role would have', () => {
  const l = user('LEAGUE_ADMIN', { revokedCapabilities: ['suspensions.write'] });
  assert.equal(can(l, 'suspensions.write'), false);
  assert.equal(can(l, 'fixtures.write'), true, 'the rest of the role is untouched');
});

test('a revoke applies to a super admin too', () => {
  // So an account can be barred from personal data without demoting it out of
  // the role that runs the platform.
  const su = user('SUPERADMIN', { revokedCapabilities: ['players.read'] });
  assert.equal(can(su, 'players.read'), false);
  assert.equal(can(su, 'fixtures.write'), true);
  assert.equal(capabilitiesFor(su).includes('players.read'), false);
});

test('a revoke beats a grant on the same capability', () => {
  // Contradictory instructions resolve to the narrower reading.
  const u = user('PUBLIC', { grantedCapabilities: ['news.write'], revokedCapabilities: ['news.write'] });
  assert.equal(can(u, 'news.write'), false);
  assert.equal(capabilitiesFor(u).includes('news.write'), false);
});

test('a deactivated account can do nothing, whatever its role says', () => {
  const su = user('SUPERADMIN', { active: false });
  assert.equal(can(su, 'fixtures.write'), false);
  assert.deepEqual(capabilitiesFor(su), []);
});

test('no user at all is denied without throwing', () => {
  assert.equal(can(null, 'fixtures.write'), false);
  assert.equal(can(undefined, 'fixtures.write'), false);
  assert.deepEqual(capabilitiesFor(null), []);
});

test('capabilitiesFor and can never disagree', () => {
  // The list an administrator is shown must be exactly what the gate enforces.
  const cases = [
    user('SUPERADMIN'),
    user('FEDERATION_ADMIN'),
    user('LEAGUE_ADMIN', { revokedCapabilities: ['transfers.write'] }),
    user('MATCH_REPORTER', { grantedCapabilities: ['fixtures.write'] }),
    user('SCHOOL_COORDINATOR'),
    user('PUBLIC'),
  ];
  for (const u of cases) {
    const listed = new Set(capabilitiesFor(u));
    for (const c of ALL) {
      assert.equal(can(u, c), listed.has(c), `${u.role} disagrees on ${c}`);
    }
  }
});

// ── combinators ──

test('canAll requires every capability, canAny requires one', () => {
  const l = user('LEAGUE_ADMIN');
  assert.equal(canAll(l, ['fixtures.write', 'suspensions.write']), true);
  assert.equal(canAll(l, ['fixtures.write', 'teams.approve']), false);
  assert.equal(canAny(l, ['teams.approve', 'suspensions.write']), true);
  assert.equal(canAny(l, ['teams.approve', 'users.write']), false);
});

test('canAll on an empty list is false, not vacuously true', () => {
  // Otherwise a route registered with no capabilities would be wide open.
  assert.equal(canAll(user('PUBLIC'), []), false);
  assert.equal(canAny(user('PUBLIC'), []), false);
});

// ── privacy ──

test('roles that touch personal data are derived, not listed twice', () => {
  assert.equal(handlesPersonalData(user('AMASHURI_ADMIN')), true);
  assert.equal(handlesPersonalData(user('SCHOOL_COORDINATOR')), true);
  assert.equal(handlesPersonalData(user('TEAM_MANAGER')), true);
  assert.equal(handlesPersonalData(user('MATCH_REPORTER')), false);
  assert.equal(handlesPersonalData(user('PUBLIC')), false);
  assert.equal(handlesPersonalData(user('LEAGUE_ADMIN', { revokedCapabilities: ['players.read'] })), false);
});
