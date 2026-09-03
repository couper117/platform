import { describe, it, expect } from 'vitest';
import {
  sideOf, opponentOf, homeOrAway, isSheetLocked, sheetFor, matchTasks,
  missingDocuments, timeUntil,
} from './coachMatch';
import { sheetAuthor, authorLabel } from './teamSheet';

/**
 * The club portal's reading of a fixture.
 *
 * Everything here is a place where getting it subtly wrong is invisible on
 * screen: a side computed backwards shows the opponent's crest against your own
 * name and a coach believes the wrong scoreline; a sheet counted as filed
 * because the LIST response has no `lineups` tells a club they are ready when
 * nobody has named a player; an author guessed rather than read claims the coach
 * filed something a reporter typed. None of those throw.
 */

const HOME = { id: 1, name: 'Rayon Sports', shortName: 'Rayon' };
const AWAY = { id: 2, name: 'APR FC', shortName: 'APR' };

const fixture = (over: any = {}) => ({
  id: 10,
  homeTeamId: 1,
  awayTeamId: 2,
  homeTeam: HOME,
  awayTeam: AWAY,
  status: 'SCHEDULED',
  lineups: [],
  teamSheets: [],
  ...over,
});

describe('which side are we', () => {
  it('reads the fixture from the club that is looking at it', () => {
    expect(sideOf(fixture(), 1)).toBe('home');
    expect(sideOf(fixture(), 2)).toBe('away');
    expect(homeOrAway(fixture(), 1)).toBe('H');
    expect(homeOrAway(fixture(), 2)).toBe('A');
    expect(opponentOf(fixture(), 1)).toEqual(AWAY);
    expect(opponentOf(fixture(), 2)).toEqual(HOME);
  });

  it('says nothing rather than guessing for a club that is not playing', () => {
    // A stale link, or a fixture that moved. Guessing "home" would print the
    // wrong opponent and the wrong scoreline with total confidence.
    expect(sideOf(fixture(), 99)).toBeNull();
    expect(homeOrAway(fixture(), 99)).toBe('—');
    expect(sideOf(fixture(), null)).toBeNull();
  });
});

describe('the team sheet', () => {
  const rows = [
    { teamId: 1, playerId: 7, isStarter: true, isCaptain: true },
    { teamId: 1, playerId: 8, isStarter: false, isCaptain: false },
    { teamId: 2, playerId: 9, isStarter: true, isCaptain: false },
  ];

  it('counts only our own rows, never the opponent\'s', () => {
    const ours = sheetFor(fixture({ lineups: rows }), 1);
    expect(ours.filed).toBe(true);
    expect(ours.starters).toHaveLength(1);
    expect(ours.bench).toHaveLength(1);
    // The away side has one row; reading it as ours would report a filed sheet
    // for a club that never named anybody.
    expect(sheetFor(fixture({ lineups: rows }), 3).filed).toBe(false);
  });

  it('is not filed when the response simply does not carry line-ups', () => {
    // This is the LIST response. It has no `lineups` at all — so "filed" must be
    // false here, and every caller has to fetch the detail before claiming
    // otherwise. The opposite default would tell a club they were ready.
    expect(sheetFor({ id: 10, homeTeamId: 1 }, 1).filed).toBe(false);
  });

  it('locks from kick-off, which is the server\'s rule and not a preference', () => {
    expect(isSheetLocked(fixture({ status: 'SCHEDULED' }))).toBe(false);
    expect(isSheetLocked(fixture({ status: 'LIVE' }))).toBe(true);
    expect(isSheetLocked(fixture({ status: 'COMPLETED' }))).toBe(true);
  });
});

describe('who filed it', () => {
  const sheetBy = (role?: string) => (role ? { submittedBy: { role, fullName: 'X' } } : {});

  it('reads the author from the record', () => {
    expect(sheetAuthor(sheetBy('TEAM_MANAGER'))).toBe('coach');
    expect(sheetAuthor(sheetBy('MATCH_REPORTER'))).toBe('reporter');
    expect(sheetAuthor(sheetBy('LEAGUE_ADMIN'))).toBe('admin');
  });

  it('admits it does not know, for a sheet older than the column', () => {
    expect(sheetAuthor(sheetBy())).toBe('unknown');
    expect(sheetAuthor(null)).toBeNull();
    // And the copy must not claim anything either.
    expect(authorLabel(sheetBy(), 'coach')).toBe('On file');
    expect(authorLabel(sheetBy(), 'reporter')).toBe('On file');
  });

  it('says the same fact differently to each portal', () => {
    // To a coach, their own filing is "your club"; to a reporter it is "the coach".
    expect(authorLabel(sheetBy('TEAM_MANAGER'), 'coach')).toBe('Filed by your club');
    expect(authorLabel(sheetBy('TEAM_MANAGER'), 'reporter')).toBe('Filed by the coach');
    expect(authorLabel(sheetBy('MATCH_REPORTER'), 'coach')).toBe('Recorded by the reporter');
  });
});

describe('what the coach still owes', () => {
  it('is one item, and it is the handover', () => {
    const tasks = matchTasks(fixture(), 1);
    expect(tasks).toHaveLength(1);
    expect(tasks[0].key).toBe('sheet');
    expect(tasks[0].done).toBe(false);
    expect(tasks[0].to).toBe('/team/formation?fixture=10');
    // The reason names the consequence for the reporter, not just the rule.
    expect(tasks[0].why).toMatch(/reporter/i);
  });

  it('changes what it says once the match has started', () => {
    const [task] = matchTasks(fixture({ status: 'LIVE' }), 1);
    expect(task.why).toMatch(/locked/i);
    expect(task.why).toMatch(/reporter/i);
  });

  it('asks nothing of a club with no fixture or no identity', () => {
    expect(matchTasks(null, 1)).toEqual([]);
    expect(matchTasks(fixture(), null)).toEqual([]);
  });
});

describe('squad paperwork', () => {
  const players = [
    { id: 1, documents: [{ docType: 'ID', status: 'APPROVED' }, { docType: 'MEDICAL', status: 'PENDING' }] },
    { id: 2, documents: [{ docType: 'ID', status: 'APPROVED' }, { docType: 'MEDICAL', status: 'APPROVED' }] },
    { id: 3, documents: [] },
  ];

  it('counts only APPROVED documents — a pending upload is not clearance to play', () => {
    const { missing, players: short } = missingDocuments(players, ['ID', 'MEDICAL']);
    // Player 1 is short a MEDICAL (pending does not count), player 3 is short both.
    expect(missing).toBe(3);
    expect(short.map((r: any) => r.player.id)).toEqual([1, 3]);
  });

  it('claims nothing when the league has set no requirements', () => {
    // Zero required types must mean "nothing is required", never "nothing is met".
    expect(missingDocuments(players, []).missing).toBe(0);
    expect(missingDocuments(players).missing).toBe(0);
  });
});

describe('timeUntil', () => {
  const now = Date.parse('2026-03-14T12:00:00Z');
  it('answers the question a coach actually has', () => {
    expect(timeUntil('2026-03-14T12:30:00Z', now)).toBe('in 30 min');
    expect(timeUntil('2026-03-14T15:15:00Z', now)).toBe('in 3h 15m');
    expect(timeUntil('2026-03-17T12:00:00Z', now)).toBe('in 3 days');
  });
  it('does not pretend a passed kick-off is still ahead', () => {
    expect(timeUntil('2026-03-14T11:00:00Z', now)).toBe('kick-off passed');
    expect(timeUntil(null, now)).toBeNull();
  });
});
