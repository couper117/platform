import React from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import cn from './cn';

/**
 * Action button — a green pill, following the reference design.
 *
 * PILL SHAPE AND A COLOURED GLOW, both from the reference: `border-radius: 50px`
 * with `box-shadow: 0 10px 30px rgba(0,168,89,.4)` and a `translateY(-2px)` lift
 * on hover. The glow is the one place a coloured shadow is allowed, because it
 * marks the single most important control on a screen.
 *
 * WHY THE FILL IS `brand-strong` AND NOT `brand`
 * The reference fills with #00A859 and labels it white — 3.11:1, which fails AA
 * at any button label size. `brand-strong` (#008848) is two shades darker,
 * visually near-identical, and clears 4.5:1. The raw brand is still used for the
 * glow, so the control reads as the same green.
 *
 * SIZES AND TAP TARGETS
 *   md (default) is exactly min-h-tap (44px) — the floor for anything a thumb
 *   hits. lg matches the reference's 15px/40px hero buttons. sm is 36px and is
 *   ADMIN-ONLY: dense tables where a pointer is the input device.
 */

const VARIANTS = {
  // The primary action. Green fill, white label, brand glow, hover lift.
  primary:
    'bg-brand-strong text-brand-on shadow-brand hover:bg-brand-hover hover:-translate-y-0.5 active:translate-y-0',
  // Outlined. Recessive but equal in weight — the "or" in an either/or.
  secondary:
    'border border-hairline bg-surface text-primary shadow-sm hover:border-brand/40 hover:bg-brand-tint hover:text-brand-text',
  // Tertiary. No border or fill, so it sits inline in dense chrome.
  ghost: 'text-secondary hover:bg-brand-tint hover:text-brand-text',
  // Destructive. --on-danger clears AA at every size offered here.
  danger: 'bg-danger text-danger-on shadow-sm hover:brightness-110 hover:-translate-y-0.5',
  // Reversed, for use on a dark hero or photo overlay.
  onDark:
    'border border-white/40 bg-white/20 text-white backdrop-blur-sm hover:bg-white hover:text-primary',
};

const SIZES = {
  sm: 'min-h-9 px-4 text-sm gap-1.5', // admin/dense only — below the 44px floor
  md: 'min-h-tap px-6 text-base gap-2',
  lg: 'min-h-[52px] px-10 text-base gap-2',
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
      'inline-flex items-center justify-center rounded-pill font-bold',
      // `transition-all`, not just colors — the reference lifts on hover, so the
      // transform and shadow have to animate too.
      'transition-all duration-200 ease-standard select-none',
      // Focus comes from the global :focus-visible ring — never restyled per
      // component, so it is identical everywhere in the product.
      'disabled:pointer-events-none disabled:opacity-40 disabled:shadow-none',
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
