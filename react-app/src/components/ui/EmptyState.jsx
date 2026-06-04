import React from 'react';
import { Inbox } from 'lucide-react';
import cn from './cn';

/**
 * Consistent "no data" placeholder for lists and panels.
 */
const EmptyState = ({ icon: Icon = Inbox, title = 'No data yet', hint, className }) => (
  <div
    className={cn(
      'flex flex-col items-center justify-center text-center gap-3 py-16 px-6',
      'border-2 border-dashed border-surface-3 dark:border-white/5 rounded-3xl',