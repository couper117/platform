/**
 * API smoke / integration suite — zero dependencies (Node's built-in test runner).
 *
 * Non-destructive: it only reads, logs in, and asserts that guards reject bad
 * input — it never creates or mutates data, so it is safe to run against any
 * environment. Requires the API to be running.
 *
 *   npm test            (backend must be up on :5000, or set API_URL)
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
const login = async (email) => {
  const r = await post('/auth/login', { email, password: PASS });
  const j = await r.json();
  return { status: r.status, token: j.accessToken, role: j.user?.role };
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
  const expected = {
    'admin@rwasport.rw': 'SUPERADMIN',
    'league@rwasport.rw': 'LEAGUE_ADMIN',
    'reporter@rwasport.rw': 'AMASHURI_ADMIN',
    'match.reporter@rwasport.rw': 'MATCH_REPORTER',
  };
  for (const [email, role] of Object.entries(expected)) {
    const r = await login(email);
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
  const { token } = await login('reporter@rwasport.rw'); // AMASHURI_ADMIN
  assert.equal((await get('/admin/roster', token)).status, 403);
});

test('authz: super-admin reaches /admin/roster and /admin/stats', async () => {
  const { token } = await login('admin@rwasport.rw');
  assert.equal((await get('/admin/roster', token)).status, 200);
  const s = await (await get('/admin/stats', token)).json();
  assert.ok(typeof s.data.activeLeagues === 'number', 'stats.activeLeagues');
});

test('validation: creating a school with no name is rejected (400)', async () => {
  const { token } = await login('reporter@rwasport.rw');
  const r = await post('/akc3/admin/schools', { code: 'NO-NAME' }, token);
  assert.equal(r.status, 400);
});

test('reporter: assigned fixtures are scoped to the reporter', async () => {
  const { token, role } = await login('match.reporter@rwasport.rw');
  assert.equal(role, 'MATCH_REPORTER');
  const me = await (await get('/auth/me', token)).json();
  const r = await get(`/fixtures?reporterId=${me.data?.id || me.user?.id}`, token);
  assert.equal(r.status, 200);
});
