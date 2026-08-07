import React from 'react';
import cn from './cn';

/**
 * Loading placeholder. Skeletons everywhere, spinners nowhere.
 *
 * Deliberately dumb and composable. The old Skeleton took a `type` prop
 * ('card' | 'table-row' | 'stat') and hardcoded a layout per type, which meant
 * the skeleton and the real component drifted apart the moment either changed.
 * Instead: primitives here, and each domain component ships its OWN skeleton
 * built from them — MatchRow.Skeleton lives next to MatchRow and shares its
 * metrics, so it cannot drift.
 *
 *   <Skeleton className="h-4 w-24" />        one block
 *   <Skeleton circle className="h-8 w-8" />  avatar
 *   <SkeletonText lines={3} />               paragraph, last line short
 */
const Skeleton = ({ circle = false, className, ...props }) => (
  <div
    aria-hidden="true"
    className={cn(
      'animate-pulse bg-surface-2',
      circle ? 'rounded-pill' : 'rounded-control',
      className
    )}
    {...props}
  />
);

/** Multi-line text placeholder. The short last line reads as prose, not bars. */
export const SkeletonText = ({ lines = 3, className }) => (
  <div className={cn('space-y-2', className)}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton key={i} className={cn('h-3', i === lines - 1 ? 'w-2/3' : 'w-full')} />
    ))}
  </div>
);

/**
 * Wraps a list of skeletons with the right semantics: assistive tech is told the
 * region is busy rather than reading out a pile of empty boxes.
 */
export const SkeletonList = ({ count = 6, children, className }) => (
  <div role="status" aria-busy="true" aria-live="polite" className={className}>
    <span className="sr-only">Loading…</span>
    {Array.from({ length: count }).map((_, i) => (
      <React.Fragment key={i}>{children}</React.Fragment>
    ))}
  </div>
);

export default Skeleton;
