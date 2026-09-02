import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import cn from './cn';

/**
 * Section header for a list or panel.
 *
 * The old version was a 48px uppercase display title with a red all-caps eyebrow
 * above it and 40px of bottom margin — roughly 130px of vertical space to label a
 * list, on a screen with a ~500px budget. This is one 18px line. On a 360px
 * viewport, a heading's job is to label the content, not to be the content.
 *
 * `accent` and `eyebrow` are accepted for the two un-swept call sites and folded
 * into the title / a Badge rather than getting their own treatment.
 */
const SectionHeading = ({ title, accent, eyebrow, action, actionTo, className }: { title?: React.ReactNode; accent?: React.ReactNode; eyebrow?: React.ReactNode; action?: React.ReactNode; actionTo?: string; className?: string }) => (
  <div className={cn('flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1', className)}>
    {/* NOT `truncate`. A truncating title loses the fight with its own "view all"
        link on a narrow screen, which is how "Popular competitions" became
        "Popular competiti…". The row wraps instead: the action drops to the next
        line when there is no room, and the heading is always readable. */}
    <h2 className="min-w-0 font-display text-lg font-semibold text-primary">
      {eyebrow && <span className="text-secondary">{eyebrow} </span>}
      {title}
      {accent && <span className="text-secondary"> {accent}</span>}
    </h2>
    {action && actionTo && (
      <Link
        to={actionTo}
        className="flex shrink-0 items-center gap-1 text-sm text-secondary transition-colors duration-150 ease-standard hover:text-primary"
      >
        {action}
        <ArrowRight size={14} aria-hidden="true" />
      </Link>
    )}
  </div>
);

export default SectionHeading;
