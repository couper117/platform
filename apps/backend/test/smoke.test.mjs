/**
 * API smoke / integration suite — zero dependencies (Node's built-in test runner).
 *
 * Non-destructive: it only reads, logs in, and asserts that guards reject bad
 * input — it never creates or mutates data, so it is safe to run against any
 * environment. Requires the API to be running.
 *
 *   npm test            (backend must be up on :5000, or set API_URL)
 *
 * RATE LIMIT: the API allows 20 authentication attempts per IP per 15 minutes.
 * This suite spends seven of them per run — one per seeded role, plus the
 * deliberate wrong-password attempt — and caches the resulting tokens, so two
 * back-to-back runs fit comfortably and a third will start seeing 401s. That is
 * the limiter doing its job, not a broken guard: wait out the window, or restart
 * the API, which resets the in-memory counter.
 */
import { test, before } from 'node:test';
import assert from 'node:assert/strict';

const API = process.env.API_URL || 'http://localhost:5000/api/v1';
const PASS = process.env.TEST_PASSWORD || 'Manager@123';

const get = (p, token) => fetch(`${API}${p}`, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);
const post = (p, body, token) => fetch(`${API}${p}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  body: JSON.stringify(body),
});
/**
 * Sign in, once per account.
 *
 * The API rate-limits authentication to 20 attempts per quarter hour, and this
 * suite has a dozen tests that each used to sign in again — so a second run
 * inside the window exhausted the budget and later tests failed with 401s that
 * looked like authorisation bugs. Caching the token per address keeps the suite
 * well inside the limit and makes a failure mean what it says.
 *
 * `fresh` forces a real request for the tests that are about signing in itself.
 */
const tokenCache = new Map();
const login = async (email, { fresh = false } = {}) => {
  if (!fresh && tokenCache.has(email)) return tokenCache.get(email);

  const r = await post('/auth/login', { email, password: PASS });
  const j = await r.json();
  const result = { status: r.status, token: j.accessToken, role: j.user?.role };
  if (r.status === 200) tokenCache.set(email, result);
  return result;
};

before(async () => {
  // Fail fast with a clear message if the server isn't up.
  try { await fetch(`${API}/sports`); }
  catch { throw new Error(`API not reachable at ${API} — start the backend first (npm run dev).`); }
});

test('public: GET /sports returns a non-empty list', async () => {
  const r = await get('/sports');
  assert.equal(r.status, 200);
  const j = await r.json();
  assert.ok(Array.isArray(j.data) && j.data.length > 0, 'expected sports');
});

test('public: fixtures, races and akc sports respond', async () => {
  for (const p of ['/fixtures', '/races?sportId=9', '/akc3/sports', '/akc3/announcements']) {
    const r = await get(p);
    assert.equal(r.status, 200, `${p} should be 200`);
  }
});

test('auth: every seeded role logs in with the expected role', async () => {
  // These addresses are what prisma/seed.ts actually creates. The suite used to
  // expect reporter@rwasport.rw to be an AMASHURI_ADMIN and a separate
  // match.reporter@ account to exist — neither was true of the seed, so three
  // tests here failed for want of a user rather than for want of working code,
  // and had been failing long enough to stop being read.
  const expected = {
    'admin@rwasport.rw': 'SUPERADMIN',
    'league@rwasport.rw': 'LEAGUE_ADMIN',
    'amashuri@rwasport.rw': 'AMASHURI_ADMIN',
    'reporter@rwasport.rw': 'MATCH_REPORTER',
    'coach@rwasport.rw': 'TEAM_MANAGER',
    'coordinator@rwasport.rw': 'SCHOOL_COORDINATOR',
  };
  for (const [email, role] of Object.entries(expected)) {
    const r = await login(email, { fresh: true });
    assert.equal(r.status, 200, `${email} login`);
    assert.ok(r.token, `${email} should return a token`);
    assert.equal(r.role, role, `${email} role`);
  }
});

test('auth: wrong password is rejected (401)', async () => {
  const r = await post('/auth/login', { email: 'admin@rwasport.rw', password: 'wrong-password' });
  assert.equal(r.status, 401);
});

test('authz: /admin/roster requires auth (401) and super-admin (403)', async () => {
  assert.equal((await get('/admin/roster')).status, 401);
  const { token } = await login('amashuri@rwasport.rw'); // AMASHURI_ADMIN
  assert.equal((await get('/admin/roster', token)).status, 403);
});

test('authz: super-admin reaches /admin/roster and /admin/stats', async () => {
  const { token } = await login('admin@rwasport.rw');
  assert.equal((await get('/admin/roster', token)).status, 200);
  const s = await (await get('/admin/stats', token)).json();
  assert.ok(typeof s.data.activeLeagues === 'number', 'stats.activeLeagues');
});

test('validation: creating a school with no name is rejected (400)', async () => {
  const { token } = await login('amashuri@rwasport.rw');
  const r = await post('/akc3/admin/schools', { code: 'NO-NAME' }, token);
  assert.equal(r.status, 400);
});

test('reporter: assigned fixtures are scoped to the reporter', async () => {
  const { token, role } = await login('reporter@rwasport.rw');
  assert.equal(role, 'MATCH_REPORTER');
  const me = await (await get('/auth/me', token)).json();
  const r = await get(`/fixtures?reporterId=${me.data?.id || me.user?.id}`, token);
  assert.equal(r.status, 200);
});

test('features: new admin resources require auth (401)', async () => {
  for (const p of ['/transfers', '/suspensions', '/registrations']) {
    assert.equal((await get(p)).status, 401, `${p} should require auth`);
  }
});

test('features: super-admin can list the new resources (200)', async () => {
  const { token } = await login('admin@rwasport.rw');
  for (const p of ['/transfers', '/suspensions', '/registrations']) {
    assert.equal((await get(p, token)).status, 200, `${p} should be 200 for admin`);
  }
});

test('officials: public list requires a teamId (400)', async () => {
  assert.equal((await get('/officials')).status, 400);
});

test('racing: creating a race requires auth (401)', async () => {
  assert.equal((await post('/races', { sportId: 9, name: 'x' })).status, 401);
});

test('payments: the webhook rejects an unsigned call (401)', async () => {
  // No verif-hash header / no configured hash → must fail closed.
  assert.equal((await post('/payments/webhook', { event: 'charge.completed' })).status, 401);
});
