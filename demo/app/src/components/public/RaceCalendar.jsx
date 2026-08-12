import React, { useState } from 'react';
import { format } from 'date-fns';
import { ChevronDown, Flag, Timer, MapPin } from 'lucide-react';
import ClubCrest from '../ui/ClubCrest';
import Avatar from '../ui/Avatar';

/**
 * Race calendar for a RACING sport (cycling, athletics).
 *
 * A race is NOT a fixture: there is no home/away and no score. A completed race
 * has a RANKED FINISH — riders/athletes ordered by time or mark. So each row is
 * a stage/event that expands to its result table, and the winner (not a
 * scoreline) is what surfaces in the collapsed row.
 */

const fmtMark = (r, race) =>
  race.discipline && race.unit === 's' && !String(r.mark).includes(':') ? `${r.mark}s` : (r.time || r.mark || '');

const StatusPill = ({ status, accent }) => {
  const map = {
    COMPLETED: 'bg-white/10 text-tertiary border-white/10',
    LIVE: 'bg-red/10 text-red border-red/20',
    SCHEDULED: 'bg-gold/10 text-gold border-gold/20',
  };
  return (
    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest ${map[status] || map.SCHEDULED}`}>
      {status === 'COMPLETED' ? 'Result' : status === 'LIVE' ? 'Live' : 'Scheduled'}
    </span>
  );
};

const ResultTable = ({ race, accent }) => (
  <div className="border-t border-surface-3 dark:border-white/10">
    <div className="overflow-x-auto scrollbar-hide">
      <table className="w-full min-w-[420px] text-left">
        <thead>
          <tr className="text-[9px] font-bold uppercase tracking-widest opacity-40">
            <th className="py-2 pl-4 pr-2 w-8">#</th>
            <th className="py-2 px-2">Athlete</th>
            <th className="py-2 px-2">Club</th>
            <th className="py-2 px-2 text-right">{race.unit === 'm' ? 'Mark' : 'Time'}</th>
            <th className="py-2 pl-2 pr-4 text-right">Pts</th>
          </tr>
        </thead>
        <tbody>
          {race.results.map((r) => (
            <tr key={r.position} className="border-t border-surface-3/60 dark:border-white/5">
              <td className="py-2.5 pl-4 pr-2">
                <span className={`inline-flex h-6 w-6 items-center justify-center rounded-md text-xs font-bold ${r.position === 1 ? 'text-white' : 'bg-surface-2 dark:bg-white/5'}`} style={r.position === 1 ? { background: accent } : undefined}>
                  {r.position}
                </span>
              </td>
              <td className="py-2.5 px-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Avatar src={r.athlete.photo} name={r.athlete.fullName} size="sm" />
                  <span className="truncate text-sm font-semibold">{r.athlete.fullName}</span>
                </div>
              </td>
              <td className="py-2.5 px-2">
                <div className="flex items-center gap-2 min-w-0">
                  <ClubCrest team={r.club} size="sm" />
                  <span className="truncate text-xs opacity-60">{r.club.name}</span>
                </div>
              </td>
              <td className="py-2.5 px-2 text-right text-sm font-semibold tabular-nums">{fmtMark(r, race)}{r.gap && r.gap !== '—' ? <span className="ml-1 text-[10px] font-normal opacity-40">{r.gap}</span> : null}</td>
              <td className="py-2.5 pl-2 pr-4 text-right text-sm tabular-nums opacity-70">{r.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const RaceCalendar = ({ races = [], accent = '#0B6E3F' }) => {
  const [open, setOpen] = useState(() => (races.find((r) => r.status === 'COMPLETED')?.id ?? null));
  if (!races.length) return null;

  return (
    <div className="space-y-3">
      {races.map((race) => {
        const done = race.status === 'COMPLETED';
        const expanded = open === race.id;
        const winner = race.results?.[0];
        return (
          <div key={race.id} className="overflow-hidden rounded-2xl border border-surface-3 dark:border-white/10 bg-white dark:bg-surface-dark2">
            <button
              type="button"
              onClick={() => done && setOpen(expanded ? null : race.id)}
              className={`flex w-full items-center gap-3 px-4 py-3 text-left ${done ? 'hover:bg-surface-2 dark:hover:bg-white/5' : 'cursor-default'}`}
            >
              <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl bg-surface-2 dark:bg-white/5">
                <span className="text-sm font-display leading-none">{format(new Date(race.date), 'd')}</span>
                <span className="text-[9px] uppercase tracking-wider opacity-50">{format(new Date(race.date), 'MMM')}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold uppercase tracking-tight">{race.name}</p>
                <p className="mt-0.5 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest opacity-40">
                  <span className="inline-flex items-center gap-1"><Flag size={10} /> {race.discipline}</span>
                  {race.distanceKm ? <span className="inline-flex items-center gap-1"><MapPin size={10} /> {race.distanceKm} km</span> : null}
                  {!done && <span className="inline-flex items-center gap-1"><Timer size={10} /> {format(new Date(race.date), 'HH:mm')}</span>}
                </p>
              </div>
              {done && winner ? (
                <div className="hidden min-w-0 items-center gap-2 sm:flex">
                  <span className="text-[9px] font-bold uppercase tracking-widest opacity-40">Winner</span>
                  <Avatar src={winner.athlete.photo} name={winner.athlete.fullName} size="sm" />
                  <span className="max-w-[120px] truncate text-xs font-semibold">{winner.athlete.fullName}</span>
                </div>
              ) : null}
              <StatusPill status={race.status} accent={accent} />
              {done && <ChevronDown size={16} className={`shrink-0 opacity-40 transition-transform ${expanded ? 'rotate-180' : ''}`} />}
            </button>
            {expanded && done && <ResultTable race={race} accent={accent} />}
          </div>
        );
      })}
    </div>
  );
};

export default RaceCalendar;
