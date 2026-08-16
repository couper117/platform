/**
 * Unit tests for the pure standings tally — no server, no database.
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { tallyStandings } = require('../../src/services/standings.logic');

const PTS = { win: 3, draw: 1, loss: 0 };
const rowFor = (rows: any[], teamId: number) => rows.find((r) => r.teamId === teamId);

test('a win awards the winner 3 points and the loser 0, with goals tallied', () => {
  const rows = tallyStandings([1, 2], [{ homeTeamId: 1, awayTeamId: 2, homeScore: 2, awayScore: 0 }], PTS);
  const home = rowFor(rows, 1);
  const away = rowFor(rows, 2);

  assert.equal(home.points, 3);
  assert.equal(home.won, 1);
  assert.equal(home.goalsFor, 2);
  assert.equal(home.goalsAgainst, 0);

  assert.equal(away.points, 0);
  assert.equal(away.lost, 1);
  assert.equal(away.goalsFor, 0);
  assert.equal(away.goalsAgainst, 2);
});

test('a draw gives each team a point', () => {
  const rows = tallyStandings([1, 2], [{ homeTeamId: 1, awayTeamId: 2, homeScore: 1, awayScore: 1 }], PTS);
  assert.equal(rowFor(rows, 1).points, 1);
  assert.equal(rowFor(rows, 2).points, 1);
  assert.equal(rowFor(rows, 1).drawn, 1);
  assert.equal(rowFor(rows, 2).drawn, 1);
});

test('registered teams with no completed fixtures still appear (0 played)', () => {
  const rows = tallyStandings([1, 2, 3], [{ homeTeamId: 1, awayTeamId: 2, homeScore: 3, awayScore: 1 }], PTS);
  assert.equal(rows.length, 3);
  const winless = rowFor(rows, 3);
  assert.equal(winless.played, 0);
  assert.equal(winless.points, 0);
});

test('form records recent results in chronological order', () => {
  const rows = tallyStandings(
    [1, 2],
    [
      { homeTeamId: 1, awayTeamId: 2, homeScore: 1, awayScore: 0 }, // team 1 W
      { homeTeamId: 2, awayTeamId: 1, homeScore: 2, awayScore: 2 }, // draw
    ],
    PTS
  );
  const t1 = rowFor(rows, 1);
  assert.equal(t1.played, 2);
  assert.equal(t1.points, 4); // 3 (W) + 1 (D)
  assert.deepEqual(t1.results, ['W', 'D']);
});

test('missing scores are treated as a 0-0 draw', () => {
  const rows = tallyStandings([1, 2], [{ homeTeamId: 1, awayTeamId: 2 }], PTS);
  assert.equal(rowFor(rows, 1).points, 1);
  assert.equal(rowFor(rows, 2).points, 1);
});

test('the points config is honoured (e.g. old 2-points-for-a-win)', () => {
  const rows = tallyStandings([1, 2], [{ homeTeamId: 1, awayTeamId: 2, homeScore: 1, awayScore: 0 }], { win: 2, draw: 1, loss: 0 });
  assert.equal(rowFor(rows, 1).points, 2);
});
