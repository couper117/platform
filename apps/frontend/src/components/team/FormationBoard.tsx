import React from 'react';
import { Plus, Star } from 'lucide-react';
import { Markings, TONE } from '../match/FormationPitch';
import { buildSlots, rowsFor, slotRoles, roleName } from '../../lib/formation';
import type { Surface } from '../../config/playingSurfaces';
import { cn } from '../ui';

/**
 * The surface, with a tappable spot for every starter.
 *
 * WHY TAP AND NOT DRAG. A drag is the obvious way to copy a console game, and it
 * is the wrong one here: this is used on a phone, by a coach standing up, and a
 * drag on a touch screen fights the page's own scroll, has no keyboard
 * equivalent, and gives a screen reader nothing at all. Tapping a slot and then
 * a player is two deliberate taps that work with one thumb, announce themselves,
 * and cannot be started by accident while scrolling.
 *
 * IT SHARES ITS GEOMETRY WITH THE PUBLIC MATCH PAGE. `buildSlots` and `rowsFor`
 * come from lib/formation, the same functions components/match/FormationPitch
 * draws a finished line-up with — so a coach who puts a striker on the left of
 * the front row sees that player in that spot when the match goes out.
 *
 * ONE SIDE, NOT TWO. The public pitch shows both teams facing each other. A
 * coach picks one, so the board uses the full height for eleven players instead
 * of squeezing them into half of it.
 */

export type SlotState = {
  index: number;
  role: string;
  x: number;
  y: number;
  player: any | null;
};

/** The slots a shape produces, with whoever is standing in them. */
export const buildBoard = (
  surface: Surface,
  formation: string | null | undefined,
  placed: Record<number, any>
): SlotState[] => {
  const rows = rowsFor(surface, formation);
  const points = buildSlots(rows, 'top', false, [
    // The full height, not the top band: only one side is on this board, so the
    // players spread over the whole surface the way a team actually lines up.
    surface.band[0],
    150 - surface.band[0],
  ]);
  const roles = slotRoles(surface, formation);
  return points.map((p, i) => ({ index: i, role: roles[i] || '', x: p.x, y: p.y, player: placed[i] ?? null }));
};

const surname = (name: string) => String(name || '').trim().split(/\s+/).slice(-1)[0] || '';

const FormationBoard = ({
  surface,
  slots,
  captainId,
  activeIndex,
  onPick,
  className,
}: {
  surface: Surface;
  slots: SlotState[];
  captainId: number | null;
  /** The slot currently being filled, ringed so the picker has a visible anchor. */
  activeIndex: number | null;
  onPick: (index: number) => void;
  className?: string;
}) => (
  <div
    className={cn('relative w-full overflow-hidden rounded-card border border-hairline', className)}
    style={{ aspectRatio: '2 / 3', background: TONE[surface.tone].fill }}
  >
    <Markings surface={surface} />

    {slots.map((slot) => {
      const filled = !!slot.player;
      const isCaptain = filled && slot.player.id === captainId;
      const active = slot.index === activeIndex;

      return (
        <button
          key={slot.index}
          type="button"
          onClick={() => onPick(slot.index)}
          style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
          aria-label={
            filled
              ? `${slot.player.fullName}, ${roleName(slot.role)}. Change or remove.`
              : `Empty ${roleName(slot.role)} position. Choose a player.`
          }
          className={cn(
            'absolute -translate-x-1/2 -translate-y-1/2 rounded-control p-1 text-center',
            'transition-transform duration-150 ease-standard hover:scale-105 focus-visible:outline-none',
            'focus-visible:ring-2 focus-visible:ring-white/80'
          )}
        >
          <span
            className={cn(
              'mx-auto flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold sm:h-11 sm:w-11 sm:text-sm',
              'ring-2 transition-colors duration-150 ease-standard',
              filled
                ? 'bg-surface text-primary ring-white/70'
                : 'border-2 border-dashed border-white/70 bg-black/25 text-white/90 ring-transparent',
              active && 'ring-4 ring-brand'
            )}
          >
            {filled
              ? (slot.player.jerseyNumber ?? <Plus size={15} aria-hidden="true" />)
              : <Plus size={16} aria-hidden="true" />}
          </span>

          {/* The name under a token, and the ROLE under an empty one — an empty
              spot has to say what belongs in it, or a coach is guessing where
              their striker goes. */}
          <span className="mt-1 block max-w-[10ch] truncate text-[10px] font-semibold text-white drop-shadow sm:text-[11px]">
            {filled ? surname(slot.player.fullName) : slot.role || '—'}
          </span>

          {isCaptain && (
            <span
              className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand text-brand-on"
              aria-label="Captain"
            >
              <Star size={9} fill="currentColor" aria-hidden="true" />
            </span>
          )}
        </button>
      );
    })}
  </div>
);

export default FormationBoard;
