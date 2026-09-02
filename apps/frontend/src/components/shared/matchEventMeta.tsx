import React from 'react';
import {
  Goal, Square, RefreshCw, AlertTriangle, Video, Flag, Timer, Activity,
  Hand, PauseCircle, CircleDot, Target,
} from 'lucide-react';

/**
 * Maps a MatchEvent.eventType to display metadata: icon, ink colour and ring.
 *
 * EVERY SPORT HAS ITS OWN INCIDENTS. This map used to be football's vocabulary
 * applied to everything — a basketball game showed yellow cards and a volleyball
 * set showed substitutions in football's sense. Basketball has fouls, timeouts and
 * quarter ends; volleyball has sets and timeouts; handball punishes with a
 * two-minute suspension, not a card. They are all here now, and anything unknown
 * still falls back to a neutral dot rather than borrowing a football icon.
 *
 * COLOUR, AND A BUG THIS FIXES. The old map used `text-green` for a goal and
 * `text-red` for a red card and an own goal — but tailwind.config.js remaps the
 * legacy `red` key onto the brand green, so a red card rendered in exactly the
 * same colour as a goal. It also used `text-gold`, `text-cyan`, `rwanda-blue` and
 * hand-written `dark:` twins. Everything below is on tokens: `--brand` for a
 * score, `--danger` for a dismissal, `--live` for a caution, and neutral ink for
 * period markers, which is the only palette this component needs.
 */

/* `major` is declared on EVERY variant, not just the ones that set it true.
   Omitting it made the return a union where half the members had no `major`, so
   the timeline could not read it without a cast. */
const SCORE = { color: 'text-brand-text', ring: 'border-brand/30 bg-brand-tint', major: true };
const DANGER = { color: 'text-danger-text', ring: 'border-danger/30 bg-danger/10', major: true };
const CAUTION = { color: 'text-live', ring: 'border-live/30 bg-live/10', major: false };
const NEUTRAL = { color: 'text-tertiary', ring: 'border-hairline bg-surface-2', major: false };
const INFO = { color: 'text-secondary', ring: 'border-hairline bg-surface-2', major: false };

export const eventMeta = (type) => {
  switch (type) {
    /* ── scoring ─────────────────────────────────────────────── */
    case 'GOAL':
    case 'PENALTY':
      return { Icon: Goal, ...SCORE };
    case 'SEVEN_METRE': // handball's penalty throw
      return { Icon: Target, ...SCORE };
    case 'THREE_POINTER':
      return { Icon: Target, ...SCORE };
    case 'FREE_THROW':
      return { Icon: CircleDot, ...SCORE };
    case 'OWN_GOAL':
      return { Icon: Goal, ...DANGER };

    /* ── discipline ──────────────────────────────────────────── */
    case 'YELLOW_CARD':
      return { Icon: Square, ...CAUTION };
    case 'RED_CARD':
      return { Icon: Square, ...DANGER };
    case 'FOUL': // basketball
      return { Icon: Hand, ...CAUTION };
    case 'SUSPENSION': // handball's two minutes
      return { Icon: Timer, ...CAUTION };

    /* ── stoppages and personnel ─────────────────────────────── */
    case 'SUBSTITUTION':
      return { Icon: RefreshCw, ...INFO };
    case 'TIMEOUT':
      return { Icon: PauseCircle, ...INFO };
    case 'INJURY':
      return { Icon: AlertTriangle, ...CAUTION };
    case 'VAR':
      return { Icon: Video, ...INFO };

    /* ── period markers ──────────────────────────────────────── */
    case 'KICKOFF':
    case 'FULLTIME':
      return { Icon: Flag, ...NEUTRAL };
    case 'HALFTIME':
    case 'EXTRA_TIME':
    case 'QUARTER_END':
    case 'SET_END':
      return { Icon: Timer, ...NEUTRAL };

    default:
      return { Icon: Activity, ...NEUTRAL };
  }
};

export default eventMeta;
