import React from 'react';
import { Loader2 } from 'lucide-react';
import cn from './cn';

/**
 * Inline loading spinner.
 */
const Spinner = ({ size = 24, className, label }) => (
  <div className={cn('flex items-center justify-center gap-3 text-red', className)} role="status">
    <Loader2 size={size} className="animate-spin" />
    {label && (
      <span className="font-display text-sm uppercase tracking-widest opacity-60">{label}</span>
    )}
    <span className="sr-only">Loading</span>
  </div>
);

export default Spinner;
