import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ExternalLink, Ticket, ShoppingBag, Facebook, Instagram, Youtube } from 'lucide-react';
import cn from '../ui/cn';
import { readableOn, shade, rgbTriplet } from '../../utils/color';
import { crest } from '../../utils/crest';

/**
 * The top of a club's page: the club's colours, its crest, its record, its season.
 *
 * The same band the player page wears, for the same reason — a club page that opens
 * on a hairline card and a 40px crest looks like a database row about a club rather
 * than the club's own page. Both read their colour from `primaryColor`, pick ink by
 * luminance, and blend the crest instead of fading it.
 *
 * EVERY NUMBER IS DERIVED FROM PLAYED MATCHES. Won/drawn/lost come from the stored
 * scorelines, and the two per-game figures are that club's points (or goals) scored
 * and conceded divided by matches played. Nothing here is entered, and nothing is a
 * placeholder: a club that has not played yet gets the identity and no strip at all,
 * rather than a row of zeroes implying a terrible season.
 */

type Social = { key: string; href: string; label: string; icon: any };

/**
 * "1st in the league", not "1 in the league".
 *
 * English is the only one of the three languages that suffixes an ordinal, and
 * Intl.PluralRules knows the rule — including that 11th, 12th and 13th break the
 * pattern that 1st, 2nd and 3rd set. Kinyarwanda and French take the bare number
 * here, so they get it.
 */
const EN_SUFFIX: Record<string, string> = { one: 'st', two: 'nd', few: 'rd', other: 'th' };
const ordinal = (n: number, lang: string) => {
  if (!String(lang || '').startsWith('en')) return String(n);
  const rule = new Intl.PluralRules('en', { type: 'ordinal' }).select(n);
  return `${n}${EN_SUFFIX[rule] ?? 'th'}`;
};

/** X has no lucide glyph; drawn here rather than shipped as an image. */
const XIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18.9 2H22l-7.2 8.2L23.3 22h-6.6l-5.2-6.8L5.6 22H2.5l7.7-8.8L1 2h6.8l4.7 6.2L18.9 2Zm-1.1 18h1.7L7.3 3.8H5.5L17.8 20Z" />
  </svg>
);

const TeamHero = ({
  team,
  played,
  won,
  drawn,
  lost,
  scoredPerGame,
  concededPerGame,
  standing,
}: {
  team: any;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  scoredPerGame: number | null;
  concededPerGame: number | null;
  standing?: { position: number; league: string } | null;
}) => {
  const { t, i18n } = useTranslation();

  const brand = team.primaryColor || '#14161A';
  const ink = readableOn(brand);
  const strip = shade(brand, -0.28);
  const darkBand = ink === '#ffffff';
  const rule = `rgba(${rgbTriplet(ink)}, 0.15)`;

  // The club's own crest if it has uploaded one, otherwise the generated shield —
  // the same artwork ClubCrest shows everywhere else, so the page is consistent.
  const mark = team.logo || crest(team.name, team.primaryColor, team.secondaryColor || '#F4B400', team.foundedYear);

  const s = (team.socials ?? {}) as Record<string, string>;
  const socials: Social[] = [
    s.facebook && { key: 'facebook', href: s.facebook, label: 'Facebook', icon: Facebook },
    s.instagram && { key: 'instagram', href: s.instagram, label: 'Instagram', icon: Instagram },
    s.x && { key: 'x', href: s.x, label: 'X', icon: XIcon },
    s.youtube && { key: 'youtube', href: s.youtube, label: 'YouTube', icon: Youtube },
  ].filter(Boolean) as Social[];

  const links = [
    team.website && { href: team.website, label: t('team.official_site'), icon: ExternalLink },
    s.tickets && { href: s.tickets, label: t('team.tickets'), icon: Ticket },
    s.store && { href: s.store, label: t('team.store'), icon: ShoppingBag },
  ].filter(Boolean) as Array<{ href: string; label: string; icon: any }>;

  // A draw is meaningless in basketball and routine in football, so it earns a slot
  // only when one has happened.
  const record = drawn > 0 ? `${won}-${drawn}-${lost}` : `${won}-${lost}`;

  const figures = [
    played > 0 && { label: t('team.stat_played'), value: played },
    played > 0 && { label: t('team.stat_record'), value: record },
    scoredPerGame != null && { label: t('team.stat_for'), value: scoredPerGame.toFixed(1) },
    concededPerGame != null && { label: t('team.stat_against'), value: concededPerGame.toFixed(1) },
  ].filter(Boolean) as Array<{ label: string; value: React.ReactNode }>;

  return (
    <header className="relative isolate overflow-hidden" style={{ background: brand, color: ink }}>
      {team.logo && (
        <img
          src={team.logo}
          alt=""
          aria-hidden="true"
          style={darkBand ? { mixBlendMode: 'screen', filter: 'invert(1)' } : { mixBlendMode: 'multiply' }}
          className={cn(
            'pointer-events-none absolute -right-12 top-1/2 h-[170%] max-w-none -translate-y-1/2 object-contain',
            darkBand ? 'opacity-[0.13]' : 'opacity-50'
          )}
        />
      )}

      <div className="relative mx-auto w-full max-w-6xl px-4 lg:px-6">
        <Link
          to="/teams"
          className="inline-flex min-h-tap items-center gap-1 text-sm opacity-80 transition-opacity duration-150 ease-standard hover:opacity-100"
        >
          <ChevronLeft size={16} aria-hidden="true" />
          {t('team.back_to_teams')}
        </Link>

        <div className="flex flex-col gap-4 pb-6 sm:flex-row sm:items-center sm:gap-6">
          {/* On its own light card, for the reason the player photos are: a supplied
              crest usually carries a white background, and dropped straight onto a
              dark band that reads as a sticker rather than a badge. */}
          <div
            className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-card p-2 sm:h-28 sm:w-28 sm:p-3"
            style={{ background: shade(brand, 0.9) }}
          >
            <img src={mark} alt="" aria-hidden="true" className="h-full w-full object-contain" />
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="font-display text-3xl font-extrabold uppercase leading-[0.95] tracking-[-0.02em] sm:text-5xl">
              {team.name}
            </h1>
            <p className="mt-2 text-sm opacity-80">
              {[
                played > 0 ? record : null,
                standing ? t('team.position_in', { position: ordinal(standing.position, i18n.language), league: standing.league }) : null,
                [team.city, team.district].filter(Boolean).join(', ') || null,
              ].filter(Boolean).join('  ·  ')}
            </p>
          </div>
        </div>
      </div>

      {figures.length > 0 && (
        <div className="relative" style={{ background: strip }}>
          <dl className="mx-auto grid max-w-6xl grid-cols-2 sm:grid-cols-4">
            {figures.map((f) => (
              <div key={f.label} className="border-b border-r px-4 py-3 last:border-r-0" style={{ borderColor: rule }}>
                <dt className="text-[11px] uppercase tracking-wide opacity-65">{f.label}</dt>
                <dd className="mt-0.5 font-display text-xl font-bold tabular-nums">{f.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {(links.length > 0 || socials.length > 0) && (
        <div className="relative border-t" style={{ background: strip, borderColor: rule }}>
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-2.5 lg:px-6">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                target="_blank"
                // noreferrer alongside noopener: these are club-supplied URLs and
                // the referrer would leak which page sent the visitor.
                rel="noopener noreferrer"
                className="inline-flex min-h-tap items-center gap-1.5 text-sm opacity-85 transition-opacity duration-150 ease-standard hover:opacity-100"
              >
                <l.icon size={14} aria-hidden="true" />
                {l.label}
              </a>
            ))}
            {socials.length > 0 && (
              <div className="ml-auto flex items-center gap-1">
                {socials.map((sn) => (
                  <a
                    key={sn.key}
                    href={sn.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={sn.label}
                    className="flex h-9 w-9 items-center justify-center rounded-control opacity-85 transition-opacity duration-150 ease-standard hover:opacity-100"
                    style={{ background: `rgba(${rgbTriplet(ink)}, 0.1)` }}
                  >
                    <sn.icon size={16} />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="relative h-1 w-full" style={{ background: team.secondaryColor || rule }} />
    </header>
  );
};

export default TeamHero;
