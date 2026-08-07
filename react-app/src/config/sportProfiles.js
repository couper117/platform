import i18n from 'i18next';

// Per-type management profile. Reused across the admin so pages adapt their
// terminology, form fields and competition options to how a sport is actually
// run — a football league is not a cycling tour is not a judo championship.
//
// Sport.type comes from the API (TEAM | RACING | COMBAT | RACKET).
//
// The text is read from `sport_profile.<TYPE>.*` at access time so the labels
// follow the active language. The shape is unchanged, so callers keep using
// `profile.competitorPlural` and `profile.formats[].label` as before.

const TEXT_FIELDS = [
  'label',
  'competitor', 'competitorPlural',
  'roster', 'rosterPlural',
  'rosterField',
  'rosterRegistry',
  'competition', 'competitionPlural',
  'event', 'eventPlural',
  'result',
];

const buildProfile = (type, formatValues) => {
  const profile = { key: type };

  for (const field of TEXT_FIELDS) {
    Object.defineProperty(profile, field, {
      get: () => i18n.t(`sport_profile.${type}.${field}`),
      enumerable: true,
    });
  }

  profile.formats = formatValues.map((value) => ({
    value,
    get label() {
      return i18n.t(`sport_profile.${type}.formats.${value}`);
    },
  }));

  return profile;
};

export const SPORT_PROFILES = {
  TEAM: buildProfile('TEAM', ['LEAGUE', 'KNOCKOUT', 'GROUP_KNOCKOUT', 'ROUND_ROBIN']),
  RACING: buildProfile('RACING', ['ROUND_ROBIN', 'KNOCKOUT', 'LEAGUE']),
  COMBAT: buildProfile('COMBAT', ['KNOCKOUT', 'GROUP_KNOCKOUT', 'ROUND_ROBIN']),
  RACKET: buildProfile('RACKET', ['KNOCKOUT', 'GROUP_KNOCKOUT', 'ROUND_ROBIN']),
};

export const profileFor = (type) => SPORT_PROFILES[type] || SPORT_PROFILES.TEAM;
