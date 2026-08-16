import React from 'react';
import cn from './cn';
import responsiveImage from '../../utils/responsiveImage';

/**
 * A person: player, manager, admin, reporter.
 *
 * CIRCULAR ON PURPOSE. Avatar is round and ClubCrest is squared, so the
 * silhouette alone tells you whether you are looking at a person or an
 * organisation — before you read anything. That is shape carrying information,
 * which is the only reason this system allows a shape decision at all.
 *
 * Falls back to initials on --surface-2 rather than a generic person glyph: a
 * roster of twenty identical placeholder icons is unreadable, whereas twenty
 * sets of initials are still scannable.
 */

const SIZES = {
  sm: 'h-6 w-6 text-xs',
  md: 'h-8 w-8 text-xs',
  lg: 'h-10 w-10 text-sm',
};

const PX = { sm: 24, md: 32, lg: 40 };

export const initials = (name = '') =>
  (name || '?')
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?';

/** @param {{ src?: string, name?: string, size?: string, className?: string } & Record<string, any>} props */
const Avatar = ({ src, name, size = 'md', className, ...props }) => {
  const px = PX[size] ?? 32;
  const classes = cn(
    'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-pill',
    'bg-surface-2 font-semibold text-secondary',
    SIZES[size] ?? SIZES.md,
    className
  );

  if (src) {
    return (
      <img
        {...responsiveImage(src, { widths: [px, px * 2], sizes: `${px}px` })}
        alt={name || ''}
        width={px}
        height={px}
        loading="lazy"
        decoding="async"
        className={cn(classes, 'object-cover')}
        {...props}
      />
    );
  }

  return (
    // The name is already in the surrounding row, so the initials are decorative
    // here — hiding them from assistive tech avoids reading the name twice.
    <span className={classes} aria-hidden="true" {...props}>
      {initials(name)}
    </span>
  );
};

export default Avatar;
