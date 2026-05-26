import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const StandingsTable = ({ standings = [] }) => {
  const getInitials = (name) => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  const FormPill = ({ result }) => {
    const colors = {
      W: 'bg-green text-white',
      D: 'bg-gold text-white',
      L: 'bg-red text-white',
    };
    return (
      <span className={twMerge('w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold', colors[result] || 'bg-surface-3 opacity-20')}>
        {result}
      </span>
    );
  };

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-surface-3 dark:border-white/5 bg-white dark:bg-surface-dark2">
      <div className="overflow-x-auto scrollbar-hide">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="bg-surface-2 dark:bg-white/5 text-[10px] uppercase font-bold tracking-[0.2em] text-surface-dark/40 dark:text-white/40">
              <th className="px-4 py-4 text-center w-12">Pos</th>
              <th className="px-4 py-4 sticky left-0 bg-surface-2 dark:bg-[#1A1A2E] z-10">Team</th>
              <th className="px-4 py-4 text-center">P</th>
              <th className="px-4 py-4 text-center">W</th>
              <th className="px-4 py-4 text-center">D</th>
              <th className="px-4 py-4 text-center">L</th>
              <th className="px-4 py-4 text-center hidden sm:table-cell">GF</th>
              <th className="px-4 py-4 text-center hidden sm:table-cell">GA</th>
              <th className="px-4 py-4 text-center">GD</th>
              <th className="px-4 py-4 text-center font-display text-sm text-red">Pts</th>
              <th className="px-4 py-4">Form</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-3 dark:divide-white/5">
            {standings.length > 0 ? standings.map((s, index) => (
              <tr key={s.id} className="hover:bg-surface-2 dark:hover:bg-white/5 transition-colors group">
                <td className="px-4 py-4 text-center">
                  <span className={clsx(
                    "font-display text-lg",
                    index === 0 ? "text-gold" : index === 1 ? "text-surface-dark/60 dark:text-white/60" : index === 2 ? "text-rwanda-green/60" : "opacity-30"
                  )}>
                    {index + 1}
                  </span>
                </td>
                <td className="px-4 py-4 sticky left-0 bg-white dark:bg-surface-dark2 z-10 group-hover:bg-surface-2 dark:group-hover:bg-[#1A1A2E] transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-surface-3 dark:bg-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {s.team.logo ? (
                        <img src={s.team.logo} alt={s.team.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[10px] font-bold opacity-30">{getInitials(s.team.name)}</span>
                      )}
                    </div>
                    <span className="font-display uppercase tracking-tight text-sm whitespace-nowrap">{s.team.name}</span>
                  </div>
                </td>
                <td className="px-4 py-4 text-center font-medium opacity-60">{s.played}</td>
                <td className="px-4 py-4 text-center opacity-60">{s.won}</td>
                <td className="px-4 py-4 text-center opacity-60">{s.drawn}</td>
                <td className="px-4 py-4 text-center opacity-60">{s.lost}</td>
                <td className="px-4 py-4 text-center hidden sm:table-cell opacity-40">{s.goalsFor}</td>
                <td className="px-4 py-4 text-center hidden sm:table-cell opacity-40">{s.goalsAgainst}</td>
                <td className="px-4 py-4 text-center font-medium opacity-60">{s.goalsFor - s.goalsAgainst}</td>
                <td className="px-4 py-4 text-center font-display text-lg text-red">{s.points}</td>
                <td className="px-4 py-4">
                  <div className="flex space-x-1">
                    {s.form.split('').map((r, i) => <FormPill key={i} result={r} />)}
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
    </div>
  );
};

export default StandingsTable;
