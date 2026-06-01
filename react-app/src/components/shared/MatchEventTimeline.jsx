import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import { eventMeta } from './matchEventMeta';
import EmptyState from '../ui/EmptyState';

/**
 * Vertical, home/away-aligned match event feed. New events animate in (used by the
 * live match center). `homeTeamId` decides which side an event renders on.
 */
const MatchEventTimeline = ({ events = [], homeTeamId }) => {
  if (!events.length) {
    return <EmptyState icon={Clock} title="Awaiting kick-off" hint="Live events will appear here as the match unfolds." />;
  }

  // Newest first; if minutes are present, keep chronological-desc ordering.
  const sorted = [...events].sort((a, b) => (b.minute ?? 0) - (a.minute ?? 0));

  return (
    <ol className="relative space-y-3">
      <span className="absolute left-1/2 top-2 bottom-2 w-px -translate-x-1/2 bg-surface-3 dark:bg-white/10 hidden sm:block" />
      <AnimatePresence initial={false}>
        {sorted.map((event, i) => {
          const meta = eventMeta(event.eventType);
          const isHome = homeTeamId != null && event.teamId === homeTeamId;
          const { Icon } = meta;
          return (
            <motion.li
              key={event.id ?? `${event.eventType}-${event.minute}-${i}`}
              layout
              initial={{ opacity: 0, y: -12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className={`relative flex items-stretch gap-3 sm:gap-0 ${isHome ? 'sm:flex-row' : 'sm:flex-row-reverse'}`}
            >
              {/* Card */}