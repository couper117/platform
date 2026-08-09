import React from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import cn from './cn';

const variants = {
  primary:
    'bg-red text-white hover:bg-red-dark shadow-lg shadow-red/20 hover:shadow-red/40',
  blue:
    'bg-rwanda-blue text-white hover:brightness-110 shadow-lg shadow-rwanda-blue/20 hover:shadow-rwanda-blue/40',
  secondary:
    'bg-surface-2 dark:bg-white/5 text-surface-dark dark:text-white border border-surface-3 dark:border-white/10 hover:bg-surface-3 dark:hover:bg-white/10',
  outline:
    'bg-transparent border border-red/30 text-red hover:bg-red/5',
  ghost:
    'bg-transparent text-surface-dark/60 dark:text-white/60 hover:text-red hover:bg-red/5',
  dark:
    'bg-surface-dark text-white hover:bg-surface-dark2 border border-white/10',
};

const sizes = {
  sm: 'text-[11px] px-4 py-2 rounded-lg',
  md: 'text-sm px-6 py-3 rounded-xl',
  lg: 'text-xl px-12 py-4 rounded-xl',
};

/**
 * Unified action button. Renders an <a>, react-router <Link>, or <button>.
 * Uses the display font + uppercase tracking to match the RwaSport identity.
 */
const Button = React.forwardRef(
  (
    {
      as,
      to,
      href,
      variant = 'primary',
      size = 'md',
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
      'inline-flex items-center justify-center gap-2 font-display uppercase tracking-widest',
      'transition-all duration-200 active:scale-95 cursor-pointer select-none',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
      'disabled:opacity-50 disabled:pointer-events-none',
      variants[variant],
      sizes[size],
      className
    );

    const content = (
      <>
        {loading && <Loader2 size={16} className="animate-spin" />}
        {!loading && Icon && !iconRight && <Icon size={size === 'lg' ? 20 : 16} />}
        {children}
        {!loading && Icon && iconRight && <Icon size={size === 'lg' ? 20 : 16} />}
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
        {...props}
      >
        {content}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
