import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const StandingsTable = ({ standings = [] }) => {
  const getInitials = (name = '') => (name || '?').split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();

  const FormPill = ({ result }) => {
    const colors = { W: 'bg-green text-white', D: 'bg-gold text-white', L: 'bg-red text-white' };
    return (
      <span className={twMerge('w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold', colors[result] || 'bg-surface-3 opacity-20')}>
        {result}
      </span>
    );
  };

  // Fixed layout + narrow numeric columns so the table always fits the screen —
  // long team names ellipsize instead of forcing a horizontal scroll. Progressive
  // columns: mobile shows Pos/Team/P/GD/Pts; sm adds W-D-L; md adds GF-GA; lg adds Form.
  const numW = 'px-1 sm:px-3 py-3 sm:py-4 text-center w-8 sm:w-12';

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-surface-3 dark:border-white/5 bg-white dark:bg-surface-dark2">
      <table className="w-full table-fixed border-collapse text-left">
        <thead>
          <tr className="bg-surface-2 dark:bg-white/5 text-[9px] sm:text-[10px] uppercase font-bold tracking-[0.1em] sm:tracking-[0.2em] text-surface-dark/40 dark:text-white/40">
            <th className="px-1 sm:px-4 py-3 sm:py-4 text-center w-9 sm:w-14">Pos</th>
            <th className="px-2 sm:px-4 py-3 sm:py-4">Team</th>
            <th className={numW}>P</th>
            <th className={`${numW} hidden sm:table-cell`}>W</th>
            <th className={`${numW} hidden sm:table-cell`}>D</th>
            <th className={`${numW} hidden sm:table-cell`}>L</th>
            <th className={`${numW} hidden md:table-cell`}>GF</th>
            <th className={`${numW} hidden md:table-cell`}>GA</th>
            <th className={numW}>GD</th>
            <th className={`${numW} font-display text-xs sm:text-sm text-red`}>Pts</th>
            <th className="px-4 py-4 hidden lg:table-cell w-36">Form</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-3 dark:divide-white/5">
          {standings.length > 0 ? standings.map((s, index) => (
            <tr key={s.id ?? index} className="hover:bg-surface-2 dark:hover:bg-white/5 transition-colors">
              <td className="px-1 sm:px-4 py-3 sm:py-4 text-center">
                <span className={clsx('font-display text-base sm:text-lg', index === 0 ? 'text-gold' : index === 1 ? 'text-surface-dark/60 dark:text-white/60' : index === 2 ? 'text-rwanda-green/60' : 'opacity-30')}>
                  {index + 1}
                </span>
              </td>
              <td className="px-2 sm:px-4 py-3 sm:py-4">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-surface-3 dark:bg-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {s.team?.logo ? (
                      <img src={s.team.logo} alt={s.team?.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[10px] font-bold opacity-30">{getInitials(s.team?.name)}</span>
                    )}
                  </div>
                  <span className="font-display uppercase tracking-tight text-xs sm:text-sm truncate">{s.team?.name || 'Unknown'}</span>
                </div>
              </td>
              <td className={`${numW} font-medium opacity-60`}>{s.played}</td>
              <td className={`${numW} hidden sm:table-cell opacity-60`}>{s.won}</td>
              <td className={`${numW} hidden sm:table-cell opacity-60`}>{s.drawn}</td>
              <td className={`${numW} hidden sm:table-cell opacity-60`}>{s.lost}</td>
              <td className={`${numW} hidden md:table-cell opacity-40`}>{s.goalsFor}</td>
              <td className={`${numW} hidden md:table-cell opacity-40`}>{s.goalsAgainst}</td>
              <td className={`${numW} font-medium opacity-60`}>{s.goalsFor - s.goalsAgainst}</td>
              <td className={`${numW} font-display text-base sm:text-lg text-red`}>{s.points}</td>
              <td className="px-4 py-4 hidden lg:table-cell">
                <div className="flex space-x-1">
                  {(s.form || '').split('').map((r, i) => <FormPill key={i} result={r} />)}
                </div>
              </td>
            </tr>
          )) : (
            <tr>
              <td colSpan="11" className="px-4 py-20 text-center opacity-30 uppercase tracking-widest font-display text-xl">
                No standings data available
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default StandingsTable;
