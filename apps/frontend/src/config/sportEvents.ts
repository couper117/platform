/**
 * What a reporter can log, per sport.
 *
 * THE CONSOLE SPOKE ONLY FOOTBALL. Its four buttons were Goal, Card, Sub, Note,
 * and the goal sheet offered Goal / Penalty / Own goal. A basketball reporter had
 * no way to say "three-pointer" and no way to say "foul" — they had a yellow card
 * and a one-point goal, neither of which exists in the game they were watching.
 * A volleyball reporter had a substitution and a card, and no way to record a set.
 * Everything they logged was wrong in a way the public match page then displayed.
 *
 * This is the vocabulary, keyed by sport slug. It drives three things at once —
 * the buttons in the action bar, the steps inside the capture sheet, and the
 * labels in the match feed — so a sport cannot be half-added: give it an entry
 * here and the console speaks it everywhere.
 *
 * NOTHING HERE IS DECORATIVE. Every `value` is a real member of the `EventType`
 * enum in schema.prisma, and every `points` matches `EVENT_POINTS` in
 * services/matchEvents.service.ts, which is what actually computes the score. The
 * weights are repeated here only so the sheet can show a reporter what a tap is
 * worth before they make it; the server never trusts them.
 *
 * WHAT THIS DOES NOT FIX. The match CLOCK is still two 45-minute halves for every
 * sport — basketball's quarters and volleyball's sets do not exist in
 * matchClock.logic.ts, and inventing them in the UI would print a period the
 * stored data does not have. That is its own piece of work; the events layer is
 * this one.
 */

import {
  ArrowLeftRight, CircleDot, Hand, MessageSquare, PauseCircle,
  RectangleHorizontal, Target,
} from 'lucide-react';

/** How the capture sheet behaves for an action. */
export type CaptureKind =
  /** Pick a variant, then a team, then a player. The variants are worth points. */
  | 'score'
  /** Pick which sanction, then a team, then a player. */
  | 'discipline'
  /** Team, then who comes off, then who comes on. */
  | 'sub'
  /** Free text, no team and no player. */
  | 'note'
  /** Pick a team and publish — nothing else to say. */
  | 'team';

export type EventVariant = {
  /** A real EventType. */
  value: string;
  label: string;
  /** What it adds to the score, for the sheet's own display only. */
  points?: number;
  /** Chip styling where a variant needs its own colour (cards). */
  tone?: string;
};

export type SportAction = {
  id: string;
  /** The word on the button in the action bar. */
  label: string;
  icon: any;
  tone: string;
  kind: CaptureKind;
  /** The question above the variant chips, where there is more than one. */
  prompt?: string;
  variants?: EventVariant[];
  /** For `team`: the single event published once a side is chosen. */
  eventType?: string;
};

/* ── the pieces most sports share ────────────────────────────────────────── */

const SUB: SportAction = {
  id: 'sub', label: 'Sub', icon: ArrowLeftRight, tone: 'border-hairline text-secondary', kind: 'sub',
};

const NOTE: SportAction = {
  id: 'note', label: 'Note', icon: MessageSquare, tone: 'border-hairline text-secondary', kind: 'note',
};

const TIMEOUT: SportAction = {
  id: 'timeout',
  label: 'Timeout',
  icon: PauseCircle,
  tone: 'border-hairline text-secondary',
  kind: 'team',
  eventType: 'TIMEOUT',
};

/** Football's cards, and the two most sports borrow. */
const CARDS: EventVariant[] = [
  { value: 'YELLOW_CARD', label: 'Yellow', tone: 'border-live bg-live/10 text-live' },
  { value: 'RED_CARD', label: 'Red', tone: 'border-danger bg-danger/10 text-danger-text' },
];

const cardAction = (variants: EventVariant[] = CARDS, label = 'Card'): SportAction => ({
  id: 'discipline',
  label,
  icon: RectangleHorizontal,
  tone: 'border-live/40 text-live',
  kind: 'discipline',
  prompt: 'Which sanction?',
  variants,
});

const scoreAction = (label: string, prompt: string, variants: EventVariant[]): SportAction => ({
  id: 'score',
  label,
  icon: CircleDot,
  tone: 'border-brand/40 text-brand-text',
  kind: 'score',
  prompt,
  variants,
});

/* ── per sport ───────────────────────────────────────────────────────────── */

const FOOTBALL: SportAction[] = [
  scoreAction('Goal', 'What kind of goal?', [
    { value: 'GOAL', label: 'Goal', points: 1 },
    { value: 'PENALTY', label: 'Penalty', points: 1 },
    { value: 'OWN_GOAL', label: 'Own goal', points: 1 },
  ]),
  cardAction(),
  SUB,
  NOTE,
];

/**
 * Basketball. Three scoring values, and a foul that is a foul — not a card, and
 * with no match ban behind it, which is why the server only ever builds a
 * suspension from RED_CARD and YELLOW_CARD.
 */
const BASKETBALL: SportAction[] = [
  scoreAction('Score', 'How many?', [
    { value: 'TWO_POINTER', label: '2 points', points: 2 },
    { value: 'THREE_POINTER', label: '3 points', points: 3 },
    { value: 'FREE_THROW', label: 'Free throw', points: 1 },
    { value: 'DUNK', label: 'Dunk', points: 2 },
  ]),
  {
    id: 'foul',
    label: 'Foul',
    icon: Hand,
    tone: 'border-live/40 text-live',
    kind: 'discipline',
    prompt: 'Which sanction?',
    variants: [
      { value: 'FOUL', label: 'Personal foul', tone: 'border-live bg-live/10 text-live' },
      { value: 'RED_CARD', label: 'Ejection', tone: 'border-danger bg-danger/10 text-danger-text' },
    ],
  },
  TIMEOUT,
  SUB,
  NOTE,
];

/**
 * Volleyball is scored in SETS on this platform — a fixture's homeScore is sets
 * won — so the scoring event is the set, not the rally point. Logging points
 * would produce a number that is neither the set score nor the point score, and
 * no player wins a set on their own, so it names a team and stops there.
 */
const VOLLEYBALL: SportAction[] = [
  {
    id: 'score',
    label: 'Set won',
    icon: Target,
    tone: 'border-brand/40 text-brand-text',
    kind: 'team',
    eventType: 'SET_WON',
  },
  TIMEOUT,
  SUB,
  NOTE,
];

/** Handball: the penalty throw is a goal, and the sanction is minutes, not a card. */
const HANDBALL: SportAction[] = [
  scoreAction('Goal', 'What kind of goal?', [
    { value: 'GOAL', label: 'Goal', points: 1 },
    { value: 'SEVEN_METRE', label: '7-metre', points: 1 },
  ]),
  cardAction([
    { value: 'SUSPENSION', label: '2 minutes', tone: 'border-live bg-live/10 text-live' },
    ...CARDS,
  ], 'Sanction'),
  SUB,
  NOTE,
];

/** Rugby, where the four scoring values are the whole point of a weighted score. */
const RUGBY: SportAction[] = [
  scoreAction('Score', 'What was it?', [
    { value: 'TRY', label: 'Try', points: 5 },
    { value: 'CONVERSION', label: 'Conversion', points: 2 },
    { value: 'PENALTY_KICK', label: 'Penalty', points: 3 },
    { value: 'DROP_GOAL', label: 'Drop goal', points: 3 },
  ]),
  cardAction([
    { value: 'YELLOW_CARD', label: 'Sin bin', tone: 'border-live bg-live/10 text-live' },
    { value: 'RED_CARD', label: 'Red', tone: 'border-danger bg-danger/10 text-danger-text' },
  ]),
  SUB,
  NOTE,
];

const BY_SLUG: Record<string, SportAction[]> = {
  football: FOOTBALL,
  basketball: BASKETBALL,
  volleyball: VOLLEYBALL,
  handball: HANDBALL,
  rugby: RUGBY,
};

/**
 * A sport nobody has described yet.
 *
 * Football's set would be the tempting default — it is the one most of this
 * platform runs — but it is also the one most likely to be WRONG, and a cricket
 * reporter offered "Own goal" learns nothing except that the tool does not know
 * what they are watching. The generic set can describe any match honestly: one
 * point at a time, two cards, and free text for everything the tool has no word
 * for yet.
 */
const GENERIC: SportAction[] = [
  scoreAction('Score', 'Add a point for', [{ value: 'GOAL', label: 'Point', points: 1 }]),
  cardAction(),
  SUB,
  NOTE,
];


/* ── the statistics sheet ────────────────────────────────────────────────── */

/**
 * Which of `MatchStat`'s columns a sport actually has.
 *
 * The stats form asked every reporter for corners, offsides and goalkeeper
 * saves. A basketball game has none of the three, so the form was eight fields of
 * which five were unanswerable — and a volleyball reporter was being asked for
 * possession. Fields left blank are stored as null either way, so nothing here
 * changes what the server keeps; it changes what a reporter is asked to find.
 *
 * These are subsets, never additions: `MatchStat` has thirteen columns and no
 * others, so a basketball-native line like rebounds or a volleyball dig cannot be
 * offered without a migration. `shots` / `shotsOnTarget` are relabelled per sport
 * where the same column means something different — attempts and made baskets are
 * a fair reading of the same two numbers — and the label is the only thing that
 * moves. Anything the columns cannot express is left out rather than approximated.
 */
const ALL_STATS = [
  'possession', 'shots', 'shotsOnTarget', 'corners', 'offsides', 'fouls', 'gkSaves', 'passAccuracy',
];

type StatField = { key: string; label: string; percent?: boolean };

const STAT_LABELS: Record<string, StatField> = {
  possession: { key: 'possession', label: 'Possession (%)', percent: true },
  shots: { key: 'shots', label: 'Shots' },
  shotsOnTarget: { key: 'shotsOnTarget', label: 'Shots on target' },
  corners: { key: 'corners', label: 'Corners' },
  offsides: { key: 'offsides', label: 'Offsides' },
  fouls: { key: 'fouls', label: 'Fouls' },
  gkSaves: { key: 'gkSaves', label: 'Goalkeeper saves' },
  passAccuracy: { key: 'passAccuracy', label: 'Pass accuracy (%)', percent: true },
};

const STATS_BY_SLUG: Record<string, StatField[]> = {
  football: ALL_STATS.map((k) => STAT_LABELS[k]),
  basketball: [
    { key: 'shots', label: 'Field goals attempted' },
    { key: 'shotsOnTarget', label: 'Field goals made' },
    { key: 'fouls', label: 'Team fouls' },
  ],
  // Nothing in MatchStat describes a volleyball rally, so the sheet asks for the
  // one thing it can hold honestly rather than eight things it cannot.
  volleyball: [{ key: 'fouls', label: 'Faults' }],
  handball: [
    { key: 'shots', label: 'Shots' },
    { key: 'shotsOnTarget', label: 'Shots on target' },
    { key: 'fouls', label: 'Fouls' },
    { key: 'gkSaves', label: 'Goalkeeper saves' },
  ],
  rugby: [
    { key: 'possession', label: 'Possession (%)', percent: true },
    { key: 'fouls', label: 'Penalties conceded' },
  ],
};

/** The statistics worth asking a reporter for, given the sport. */
export const statFieldsForSport = (slug?: string | null): StatField[] =>
  (slug && STATS_BY_SLUG[String(slug).toLowerCase()]) || STATS_BY_SLUG.football;

/** The actions a reporter is offered for a fixture's sport. */
export const actionsForSport = (slug?: string | null): SportAction[] =>
  (slug && BY_SLUG[String(slug).toLowerCase()]) || GENERIC;

/**
 * Every label this vocabulary can produce, flattened — the match feed needs to
 * name an event it did not create, including one logged before a sport's entry
 * existed or by an admin on another screen.
 */
export const EVENT_LABEL: Record<string, string> = {
  GOAL: 'Goal',
  PENALTY: 'Penalty',
  OWN_GOAL: 'Own goal',
  SEVEN_METRE: '7-metre',
  TWO_POINTER: '2 points',
  THREE_POINTER: '3 points',
  FREE_THROW: 'Free throw',
  DUNK: 'Dunk',
  SET_WON: 'Set won',
  TRY: 'Try',
  CONVERSION: 'Conversion',
  PENALTY_KICK: 'Penalty kick',
  DROP_GOAL: 'Drop goal',
  YELLOW_CARD: 'Yellow card',
  RED_CARD: 'Red card',
  FOUL: 'Foul',
  SUSPENSION: '2 minutes',
  SUBSTITUTION: 'Substitution',
  TIMEOUT: 'Timeout',
  INJURY: 'Injury',
  VAR: 'VAR',
  COMMENTARY: 'Update',
  KICKOFF: 'Kick-off',
  HALFTIME: 'Half time',
  FULLTIME: 'Full time',
  EXTRA_TIME: 'Extra time',
};

/**
 * Ink and border for an event in the feed.
 *
 * Green for anything that moved the score, danger for a dismissal or an own
 * goal, `--live` for a caution, quiet for everything procedural. Mirrors
 * components/shared/matchEventMeta, which paints the same events on the public
 * timeline — the two must agree, because a reporter and a fan are looking at the
 * same feed from opposite sides.
 */
const SCORING = new Set([
  'GOAL', 'PENALTY', 'SEVEN_METRE', 'TWO_POINTER', 'THREE_POINTER', 'FREE_THROW',
  'DUNK', 'SET_WON', 'TRY', 'CONVERSION', 'PENALTY_KICK', 'DROP_GOAL',
]);
const DISMISSAL = new Set(['RED_CARD', 'OWN_GOAL']);
const CAUTION = new Set(['YELLOW_CARD', 'FOUL', 'SUSPENSION', 'INJURY']);

export const eventTone = (type: string) => {
  if (SCORING.has(type)) return { tone: 'text-brand-text', ring: 'border-brand/30' };
  if (DISMISSAL.has(type)) return { tone: 'text-danger-text', ring: 'border-danger/30' };
  if (CAUTION.has(type)) return { tone: 'text-live', ring: 'border-live/30' };
  return { tone: 'text-secondary', ring: 'border-hairline' };
};

export default { actionsForSport, statFieldsForSport, EVENT_LABEL, eventTone };
