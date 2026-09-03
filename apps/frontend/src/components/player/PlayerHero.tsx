import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft } from 'lucide-react';
import cn from '../ui/cn';
import clubColor from '../../config/clubColors';
import { rgbTriplet } from '../../utils/color';

/**
 * The top of a player's page.
 *
 * IN THE APP'S OWN LANGUAGE, NOT A BROADCASTER'S. This was briefly a full-bleed
 * band of saturated club colour with the player's name across it in 48px uppercase
 * display type. That is how an NBA club page looks, and it is precisely the
 * treatment this codebase spent a redesign removing — SectionHeading's own comment
 * records that the old headings were "a 48px uppercase display title with a red
 * all-caps eyebrow" and why they went.
 *
 * So it is a surface card like everything else: `rounded-card border-hairline
 * bg-surface`, sentence-case display type at the size the rest of the app uses,
 * ink from the text tokens. The club's colour appears where the app already puts
 * it — a 3px identity bar down the left edge, driven by the same `--club` variable
 * MatchTile, MatchRow and MatchCard use — rather than as a wash behind everything.
 *
 * FACTS ARE DROPPED WHEN ABSENT, never rendered as a dash. Height is the example:
 * the API withholds it for anyone who is not a professional, so on those pages the
 * cell is not there at all rather than reading "Height —".
 */

type Fact = { label: string; value: React.ReactNode };

const PlayerHero = ({
  player,
  backTo,
  backLabel,
  affiliation,
  facts,
}: {
  player: any;
  backTo?: string;
  backLabel?: React.ReactNode;
  affiliation?: React.ReactNode;
  facts: Fact[];
}) => {
  const { t } = useTranslation();
  const team = player.team ?? {};
  const [photoFailed, setPhotoFailed] = useState(false);

  // Resolved the way every other club-coloured surface in the app resolves it, so
  // a club with no colour on file gets a hairline rather than an invented hue.
  const club = clubColor(team);
  const rgb = club ? rgbTriplet(club) : null;

  const initials = String(player.fullName || '?')
    .split(/\s+/)
    .map((w: string) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="space-y-4">
      {backTo && (
        <Link
          to={backTo}
          className="inline-flex min-h-tap items-center gap-1 text-sm text-secondary transition-colors duration-150 ease-standard hover:text-primary"
        >
          <ChevronLeft size={16} aria-hidden="true" />
          {backLabel}
        </Link>
      )}

      <header
        style={club ? ({ '--club': club } as React.CSSProperties) : undefined}
        className={cn(
          'relative overflow-hidden rounded-card border border-hairline bg-surface',
          // The identity bar, same idiom as a live match row.
          'border-l-[3px]',
          club ? 'border-l-[var(--club)]' : 'border-l-hairline'
        )}
      >
        {/* TEXTURE, NOT A COLOUR BAND. A flat white card said everything correctly
            and looked like a form. The club's colour at a tenth of its strength,
            falling away across the card, with its crest behind the name at a
            twentieth — the same treatment the club page's own header wears, so a
            player and their club read as one product. */}
        {rgb && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{ background: `linear-gradient(100deg, rgba(${rgb}, 0.10), rgba(${rgb}, 0.03) 45%, transparent 72%)` }}
          />
        )}
        {team.logo && (
          <img
            src={team.logo}
            alt=""
            aria-hidden="true"
            referrerPolicy="no-referrer"
            className="pointer-events-none absolute -right-6 -top-8 h-44 w-44 object-contain opacity-[0.05]"
          />
        )}

        <div className="relative flex items-center gap-4 p-4">
          {player.photo && !photoFailed ? (
            <div className="flex h-20 w-20 shrink-0 items-end justify-center overflow-hidden rounded-card bg-surface-2 sm:h-24 sm:w-24">
              <img
                src={player.photo}
                alt={player.fullName}
                // A club-supplied photo can vanish without warning; the monogram
                // keeps the row composed instead of a broken-image glyph.
                onError={() => setPhotoFailed(true)}
                className="h-full w-full object-contain object-bottom"
              />
            </div>
          ) : (
            <div
              aria-hidden="true"
              className="flex h-20 w-20 shrink-0 select-none items-center justify-center rounded-card bg-surface-2 font-display text-2xl font-bold text-tertiary sm:h-24 sm:w-24"
            >
              {initials}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <h1 className="font-display text-xl font-extrabold tracking-[-0.02em] text-primary sm:text-2xl">
              {player.fullName}
            </h1>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-secondary">
              {player.position && <span>{player.position}</span>}
              {typeof player.jerseyNumber === 'number' && (
                <span className="text-tertiary">{t('team.jersey_no', { number: player.jerseyNumber })}</span>
              )}
            </p>
            {affiliation}
          </div>
        </div>

        {facts.length > 0 && (
          <dl className="relative grid grid-cols-2 border-t border-hairline sm:grid-cols-3 lg:grid-cols-6">
            {facts.map((f) => (
              <div key={f.label} className="border-b border-r border-hairline px-4 py-2.5 last:border-r-0">
                <dt className="text-xs text-tertiary">{f.label}</dt>
                <dd className="mt-0.5 truncate text-sm font-semibold tabular-nums text-primary">{f.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </header>
    </div>
  );
};

export default PlayerHero;
