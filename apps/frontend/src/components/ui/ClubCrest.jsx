import React from 'react';
import cn from './cn';
import clubColor from '../../config/clubColors';
import responsiveImage from '../../utils/responsiveImage';
import { crest } from '../../utils/crest';

/**
 * A club, school or team.
 *
 * SQUARED, NOT ROUND — the counterpart to Avatar. Round means a person, squared
 * means an organisation, so a mixed list (scorers beside their clubs) is legible
 * before a single word is read.
 *
 * COLOUR IS OPTIONAL AND ABSENCE IS A VALID STATE.
 * Pass `color` to override; otherwise it resolves from the team via clubColor(),
 * which returns `team.primaryColor` when the API eventually provides it, then the
 * stopgap map, then null. On null the crest keeps a plain hairline border — never
 * an invented hue. Rwandan fans know these clubs; an arbitrary colour on a
 * familiar crest reads as a bug, while a neutral border reads as deliberate.
 *
 * Sets `--club` on the element, so a parent row can drive its 3px identity bar
 * off the same variable without resolving the colour twice.
 */

const SIZES = {
  sm: 'h-6 w-6 text-[9px]',
  md: 'h-8 w-8 text-xs',
  lg: 'h-10 w-10 text-sm',
};

const PX = { sm: 24, md: 32, lg: 40 };

const shortName = (team = {}) => {
  const raw = team.shortName || team.name || '';
  if (team.shortName) return team.shortName.slice(0, 3).toUpperCase();
  return (
    raw
      .trim()
      .split(/\s+/)
      .map((w) => w[0])
      .slice(0, 3)
      .join('')
      .toUpperCase() || '?'
  );
};

const ClubCrest = ({ team, color, size = 'md', className, ...props }) => {
  const px = PX[size] ?? 32;
  const resolved = color ?? clubColor(team);
  // Real uploaded logo wins; otherwise a generated crest in the club's colour so
  // a squad list is legible before anyone uploads artwork (see utils/crest).
  const logo = team?.logo || (team?.name ? crest(team.name, team.primaryColor || resolved, team.secondaryColor || '#F4B400', team.foundedYear) : null);

  return (
    <span
      // `--club` falls back to the hairline in tokens.css when there is no colour.
      style={resolved ? { '--club': resolved } : undefined}
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-control',
        'border bg-surface-2 font-semibold text-secondary',
        resolved ? 'border-[var(--club)]' : 'border-hairline',
        SIZES[size] ?? SIZES.md,
        className
      )}
      {...props}
    >
      {logo ? (
        <img
          {...responsiveImage(logo, { widths: [px, px * 2], sizes: `${px}px` })}
          alt=""
          width={px}
          height={px}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-contain"
        />
      ) : (
        // Decorative — the club name sits beside this in every real usage.
        <span aria-hidden="true">{shortName(team)}</span>
      )}
    </span>
  );
};

export default ClubCrest;
