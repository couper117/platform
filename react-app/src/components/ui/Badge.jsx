import React from 'react';
import cn from './cn';
import StatusPill from './StatusPill';

/**
 * Quiet metadata chip — matchday, age category, competition stage, doc type.
 *
 * Badge is deliberately NOT semantic. It carries a fact, not a state, so it has
 * one visual treatment and never competes with a StatusPill sitting next to it.
 * If you are tempted to give a Badge a colour to mean something, you want
 * StatusPill instead.
 */
const Badge = ({ className, children, ...props }) => (
  <span
    className={cn(
      'inline-flex items-center rounded-pill border border-hairline px-2 py-0.5',
      'text-xs font-medium text-secondary whitespace-nowrap',
      className
    )}
    {...props}
  >
    {children}
  </span>
);

export default Badge;

/**
 * @deprecated Compatibility shim. Three un-swept screens still import LiveBadge
 * (AmashuriFixtureCard, AmashuriMatchPage, MatchDetailsPage). It forwards to
 * StatusPill so they render the real live pill instead of the legacy red one, and
 * is deleted when those screens are rewritten in Phases 4 and 8.
 */
export const LiveBadge = ({ minute, className }) => (
  <StatusPill
    status="LIVE"
    label={typeof minute === 'number' ? `Live ${minute}’` : 'Live'}
    className={className}
  />
);
