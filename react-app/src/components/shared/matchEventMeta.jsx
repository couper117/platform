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