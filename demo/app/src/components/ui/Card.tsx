import React from 'react';
import { Link } from 'react-router-dom';
import cn from './cn';

/**
 * Surface panel — 20px radius, soft shadow, lift on hover.
 *
 * DEPTH COMES FROM SHADOW, following the reference: a resting
 * `0 10px 30px rgba(0,0,0,.06)` deepening to `0 20px 50px rgba(0,0,0,.1)` and a
 * `translateY(-6px)` lift when the card is a link. The reference goes to -10px;
 * this is pulled back because a data list of these would visibly shudder.
 *
 * Touch devices never fire hover, so an interactive card also darkens its border
 * to brand — a state that reads on both pointer and touch.
 */
type CardProps = {
  as?: any;
  to?: string;
  flat?: boolean;
  className?: string;
  children?: React.ReactNode;
  hover?: boolean;
} & Record<string, any>;

const Card = ({
  as = 'div',
  to,
  flat = false,
  className,
  children,
  // Swallowed, not forwarded. Un-swept screens still pass `hover` from the old
  // API; leaking it to the DOM makes React warn about a non-boolean attribute.
  hover: _deprecatedHover,
  ...props
}: CardProps) => {
  const classes = cn(
    'rounded-card border border-hairline bg-surface',
    !flat && 'shadow-md',
    to &&
      'block transition-all duration-300 ease-standard hover:-translate-y-1.5 hover:border-brand/30 hover:shadow-lg',
    className
  );

  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {children}
      </Link>
    );
  }

  const Comp = as;
  return (
    <Comp className={classes} {...props}>
      {children}
    </Comp>
  );
};

export default Card;
