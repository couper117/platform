import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, MapPin, Calendar, Landmark, ExternalLink, Ticket, ShoppingBag, Facebook, Instagram, Youtube } from 'lucide-react';
import cn from '../ui/cn';
import Badge from '../ui/Badge';
import ClubCrest from '../ui/ClubCrest';
import clubColor from '../../config/clubColors';

/**
 * The top of a club's page: who they are, how the season is going, where to find them.
 *
 * IN THE APP'S OWN LANGUAGE. This was briefly a full-bleed band of saturated club
 * colour with the club's name across it in 48px uppercase display type — an NBA
 * club page, and the exact treatment this codebase spent a redesign removing. It is
 * a surface card like every other block in the app now: hairline borders, the
 * display face at the size the rest of the page uses, ink from the text tokens. The
 * club's colour appears where the app already puts it, as the 3px identity bar down
 * the left edge that MatchTile, MatchRow and MatchCard all drive off `--club`.
 *
 * EVERY FIGURE IS DERIVED FROM MATCHES ACTUALLY PLAYED. Won/drawn/lost from the
 * stored scorelines, scored and conceded per game from the same. A club that has
 * not played gets its identity and no figures at all, rather than a row of zeroes
 * implying a terrible season.
 */

type Social = { key: string; href: string; label: string; icon: any };

/**
 * "1st in the league", not "1 in the league".
 *
 * English is the only one of the three languages that suffixes an ordinal, and
 * Intl.PluralRules knows the rule — including that 11th, 12th and 13th break the
 * pattern 1st, 2nd and 3rd set.
 */
const EN_SUFFIX: Record<string, string> = { one: 'st', two: 'nd', few: 'rd', other: 'th' };
const ordinal = (n: number, lang: string) => {
  if (!String(lang || '').startsWith('en')) return String(n);
  return `${n}${EN_SUFFIX[new Intl.PluralRules('en', { type: 'ordinal' }).select(n)] ?? 'th'}`;
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
  const club = clubColor(team);

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
  const locationLine = [team.city, team.district].filter(Boolean).join(', ');

  const figures = [
    played > 0 && { label: t('team.stat_played'), value: played },
    played > 0 && { label: t('team.stat_record'), value: record },
    scoredPerGame != null && { label: t('team.stat_for'), value: scoredPerGame.toFixed(1) },
    concededPerGame != null && { label: t('team.stat_against'), value: concededPerGame.toFixed(1) },
  ].filter(Boolean) as Array<{ label: string; value: React.ReactNode }>;

  return (
    <div className="space-y-4">
      <Link
        to="/teams"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-secondary transition-colors duration-150 ease-standard hover:text-brand-text"
      >
        <ChevronLeft size={14} aria-hidden="true" /> {t('team.back_to_teams')}
      </Link>

      <header
        style={club ? ({ '--club': club } as React.CSSProperties) : undefined}
        className={cn(
          'overflow-hidden rounded-card border border-hairline bg-surface',
          'border-l-[3px]',
          club ? 'border-l-[var(--club)]' : 'border-l-hairline'
        )}
      >
        <div className="flex flex-wrap items-start gap-4 p-4">
          <ClubCrest team={team} size="lg" className="h-14 w-14 shrink-0 text-base" />

          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <h1 className="font-display text-xl font-extrabold tracking-[-0.02em] text-primary sm:text-2xl">
                {team.name}
              </h1>
              {team.sport?.name && <Badge>{team.sport.name}</Badge>}
            </div>

            {/* The season in one line, then the club's particulars — the meta row
                this page already had, with the record folded into it rather than
                given a colour band of its own. */}
            <p className="text-sm text-secondary">
              {[
                played > 0 ? record : null,
                standing ? t('team.position_in', { position: ordinal(standing.position, i18n.language), league: standing.league }) : null,
              ].filter(Boolean).join('  ·  ')}
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-secondary">
              {locationLine && (
                <span className="flex items-center gap-1.5">
                  <MapPin size={14} className="text-tertiary" aria-hidden="true" />
                  {locationLine}
                </span>
              )}
              {team.foundedYear && (
                <span className="flex items-center gap-1.5">
                  <Calendar size={14} className="text-tertiary" aria-hidden="true" />
                  {t('team.founded_year', { year: team.foundedYear })}
                </span>
              )}
              {team.homeVenue && (
                <span className="flex items-center gap-1.5">
                  <Landmark size={14} className="text-tertiary" aria-hidden="true" />
                  {team.homeVenue}
                </span>
              )}
            </div>
          </div>

          {/* Where the club lives on the rest of the internet. Quiet, on the right,
              because it is a way OUT of the page — never louder than the club. */}
          {socials.length > 0 && (
            <div className="flex shrink-0 items-center gap-1">
              {socials.map((sn) => (
                <a
                  key={sn.key}
                  href={sn.href}
                  target="_blank"
                  // noreferrer with noopener: club-supplied URLs, and the referrer
                  // would leak which page sent the visitor.
                  rel="noopener noreferrer"
                  aria-label={sn.label}
                  className="flex h-9 w-9 items-center justify-center rounded-control border border-hairline text-secondary transition-colors duration-150 ease-standard hover:border-brand/40 hover:text-brand-text"
                >
                  <sn.icon size={15} />
                </a>
              ))}
            </div>
          )}
        </div>

        {figures.length > 0 && (
          <dl className="grid grid-cols-2 border-t border-hairline sm:grid-cols-4">
            {figures.map((f) => (
              <div key={f.label} className="border-b border-r border-hairline px-4 py-2.5 last:border-r-0">
                <dt className="text-xs text-tertiary">{f.label}</dt>
                <dd className="mt-0.5 font-display text-lg font-bold tabular-nums text-primary">{f.value}</dd>
              </div>
            ))}
          </dl>
        )}

        {links.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-hairline px-4 py-2.5">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-secondary transition-colors duration-150 ease-standard hover:text-brand-text"
              >
                <l.icon size={14} aria-hidden="true" />
                {l.label}
              </a>
            ))}
          </div>
        )}
      </header>
    </div>
  );
};

export default TeamHero;
