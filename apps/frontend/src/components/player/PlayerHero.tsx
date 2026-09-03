import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft } from 'lucide-react';
import cn from '../ui/cn';
import { readableOn, shade, rgbTriplet } from '../../utils/color';

/**
 * The top of a player's page, painted in their club's colours.
 *
 * WHY A BAND AND NOT A CARD. A player page opened on a bordered white card with a
 * 64px avatar in it — correct, and indistinguishable from every other record in
 * the app. A squad member belongs to a club before they are a row in a database,
 * and the fastest way to say so is to hand the top of the page over to the club:
 * its colour as the ground, its crest behind the name, the player in front of it.
 *
 * IT THEMES ITSELF FROM THE RECORD. `primaryColor` drives the band, the ink is
 * whichever of black or white is legible on it, and the fact strip is the same
 * colour a quarter of the way to black. Nothing is hard-coded to one club, so a
 * football team with a colour and no crest still gets a proper hero — it simply
 * has no watermark.
 *
 * FACTS ARE DROPPED WHEN ABSENT, never rendered as a dash. Height is a good
 * example: the API redacts it from public responses as personal data, so on the
 * public site that cell is not there at all rather than reading "Height —".
 */

type Fact = { label: string; value: React.ReactNode };

/** Written out so Tailwind's scanner sees every class it has to generate. */
const LG_COLS: Record<number, string> = {
  1: 'lg:grid-cols-1', 2: 'lg:grid-cols-2', 3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-4', 5: 'lg:grid-cols-5', 6: 'lg:grid-cols-6',
};

const PlayerHero = ({
  player,
  backTo,
  backLabel,
  facts,
}: {
  player: any;
  backTo?: string;
  backLabel?: React.ReactNode;
  facts: Fact[];
}) => {
  const { t } = useTranslation();
  const team = player.team ?? {};

  // A club with no colour on file gets the app's near-black rather than an
  // invented hue — the same rule ClubCrest follows, for the same reason.
  const brand = team.primaryColor || '#14161A';
  const ink = readableOn(brand);
  const strip = shade(brand, -0.28);
  // White ink means the band is dark, which changes how the crest has to blend.
  const darkBand = ink === '#ffffff';

  const [photoFailed, setPhotoFailed] = useState(false);

  const initials = String(player.fullName || '?')
    .split(/\s+/)
    .map((w: string) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const line = [team.name, typeof player.jerseyNumber === 'number' ? `#${player.jerseyNumber}` : null, player.position]
    .filter(Boolean)
    .join('  ·  ');

  return (
    <header className="relative isolate overflow-hidden" style={{ background: brand, color: ink }}>
      {/* The crest, big and nearly invisible, doing the job a photographer's
          backdrop does. aria-hidden: it is texture, and the club is named in
          the line above the player's name. */}
      {team.logo && (
        <img
          src={team.logo}
          alt=""
          aria-hidden="true"
          // BLEND, DON'T FADE. These crests are thumbnails with their own white
          // background; faded to 8% opacity that background lightened a rectangle
          // across half the band and read as a rendering fault.
          //
          // Which blend depends on the band. On a LIGHT one, multiply: white is the
          // identity, so the backdrop vanishes and the dark mark tints the colour.
          // On a DARK one multiply would erase the mark instead — so the crest is
          // inverted first (dark-on-white becomes light-on-black) and screened,
          // where black is the identity. Either way only the mark survives.
          style={
            darkBand
              ? { mixBlendMode: 'screen', filter: 'invert(1)' }
              : { mixBlendMode: 'multiply' }
          }
          className={cn(
            'pointer-events-none absolute -right-12 top-1/2 h-[170%] max-w-none -translate-y-1/2 object-contain',
            darkBand ? 'opacity-[0.13]' : 'opacity-50'
          )}
        />
      )}

      <div className="relative mx-auto w-full max-w-5xl px-4 lg:px-6">
        {backTo && (
          <Link
            to={backTo}
            className="inline-flex min-h-tap items-center gap-1 text-sm opacity-80 transition-opacity duration-150 ease-standard hover:opacity-100"
          >
            <ChevronLeft size={16} aria-hidden="true" />
            {backLabel}
          </Link>
        )}

        <div className="flex flex-col gap-4 pb-6 sm:flex-row sm:items-end sm:gap-7">
          {/* The player, on a light card.
              ONE FRAME FOR TWO KINDS OF SOURCE. These headshots arrive both ways:
              most are cut out with a real alpha channel, one is a small JPEG on
              solid white. Dropped straight onto the band, the first group floats
              and the second wears a white box — side by side, the box reads as a
              bug. A light card behind every photo makes the two identical: the
              cut-outs gain a studio backdrop and the white photo melts into it.
              `contain` rather than `cover` because a roster headshot is already
              tightly cropped and covering it would cut the top of the head off. */}
          {player.photo && !photoFailed ? (
            <div
              className="flex h-32 w-32 shrink-0 items-end justify-center self-start overflow-hidden rounded-card sm:h-44 sm:w-44 sm:self-end"
              style={{ background: shade(brand, 0.9) }}
            >
              <img
                src={player.photo}
                alt={player.fullName}
                // A hotlinked photo can vanish without warning. Falling back to the
                // monogram keeps the hero composed instead of leaving a broken-image
                // glyph where the player should be.
                onError={() => setPhotoFailed(true)}
                className="h-full w-full object-contain object-bottom"
              />
            </div>
          ) : (
            /* No headshot on file. A monogram in the club's own colours, at the
               size the photograph would have been, so the composition holds —
               utils/crest's generated avatar picks its hue from the NAME, which
               put a magenta block in the middle of a green band. */
            <div
              aria-hidden="true"
              className="flex h-32 w-32 shrink-0 select-none items-center justify-center self-start rounded-card font-display text-4xl font-extrabold tracking-tight sm:h-44 sm:w-44 sm:self-end sm:text-6xl"
              style={{ background: shade(brand, -0.22), color: team.secondaryColor || ink }}
            >
              {initials}
            </div>
          )}

          <div className="min-w-0 flex-1 pb-1">
            {line && <p className="text-sm font-medium opacity-80">{line}</p>}
            <h1 className="mt-1 font-display text-3xl font-extrabold uppercase leading-[0.95] tracking-[-0.02em] sm:text-5xl">
              {player.fullName}
            </h1>
            {team.city && <p className="mt-2 text-sm opacity-70">{team.city}</p>}
          </div>
        </div>
      </div>

      {/* The fact strip. Its own darker band so it reads as a plinth under the
          name rather than more of the same colour. */}
      {facts.length > 0 && (
        <div className="relative" style={{ background: strip }}>
          <dl
            className={cn(
              'mx-auto grid max-w-5xl grid-cols-2 sm:grid-cols-3',
              // Fit the columns to what there is: six cells minus a redacted
              // height is five, and a fixed six-wide grid left an empty sixth.
              LG_COLS[Math.min(facts.length, 6)] ?? 'lg:grid-cols-6'
            )}
            style={{ borderColor: `rgba(${rgbTriplet(ink)}, 0.15)` }}
          >
            {facts.map((f) => (
              <div
                key={f.label}
                className="border-b border-r px-4 py-3 last:border-r-0"
                style={{ borderColor: `rgba(${rgbTriplet(ink)}, 0.15)` }}
              >
                <dt className="text-[11px] uppercase tracking-wide opacity-65">{f.label}</dt>
                <dd className="mt-0.5 truncate text-sm font-semibold tabular-nums">{f.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {/* The club's second colour as a hairline along the bottom — the detail a
          kit has and a rectangle of flat colour does not. */}
      {/* `relative` so it stacks above the absolutely-positioned crest, which was
          otherwise showing through the last few pixels of the band. */}
      <div className="relative h-1 w-full" style={{ background: team.secondaryColor || `rgba(${rgbTriplet(ink)}, 0.25)` }} />
      <span className="sr-only">{t('player.profile')}</span>
    </header>
  );
};

export default PlayerHero;
