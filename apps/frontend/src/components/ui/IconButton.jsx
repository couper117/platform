import React from 'react';
import { Link } from 'react-router-dom';
import cn from './cn';

/**
 * Square, icon-only control.
 *
 * `label` IS REQUIRED AND IT IS THE POINT OF THIS COMPONENT.
 * The old codebase had 81 <button> elements and 9 aria-labels. An icon-only
 * button with no accessible name is invisible to a screen reader, and code
 * review does not reliably catch it. So the name is a required prop rather than
 * an optional attribute: it becomes aria-label plus the native tooltip, and in
 * development a missing one warns loudly.
 *
 * Also enforces the 44px minimum tap target, which icon buttons are the most
 * likely control to violate.
 */

const VARIANTS = {
  ghost: 'text-secondary hover:bg-surface-2 hover:text-primary',
  secondary: 'border border-hairline text-primary hover:bg-surface-2',
  danger: 'text-danger-text hover:bg-danger/10',
};

const SIZES = {
  // Admin/dense only — a pointer target, not a thumb target.
  sm: 'h-9 w-9',
  md: 'h-tap w-tap',
};

const ICON_SIZE = { sm: 16, md: 20 };

const IconButton = React.forwardRef(
  /**
   * The JSDoc sits on the INNER function, not the outer const: `forwardRef`
   * infers its prop type from the render function it is handed, so a type on the
   * const is ignored and a `.tsx` caller still sees bare `RefAttributes<any>`.
   *
   * @param {{
   *   icon: any,
   *   label: string,
   *   to?: string,
   *   href?: string,
   *   variant?: 'ghost' | 'secondary' | 'danger',
   *   size?: 'sm' | 'md',
   *   className?: string,
   * } & Record<string, any>} props
   */
  (
    { icon: Icon, label, to, href, variant = 'ghost', size = 'md', className, ...props },
    ref
  ) => {
    if (import.meta.env.DEV && !label) {
      console.warn(
        '[IconButton] `label` is required — an icon-only control with no accessible name is unusable with a screen reader.'
      );
    }

    const classes = cn(
      'inline-flex shrink-0 items-center justify-center rounded-control',
      'transition-colors duration-150 ease-standard',
      'disabled:opacity-40 disabled:pointer-events-none',
      VARIANTS[variant] ?? VARIANTS.ghost,
      SIZES[size] ?? SIZES.md,
      className
    );

    const glyph = Icon ? <Icon size={ICON_SIZE[size] ?? 20} aria-hidden="true" /> : null;
    const a11y = { 'aria-label': label, title: label };

    if (to) {
      return (
        <Link ref={ref} to={to} className={classes} {...a11y} {...props}>
          {glyph}
        </Link>
      );
    }
    if (href) {
      return (
        <a ref={ref} href={href} className={classes} {...a11y} {...props}>
          {glyph}
        </a>
      );
    }
    return (
      <button ref={ref} type="button" className={classes} {...a11y} {...props}>
        {glyph}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';

export default IconButton;
