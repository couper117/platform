import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import cn from './cn';

/**
 * Standard section header: small red eyebrow label + big display title,
 * with an optional "view all" link. Matches the HomePage pattern.
 */
const SectionHeading = ({
  eyebrow,
  title,
  accent,
  action,
  actionTo,
  className,
}) => (
  <div
    className={cn(
      'flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10',
      className
    )}
  >
    <div className="space-y-2">
      {eyebrow && (
        <h2 className="text-[10px] uppercase font-bold tracking-[0.4em] text-red">
          {eyebrow}
        </h2>
      )}
      <h3 className="text-4xl sm:text-5xl font-display uppercase tracking-tight text-surface-dark dark:text-white">
        {title} {accent && <span className="text-red">{accent}</span>}
      </h3>
    </div>
    {action && actionTo && (
      <Link
        to={actionTo}
        className="group flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-surface-dark/40 dark:text-white/40 hover:text-red transition-colors"
      >
        <span>{action}</span>
        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
      </Link>
    )}
  </div>
);

export default SectionHeading;
