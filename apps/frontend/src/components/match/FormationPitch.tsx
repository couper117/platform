import React from 'react';
import { useTranslation } from 'react-i18next';
import { surfaceFor, type Marking, type Surface } from '../../config/playingSurfaces';

/**
 * Both line-ups on the surface the sport is actually played on.
 *
 * This was a football pitch — goalkeeper, penalty areas, a "4-3-3" formation
 * string — drawn for every sport on the platform. Of the twenty here it was
 * right for one: a basketball court is not a smaller pitch, volleyball is six in
 * two ranks either side of a net, and a judo bout has nothing to lay out at all.
 *
 * The geometry now comes from config/playingSurfaces.ts, so adding a sport is
 * data rather than another component, and a sport with no surface says so
 * instead of being given a field it does not play on.
 */

/** Colours per surface, so a court is not obliged to be green. */
const TONE: Record<Surface['tone'], { fill: string; line: string }> = {
  grass: { fill: 'repeating-linear-gradient(0deg,#17663a 0 10%,#1a7040 10% 20%)', line: 'rgba(255,255,255,.38)' },
  wood:  { fill: 'repeating-linear-gradient(90deg,#b9793c 0 6%,#c08243 6% 12%)',  line: 'rgba(255,255,255,.55)' },
  clay:  { fill: 'linear-gradient(160deg,#c2563a,#a8452d)',                        line: 'rgba(255,255,255,.6)'  },
  blue:  { fill: 'linear-gradient(160deg,#1b5e93,#14496f)',                        line: 'rgba(255,255,255,.55)' },
  mat:   { fill: 'linear-gradient(160deg,#3f4c8a,#2e3866)',                        line: 'rgba(255,255,255,.5)'  },
};

/**
 * A point on a circle, in screen degrees: 0 is east, 90 is south.
 *
 * Chosen so an arc reads the way it is drawn on a court — an arc at the top of
 * the surface sweeping 0 to 180 bulges downward, toward the middle, which is
 * where a free-throw semicircle or a goal-area arc actually points. Measuring
 * from north instead put every arc a quarter turn out, and the three-point line
 * swept off the side of the court.
 */
const pt = (cx: number, cy: number, r: number, deg: number) => {
  const a = (deg * Math.PI) / 180;
  return `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`;
};

const Markings = ({ surface }: { surface: Surface }) => (
  <svg viewBox="0 0 100 150" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden="true">
    <g fill="none" stroke={TONE[surface.tone].line} strokeWidth="0.4">
      {surface.markings.map((m: Marking, i) => {
        if (m.t === 'rect') {
          return <rect key={i} x={m.x} y={m.y} width={m.w} height={m.h} strokeDasharray={m.dash ? '2 2' : undefined} />;
        }
        if (m.t === 'line') {
          return <line key={i} x1={m.x1} y1={m.y1} x2={m.x2} y2={m.y2} strokeDasharray={m.dash ? '2 2' : undefined} />;
        }
        if (m.t === 'circle') {
          return <circle key={i} cx={m.cx} cy={m.cy} r={m.r}
            fill={m.fill ? TONE[surface.tone].line : 'none'} stroke={m.fill ? 'none' : undefined} />;
        }
        // Arc, drawn the long way only when it genuinely sweeps past a half turn.
        const large = Math.abs(m.to - m.from) > 180 ? 1 : 0;
        return <path key={i} d={`M ${pt(m.cx, m.cy, m.r, m.from)} A ${m.r} ${m.r} 0 ${large} 1 ${pt(m.cx, m.cy, m.r, m.to)}`} />;
      })}
    </g>
  </svg>
);

/**
 * Rank a free-form position so players land in sensible places.
 *
 * Deliberately generic: the same ordering serves a goalkeeper, a point guard and
 * a setter, because every one of these sports lists its roster from the back
 * outwards. Anything unrecognised sits in the middle rather than being dropped.
 */
const roleRank = (pos?: string) => {
  const s = String(pos || '').toLowerCase();
  if (/goal|keeper|\bgk\b|\bgs\b|libero/.test(s)) return 0;
  if (/def|back|\bcb\b|\brb\b|\blb\b|\bwb\b|full|guard|\bpg\b|\bsg\b|\bgd\b/.test(s)) return 1;
  if (/for|strik|attack|wing|\bst\b|\bcf\b|\bfw\b|centre|center|\bc\b|spik/.test(s)) return 3;
  return 2;
};

/** Formation strings only mean something where the sport uses them. */
const parseFormation = (formation: string | undefined, fallback: number[]) => {
  const lines = String(formation || '').split(/[^0-9]+/).map((n) => parseInt(n, 10)).filter((n) => n > 0);
  const sum = lines.reduce((a, b) => a + b, 0);
  if (!lines.length || sum < 3 || sum > 20) return fallback;
  return lines;
};

/** (x%, y%) for each starter, from the goal line inward. */
const buildSlots = (rows: number[], orientation: 'top' | 'bottom', opposed: boolean, band: [number, number]) => {
  // Mirrored for the bottom side, so both teams read as facing each other.
  const near = opposed ? (orientation === 'top' ? band[0] : 150 - band[0]) : band[0];
  const far = opposed ? (orientation === 'top' ? band[1] : 150 - band[1]) : band[1];
  const slots: Array<{ x: number; y: number }> = [];
  rows.forEach((count, r) => {
    const v = rows.length === 1 ? (near + far) / 2 : near + ((far - near) * r) / (rows.length - 1);
    const y = (v / 150) * 100;
    for (let i = 0; i < count; i += 1) slots.push({ x: ((i + 1) * 100) / (count + 1), y });
  });
  return slots;
};

const Token = ({ slot, player, color, label }: any) => (
  <div className="absolute -translate-x-1/2 -translate-y-1/2 text-center" style={{ left: `${slot.x}%`, top: `${slot.y}%` }}>
    <div
      className="mx-auto flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white shadow ring-2 ring-white/60 sm:h-8 sm:w-8 sm:text-[11px]"
      style={{ backgroundColor: color }}
    >
      {player.jerseyNo ?? player.player?.jersey ?? label ?? ''}
    </div>
    <p className="mt-0.5 max-w-[9ch] truncate text-[8px] font-medium text-white/90 sm:text-[9px]">
      {(player.player?.fullName || player.fullName || '').split(' ').slice(-1)[0]}
    </p>
  </div>
);

const TeamShape = ({ starters, formation, color, orientation, surface }: any) => {
  const rows = surface.rows.length > 1 && formation
    ? parseFormation(formation, surface.rows)
    : surface.rows;
  const slots = buildSlots(rows, orientation, surface.opposed, surface.band);
  const ordered = [...starters].sort((a: any, b: any) => roleRank(a.position) - roleRank(b.position));
  return (
    <>
      {slots.map((slot, i) =>
        ordered[i] ? (
          <Token key={ordered[i].id ?? i} slot={slot} player={ordered[i]} color={color}
            label={surface.positions?.[i]} />
        ) : null,
      )}
    </>
  );
};

const HALF = 'flex items-center gap-2 text-[10px] font-display uppercase tracking-widest text-white/90';

const FormationPitch = ({ home, away, sport }: any) => {
  const { t } = useTranslation();
  const surface = surfaceFor(sport);

  // No surface, no drawing. A bout, a race or a board game has no field to place
  // anyone on, and inventing one would tell the reader something untrue.
  if (!surface) return null;

  const homeColor = home.team?.primaryColor || '#E8002D';
  const awayColor = away.team?.primaryColor || '#12386E';
  const tone = TONE[surface.tone];

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-3 flex items-center justify-between px-1">
        <div className={HALF}>
          <span className="h-3 w-3 rounded-full ring-2 ring-white/50" style={{ backgroundColor: homeColor }} />
          <span className="max-w-[40vw] truncate">{home.team?.name}</span>
          {home.formation && <span className="opacity-50">· {home.formation}</span>}
        </div>
        <span className="text-[9px] uppercase tracking-widest text-white/45">{surface.label}</span>
      </div>

      <div className="relative w-full overflow-hidden rounded-2xl border border-white/10 shadow-xl aspect-[68/105]">
        <div className="absolute inset-0" style={{ background: tone.fill }} />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/10" />
        <Markings surface={surface} />

        {home.starters.length > 0 ? (
          <TeamShape starters={home.starters} formation={home.formation} color={homeColor}
            orientation="top" surface={surface} />
        ) : (
          <span className="absolute left-1/2 top-[22%] -translate-x-1/2 text-[10px] uppercase tracking-widest text-white/50">
            {t('match.lineups_unavailable')}
          </span>
        )}
        {surface.opposed && (away.starters.length > 0 ? (
          <TeamShape starters={away.starters} formation={away.formation} color={awayColor}
            orientation="bottom" surface={surface} />
        ) : (
          <span className="absolute bottom-[22%] left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-widest text-white/50">
            {t('match.lineups_unavailable')}
          </span>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between px-1">
        <div className={HALF}>
          <span className="h-3 w-3 rounded-full ring-2 ring-white/50" style={{ backgroundColor: awayColor }} />
          <span className="max-w-[40vw] truncate">{away.team?.name}</span>
          {away.formation && <span className="opacity-50">· {away.formation}</span>}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-[10px] uppercase tracking-widest opacity-50">
        <span>{home.coachName ? `${t('match.coach')}: ${home.coachName}` : ''}</span>
        <span>{away.coachName ? `${t('match.coach')}: ${away.coachName}` : ''}</span>
      </div>
    </div>
  );
};

export default FormationPitch;
