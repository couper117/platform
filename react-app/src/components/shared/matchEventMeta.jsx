import React from 'react';
import {
  Goal, Square, RefreshCw, AlertTriangle, Video, Flag, Timer, Activity,
} from 'lucide-react';

/**
 * Maps a MatchEvent.eventType (see Prisma EventType enum) to display metadata:
 * label, icon, and accent color class. Falls back to a neutral activity dot.
 */
export const eventMeta = (type) => {
  switch (type) {
    case 'GOAL':
    case 'PENALTY':
      return { label: type === 'PENALTY' ? 'Penalty Goal' : 'Goal', Icon: Goal, color: 'text-green', ring: 'border-green/30 bg-green/10', major: true };
    case 'OWN_GOAL':
      return { label: 'Own Goal', Icon: Goal, color: 'text-red', ring: 'border-red/30 bg-red/10', major: true };
    case 'YELLOW_CARD':
      return { label: 'Yellow Card', Icon: Square, color: 'text-gold', ring: 'border-gold/30 bg-gold/10' };
    case 'RED_CARD':
      return { label: 'Red Card', Icon: Square, color: 'text-red', ring: 'border-red/30 bg-red/10', major: true };
    case 'SUBSTITUTION':
      return { label: 'Substitution', Icon: RefreshCw, color: 'text-rwanda-blue', ring: 'border-rwanda-blue/30 bg-rwanda-blue/10' };
    case 'INJURY':
      return { label: 'Injury', Icon: AlertTriangle, color: 'text-gold', ring: 'border-gold/30 bg-gold/10' };
    case 'VAR':
      return { label: 'VAR Check', Icon: Video, color: 'text-cyan', ring: 'border-cyan/30 bg-cyan/10' };
    case 'KICKOFF':
      return { label: 'Kick-off', Icon: Flag, color: 'text-surface-dark/60 dark:text-white/60', ring: 'border-surface-3 dark:border-white/10 bg-surface-2 dark:bg-white/5' };
    case 'HALFTIME':
      return { label: 'Half Time', Icon: Timer, color: 'text-surface-dark/60 dark:text-white/60', ring: 'border-surface-3 dark:border-white/10 bg-surface-2 dark:bg-white/5' };
    case 'FULLTIME':
      return { label: 'Full Time', Icon: Flag, color: 'text-surface-dark/60 dark:text-white/60', ring: 'border-surface-3 dark:border-white/10 bg-surface-2 dark:bg-white/5' };
    case 'EXTRA_TIME':
      return { label: 'Extra Time', Icon: Timer, color: 'text-gold', ring: 'border-gold/30 bg-gold/10' };
    default:
      return { label: (type || 'Event').replace(/_/g, ' '), Icon: Activity, color: 'text-surface-dark/50 dark:text-white/50', ring: 'border-surface-3 dark:border-white/10 bg-surface-2 dark:bg-white/5' };
  }
};

export default eventMeta;
