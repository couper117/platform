import React from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import cn from './cn';

/**
 * Action button.
 *
 * WHY PRIMARY IS AN INVERSION, NOT A COLOUR
 * The system has no brand accent to spend: --live is reserved for live state and
 * --danger for destruction. So the primary action is the highest-contrast thing
 * on the screen — the text colour used as a fill, with the page colour as its
 * label. On dark that reads near-white on near-black. It needs no extra hue and
 * it can never be confused for a status.
 *
 * SIZES AND TAP TARGETS
 *   md (default) is exactly min-h-tap (44px) — the floor for anything a thumb
 *   hits. lg is for the primary action on a fan screen, which lives in the
 *   bottom third. sm is 36px and is ADMIN-ONLY: dense tables where a pointer is
 *   the input device. Never use sm on a fan screen.
 */

const VARIANTS = {
  // Maximum contrast. One per screen, ideally.
  primary: 'bg-primary text-page hover:bg-primary/90 active:bg-primary/80',
  // Equal weight to primary but recessive — the "or" in an either/or.
  secondary:
    'border border-hairline text-primary hover:bg-surface-2 active:bg-surface-2/70',
  // Tertiary. No border, so it can sit inline in dense chrome without adding lines.
  ghost: 'text-secondary hover:bg-surface-2 hover:text-primary active:bg-surface-2/70',
  // Destructive. --on-danger is only AA at 14px+/600, which every size here clears.
  danger: 'bg-danger text-danger-on hover:bg-danger/90 active:bg-danger/80',
};

const SIZES = {
  sm: 'min-h-9 px-3 text-sm gap-1.5', // admin/dense only — below the 44px floor
  md: 'min-h-tap px-4 text-base gap-2',
  lg: 'min-h-[52px] px-6 text-base gap-2',
};

const ICON_SIZE = { sm: 14, md: 16, lg: 18 };

const Button = React.forwardRef(
  (
    {
      to,
      href,
      variant = 'primary',
      size = 'md',
      block = false,
      loading = false,
      disabled = false,
      icon: Icon,
      iconRight = false,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const classes = cn(
      'inline-flex items-center justify-center rounded-control font-semibold',
      'transition-colors duration-150 ease-standard select-none',
      // Focus comes from the global :focus-visible ring — never restyled per
      // component, so it is identical everywhere in the product.
      'disabled:opacity-40 disabled:pointer-events-none',
      VARIANTS[variant] ?? VARIANTS.primary,
      SIZES[size] ?? SIZES.md,
      block && 'w-full',
      className
    );

    const px = ICON_SIZE[size] ?? 16;
    const content = (
      <>
        {loading && <Loader2 size={px} className="animate-spin" aria-hidden="true" />}
        {!loading && Icon && !iconRight && <Icon size={px} aria-hidden="true" />}
        {children}
        {!loading && Icon && iconRight && <Icon size={px} aria-hidden="true" />}
      </>
    );

    if (to) {
      return (
        <Link ref={ref} to={to} className={classes} {...props}>
          {content}
        </Link>
      );
    }
    if (href) {
      return (
        <a ref={ref} href={href} className={classes} {...props}>
          {content}
        </a>
      );
    }
    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {content}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
