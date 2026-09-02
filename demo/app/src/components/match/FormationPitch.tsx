import React from 'react';
import { useTranslation } from 'react-i18next';

// A LiveScore/FotMob-style formation pitch. Renders both teams on a single
// vertical field: the home side occupies the top half (attacking down toward
// the centre line), the away side is mirrored on the bottom. Players are placed
// from the team sheet's formation string (e.g. "4-3-3"); positions are inferred
// from each player's roster position so they land in sensible slots even when
// the lineup is partial or the formation is unusual.

// Classify a free-form position label into a role rank so we can fill the pitch
// goalkeeper → defenders → midfielders → forwards. Unknowns sit in midfield.
const roleRank = (pos) => {
  const s = String(pos || '').toLowerCase();
  if (/goal|keeper|\bgk\b/.test(s)) return 0;
  if (/def|back|\bcb\b|\brb\b|\blb\b|\bwb\b|full/.test(s)) return 1;
  if (/for|strik|attack|wing|\bst\b|\bcf\b|\bfw\b/.test(s)) return 3;
  if (/mid|\bcm\b|\bdm\b|\bam\b/.test(s)) return 2;
  return 2;
};

// Turn a formation string into its outfield lines (GK excluded). Falls back to
// 4-4-2 when the string is missing or doesn't describe a valid 10-outfield shape.
const parseFormation = (formation) => {
  const lines = String(formation || '')
    .split(/[^0-9]+/)
    .map((n) => parseInt(n, 10))
    .filter((n) => n > 0);
  const sum = lines.reduce((a, b) => a + b, 0);
  if (!lines.length || sum < 6 || sum > 10) return [4, 4, 2];
  return lines;
};

// Build (x%, y%) slots for one team. `top` teams run from their goal line (near
// the top edge) down toward the halfway line; `bottom` teams are mirrored.
const buildSlots = (lines, orientation) => {
  const rows = lines.length + 1; // + goalkeeper
  const near = orientation === 'top' ? 7 : 93;
  const far = orientation === 'top' ? 43 : 57;
  const slots = [];
  for (let k = 0; k < rows; k += 1) {
    const y = rows > 1 ? near + (k / (rows - 1)) * (far - near) : near;
    if (k === 0) {
      slots.push({ x: 50, y });
      continue;
    }
    const n = lines[k - 1];
    for (let i = 0; i < n; i += 1) {
      // Mirror the away side left-to-right so the two shapes face off cleanly.
      const raw = ((i + 1) / (n + 1)) * 100;
      slots.push({ x: orientation === 'top' ? raw : 100 - raw, y });
    }
  }
  return slots;
};

const PlayerToken = ({ slot, player, color }) => {
  const name = player?.player?.fullName || 'Player';
  const surname = name.split(' ').slice(-1)[0];
  return (
    <div
      className="absolute flex flex-col items-center gap-0.5 -translate-x-1/2 -translate-y-1/2 w-16"
      style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
    >
      <div className="relative">
        <div
          className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-[11px] sm:text-sm font-display tabular-nums text-white shadow-lg ring-2 ring-white/70"
          style={{ backgroundColor: color }}
        >
          {player?.jerseyNo ?? '—'}
        </div>
        {player?.isCaptain && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gold text-white text-[8px] font-bold flex items-center justify-center ring-1 ring-white">
            C
          </span>
        )}
      </div>
      <span className="max-w-full truncate text-[8px] sm:text-[10px] font-bold uppercase tracking-tight text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
        {surname}
      </span>
    </div>
  );
};

// One team's players placed onto the shared pitch.
const TeamShape = ({ starters, formation, color, orientation }) => {
  const lines = parseFormation(formation);
  const slots = buildSlots(lines, orientation);
  const ordered = [...starters].sort((a, b) => roleRank(a.position) - roleRank(b.position));
  return (
    <>
      {slots.map((slot, i) =>
        ordered[i] ? (
          <PlayerToken key={ordered[i].id ?? i} slot={slot} player={ordered[i]} color={color} />
        ) : null,
      )}
    </>
  );
};

// SVG line markings for a full portrait pitch (viewBox 100 x 150).
const PitchMarkings = () => (
  <svg
    viewBox="0 0 100 150"
    preserveAspectRatio="none"
    className="absolute inset-0 w-full h-full"
    aria-hidden="true"
  >
    <g fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="0.4">
      <rect x="3" y="3" width="94" height="144" />
      <line x1="3" y1="75" x2="97" y2="75" />
      <circle cx="50" cy="75" r="11" />
      <circle cx="50" cy="75" r="0.8" fill="rgba(255,255,255,0.5)" stroke="none" />
      {/* top penalty + goal areas */}
      <rect x="24" y="3" width="52" height="20" />
      <rect x="38" y="3" width="24" height="9" />
      {/* bottom penalty + goal areas */}
      <rect x="24" y="127" width="52" height="20" />
      <rect x="38" y="138" width="24" height="9" />
    </g>
  </svg>
);

const HALF = 'flex items-center gap-2 text-[10px] font-display uppercase tracking-widest text-white/90';

const FormationPitch = ({ home, away }) => {
  const { t } = useTranslation();
  const homeColor = home.team?.primaryColor || '#E8002D';
  const awayColor = away.team?.primaryColor || '#12386E';

  return (
    <div className="max-w-lg mx-auto">
      {/* Team headers with their formation shapes */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className={HALF}>
          <span className="w-3 h-3 rounded-full ring-2 ring-white/50" style={{ backgroundColor: homeColor }} />
          <span className="truncate max-w-[40vw]">{home.team?.name}</span>
          {home.formation && <span className="opacity-50">· {home.formation}</span>}
        </div>
      </div>

      <div className="relative w-full aspect-[68/105] rounded-2xl overflow-hidden shadow-xl border border-white/10">
        {/* Mown-stripe turf */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'repeating-linear-gradient(0deg, #17663a 0 10%, #1a7040 10% 20%)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/10" />
        <PitchMarkings />

        {home.starters.length > 0 ? (
          <TeamShape starters={home.starters} formation={home.formation} color={homeColor} orientation="top" />
        ) : (
          <span className="absolute top-[22%] left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-widest text-white/50">
            {t('match.lineups_unavailable')}
          </span>
        )}
        {away.starters.length > 0 ? (
          <TeamShape starters={away.starters} formation={away.formation} color={awayColor} orientation="bottom" />
        ) : (
          <span className="absolute bottom-[22%] left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-widest text-white/50">
            {t('match.lineups_unavailable')}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between mt-3 px-1">
        <div className={HALF}>
          <span className="w-3 h-3 rounded-full ring-2 ring-white/50" style={{ backgroundColor: awayColor }} />
          <span className="truncate max-w-[40vw]">{away.team?.name}</span>
          {away.formation && <span className="opacity-50">· {away.formation}</span>}
        </div>
      </div>

      {/* Coaches */}
      <div className="flex items-center justify-between mt-4 text-[10px] uppercase tracking-widest opacity-50">
        <span>{home.coachName ? `${t('match.coach')}: ${home.coachName}` : ''}</span>
        <span>{away.coachName ? `${t('match.coach')}: ${away.coachName}` : ''}</span>
      </div>
    </div>
  );
};

export default FormationPitch;
