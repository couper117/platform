// Per-type management profile. Reused across the admin so pages adapt their
// terminology, form fields and competition options to how a sport is actually
// run — a football league is not a cycling tour is not a judo championship.
//
// Sport.type comes from the API (TEAM | RACING | COMBAT | RACKET).

export const SPORT_PROFILES = {
  TEAM: {
    key: 'TEAM',
    label: 'Team sport',
    competitor: 'Team', competitorPlural: 'Teams',
    roster: 'Player', rosterPlural: 'Players',
    rosterField: 'Position',                 // e.g. Goalkeeper, Forward
    rosterRegistry: 'Athlete Registry',
    competition: 'League', competitionPlural: 'Leagues',
    event: 'Fixture', eventPlural: 'Fixtures',
    result: 'Score',                         // home vs away score
    formats: [
      { value: 'LEAGUE', label: 'League (round-robin)' },
      { value: 'KNOCKOUT', label: 'Knockout / Cup' },
      { value: 'GROUP_KNOCKOUT', label: 'Groups + Knockout' },
      { value: 'ROUND_ROBIN', label: 'Double round-robin' },
    ],
  },
  RACING: {
    key: 'RACING',
    label: 'Racing / individual',
    competitor: 'Club', competitorPlural: 'Clubs',
    roster: 'Athlete', rosterPlural: 'Riders & Athletes',
    rosterField: 'Specialty',                // e.g. Sprinter, Climber, 100m
    rosterRegistry: 'Athlete Registry',
    competition: 'Race Series', competitionPlural: 'Races & Tours',
    event: 'Race', eventPlural: 'Race Calendar',
    result: 'Time / Position',
    formats: [
      { value: 'ROUND_ROBIN', label: 'Stage race / Tour' },
      { value: 'KNOCKOUT', label: 'Single race / Time-trial' },
      { value: 'LEAGUE', label: 'Season series' },
    ],
  },
  COMBAT: {
    key: 'COMBAT',
    label: 'Combat sport',
    competitor: 'Club', competitorPlural: 'Clubs',
    roster: 'Athlete', rosterPlural: 'Athletes',
    rosterField: 'Weight Category',          // e.g. -60kg, -73kg
    rosterRegistry: 'Athlete Registry',
    competition: 'Championship', competitionPlural: 'Championships',
    event: 'Bout', eventPlural: 'Bouts',
    result: 'Result',
    formats: [
      { value: 'KNOCKOUT', label: 'Elimination bracket' },
      { value: 'GROUP_KNOCKOUT', label: 'Pools + Bracket' },
      { value: 'ROUND_ROBIN', label: 'Round-robin pool' },
    ],
  },
  RACKET: {
    key: 'RACKET',
    label: 'Racket / 1v1',
    competitor: 'Club', competitorPlural: 'Clubs',
    roster: 'Player', rosterPlural: 'Players',
    rosterField: 'Discipline',               // singles / doubles
    rosterRegistry: 'Player Registry',
    competition: 'Tournament', competitionPlural: 'Tournaments',
    event: 'Match', eventPlural: 'Matches',
    result: 'Sets',
    formats: [
      { value: 'KNOCKOUT', label: 'Single-elimination' },
      { value: 'GROUP_KNOCKOUT', label: 'Groups + Knockout' },
      { value: 'ROUND_ROBIN', label: 'Round-robin' },
    ],
  },
};

export const profileFor = (type) => SPORT_PROFILES[type] || SPORT_PROFILES.TEAM;
