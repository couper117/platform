import React from 'react';
import cn from './cn';

const tones = {
  red: 'bg-red/10 text-red border-red/20',
  green: 'bg-green/10 text-green border-green/20',
  gold: 'bg-gold/10 text-gold border-gold/20',
  blue: 'bg-rwanda-blue/10 text-rwanda-blue border-rwanda-blue/20',
  neutral:
    'bg-surface-2 dark:bg-white/5 text-surface-dark/60 dark:text-white/50 border-surface-3 dark:border-white/10',
};

/**
 * Small status / category pill.
 */
const Badge = ({ tone = 'neutral', className, children, ...props }) => (
  <span
    className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border',
      'text-[10px] font-bold uppercase tracking-widest',
      tones[tone],
      className
    )}
    {...props}
  >
    {children}
  </span>
);

/**
 * Animated "LIVE" indicator used across fixtures and match pages.
 */
export const LiveBadge = ({ minute, className }) => (
  <span
    className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full',
      'bg-red/10 border border-red/20 text-red',
      'text-[10px] font-bold uppercase tracking-widest italic',
      className
    )}
  >
    <span className="w-1.5 h-1.5 bg-red rounded-full animate-pulse shadow-sm shadow-red" />
    Live{typeof minute === 'number' ? ` • ${minute}'` : ''}
  </span>
);

export default Badge;
