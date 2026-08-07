import React from 'react';
import { Link } from 'react-router-dom';
import cn from './cn';

/**
 * Surface panel: one surface level, one hairline, 8px radius.
 *
 * NO SHADOW AND NO HOVER LIFT. Depth in this system comes from surface level and
 * a 1px border, nothing else — a translate-on-hover is decoration that encodes
 * nothing, and on a touch device it never fires at all. An interactive card gets
 * a surface change instead, which reads on both pointer and touch.
 */
const Card = ({
  as = 'div',
  to,
  className,
  children,
  // Swallowed, not forwarded. Un-swept screens still pass `hover` from the old
  // lift-on-hover API; leaking it to the DOM makes React warn about a
  // non-boolean attribute. Removed with the last of those screens.
  hover: _deprecatedHover,
  ...props
}) => {
  const classes = cn(
    'rounded-card border border-hairline bg-surface',
    to && 'block transition-colors duration-150 ease-standard hover:bg-surface-2',
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
