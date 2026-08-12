import React from 'react';
import ClubCrest from '../ui/ClubCrest';
import Avatar from '../ui/Avatar';

/**
 * Series-level standing for a RACING sport — the counterpart to a league table.
 *
 * Deliberately generic: cycling shows a General Classification (riders ranked by
 * cumulative time), athletics shows a medal table (clubs by gold/silver/bronze).
 * One shape drives both: `{ identityLabel, valueColumns, rows[{rank,name,image,sub,values}] }`.
 * `identityLabel === 'Club'` ⇒ squared crest; anything else ⇒ round athlete avatar.
 */
const ClassificationTable = ({ classification, accent = '#0B6E3F' }) => {
  if (!classification?.rows?.length) return null;
  const { identityLabel, valueColumns, rows } = classification;
  const isClub = identityLabel === 'Club';

  return (
    <div className="overflow-hidden rounded-2xl border border-surface-3 dark:border-white/10 bg-white dark:bg-surface-dark2">
      <div className="overflow-x-auto scrollbar-hide">
        <table className="w-full min-w-[420px] text-left">
          <thead>
            <tr className="text-[9px] font-bold uppercase tracking-widest opacity-40">
              <th className="py-3 pl-4 pr-2 w-8">#</th>
              <th className="py-3 px-2">{identityLabel}</th>
              {valueColumns.map((c) => (
                <th key={c} className="py-3 px-2 text-right last:pr-4">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.rank} className="border-t border-surface-3/60 dark:border-white/5">
                <td className="py-2.5 pl-4 pr-2">
                  <span className={`inline-flex h-6 w-6 items-center justify-center rounded-md text-xs font-bold ${r.rank === 1 ? 'text-white' : 'bg-surface-2 dark:bg-white/5'}`} style={r.rank === 1 ? { background: accent } : undefined}>
                    {r.rank}
                  </span>
                </td>
                <td className="py-2.5 px-2">
                  <div className="flex min-w-0 items-center gap-2.5">
                    {isClub
                      ? <ClubCrest team={{ name: r.name, logo: r.image }} size="sm" />
                      : <Avatar src={r.image} name={r.name} size="sm" />}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{r.name}</p>
                      {r.sub && <p className="truncate text-[10px] uppercase tracking-widest opacity-40">{r.sub}</p>}
                    </div>
                  </div>
                </td>
                {r.values.map((v, i) => (
                  <td key={i} className={`py-2.5 px-2 text-right text-sm tabular-nums last:pr-4 ${i === r.values.length - 1 ? 'font-bold' : 'opacity-70'}`}>{v}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ClassificationTable;
