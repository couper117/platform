import React from 'react';
import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';
import EmptyState from '../ui/EmptyState';
import { Trophy } from 'lucide-react';

const initials = (name = '') => name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();

/**
 * Standings table for Amashuri Games (AkcStanding model: gf/ga, team→school, no form).
 * Blue-accented sibling of the RwaSport StandingsTable.
 */
const AmashuriStandingsTable = ({ standings = [] }) => {
  const { t } = useTranslation();
  if (!standings.length) {
    return <EmptyState icon={Trophy} title={t('amashuri.standings.empty')} hint={t('amashuri.standings.empty_hint')} />;
  }

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-surface-3 dark:border-white/5 bg-white dark:bg-surface-dark2">
      <div className="overflow-x-auto scrollbar-hide">
        <table className="w-full text-left border-collapse min-w-[560px]">
          <thead>
            <tr className="bg-surface-2 dark:bg-white/5 text-[10px] uppercase font-bold tracking-[0.2em] text-surface-dark/40 dark:text-white/40">
              <th className="px-4 py-4 text-center w-12">Pos</th>
              <th className="px-4 py-4 sticky left-0 bg-surface-2 dark:bg-[#1A1A2E] z-10">School</th>
              <th className="px-4 py-4 text-center">P</th>
              <th className="px-4 py-4 text-center">W</th>
              <th className="px-4 py-4 text-center">D</th>
              <th className="px-4 py-4 text-center">L</th>
              <th className="px-4 py-4 text-center hidden sm:table-cell">GF</th>
              <th className="px-4 py-4 text-center hidden sm:table-cell">GA</th>
              <th className="px-4 py-4 text-center">GD</th>
              <th className="px-4 py-4 text-center font-display text-sm text-rwanda-blue">Pts</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-3 dark:divide-white/5">
            {standings.map((s, index) => {
              const name = s.team?.school?.name || `Team ${s.teamId}`;
              return (