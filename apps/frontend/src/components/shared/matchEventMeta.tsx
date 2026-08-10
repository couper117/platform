import React from 'react';
import {
  Goal, Square, RefreshCw, AlertTriangle, Video, Flag, Timer, Activity,
} from 'lucide-react';

/**
 * Maps a MatchEvent.eventType (see Prisma EventType enum) to display metadata:
 * icon and accent color class. Falls back to a neutral activity dot.
 *
 * The visible label is deliberately not returned here — callers resolve it
 * through `enums.event_type.*` so the timeline follows the active language.
 */
export const eventMeta = (type) => {
  switch (type) {
    case 'GOAL':
    case 'PENALTY':
      return { Icon: Goal, color: 'text-green', ring: 'border-green/30 bg-green/10', major: true };
    case 'OWN_GOAL':
      return { Icon: Goal, color: 'text-red', ring: 'border-red/30 bg-red/10', major: true };
    case 'YELLOW_CARD':
      return { Icon: Square, color: 'text-gold', ring: 'border-gold/30 bg-gold/10' };
    case 'RED_CARD':
      return { Icon: Square, color: 'text-red', ring: 'border-red/30 bg-red/10', major: true };
    case 'SUBSTITUTION':
      return { Icon: RefreshCw, color: 'text-rwanda-blue', ring: 'border-rwanda-blue/30 bg-rwanda-blue/10' };
    case 'INJURY':
      return { Icon: AlertTriangle, color: 'text-gold', ring: 'border-gold/30 bg-gold/10' };
    case 'VAR':
      return { Icon: Video, color: 'text-cyan', ring: 'border-cyan/30 bg-cyan/10' };
    case 'KICKOFF':
      return { Icon: Flag, color: 'text-surface-dark/60 dark:text-white/60', ring: 'border-surface-3 dark:border-white/10 bg-surface-2 dark:bg-white/5' };
    case 'HALFTIME':
      return { Icon: Timer, color: 'text-surface-dark/60 dark:text-white/60', ring: 'border-surface-3 dark:border-white/10 bg-surface-2 dark:bg-white/5' };
    case 'FULLTIME':
      return { Icon: Flag, color: 'text-surface-dark/60 dark:text-white/60', ring: 'border-surface-3 dark:border-white/10 bg-surface-2 dark:bg-white/5' };
    case 'EXTRA_TIME':
      return { Icon: Timer, color: 'text-gold', ring: 'border-gold/30 bg-gold/10' };
    default:
      return { Icon: Activity, color: 'text-surface-dark/50 dark:text-white/50', ring: 'border-surface-3 dark:border-white/10 bg-surface-2 dark:bg-white/5' };
  }
};

export default eventMeta;
