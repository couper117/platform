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
              <div className={`flex-1 ${isHome ? 'sm:pr-8 sm:text-right' : 'sm:pl-8 sm:text-left'}`}>
                <div className={`inline-flex flex-col gap-0.5 rounded-2xl border p-3 sm:p-4 w-full sm:w-auto ${meta.ring} ${meta.major ? 'shadow-sm' : ''} ${isHome ? 'sm:items-end' : 'sm:items-start'}`}>
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${meta.color}`}>{meta.label}</span>
                  {event.player?.fullName && (
                    <span className="font-display uppercase tracking-tight text-sm text-surface-dark dark:text-white">{event.player.fullName}</span>
                  )}
                  {event.player2?.fullName && (
                    <span className="text-[10px] uppercase tracking-widest opacity-50">↳ {event.player2.fullName}</span>
                  )}
                  {event.description && (
                    <span className="text-[10px] opacity-50 tracking-wide">{event.description}</span>
                  )}
                </div>
              </div>

              {/* Minute marker */}
              <div className="flex sm:flex-col items-center justify-center shrink-0 sm:w-16 order-first sm:order-none">
                <span className={`w-10 h-10 rounded-full border flex items-center justify-center font-display text-sm bg-white dark:bg-surface-dark2 ${meta.ring} ${meta.color}`}>
                  <Icon size={16} />
                </span>
                <span className="ml-2 sm:ml-0 sm:mt-1 text-[10px] font-bold tracking-widest opacity-40">
                  {event.minute != null ? `${event.minute}'` : ''}
                </span>
              </div>

              {/* Spacer for the empty side on desktop */}
              <div className="hidden sm:block flex-1" />
            </motion.li>
          );
        })}
      </AnimatePresence>
    </ol>
  );
};

export default MatchEventTimeline;
