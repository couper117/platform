/**
 * Design-system primitives. Everything here is written from the tokens in
 * src/styles/tokens.css and rendered on the /design-system route.
 *
 * Rules for anything added to this folder:
 *   - No hex values. Tokens only.
 *   - No shadows, no gradients.
 *   - Mobile-first: author at 360px, add `md:` upward.
 *   - Interactive targets are min-h-tap (44px) unless explicitly admin-dense.
 *   - It renders on /design-system, with a skeleton variant where it can load.
 */

// Actions
export { default as Button } from './Button';
export { default as IconButton } from './IconButton';

// Forms
export { default as Field } from './Field';
export { default as Input } from './Input';
export { default as Select } from './Select';
export { default as Modal } from './Modal';

// Status & metadata
export { default as Badge } from './Badge';
export { default as StatusPill } from './StatusPill';

// Containers
export { default as Card } from './Card';
export { default as SectionHeading } from './SectionHeading';

// Identity — round is a person, squared is an organisation
export { default as Avatar, initials } from './Avatar';
export { default as ClubCrest } from './ClubCrest';

// Loading / empty / error — every list needs all three
export { default as Skeleton, SkeletonText, SkeletonList } from './Skeleton';
export { default as EmptyState } from './EmptyState';
export { default as ErrorState } from './ErrorState';

export { default as cn } from './cn';
