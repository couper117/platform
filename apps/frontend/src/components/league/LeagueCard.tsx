import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';
import { useEnumLabel } from '../../i18n/enums';
import { SPORT_PHOTOS } from '../../config/heroMedia';
import { SPORT_THEMES } from '../../config/sportThemes';
import SportIcon from '../shared/SportIcon';
import StatusPill from '../ui/StatusPill';
import Skeleton from '../ui/Skeleton';
import cn from '../ui/cn';

/**
 * League directory card — /leagues.
 *
 * THE PROBLEM THIS REPLACES
 * Every card used to be the same shape: a grey icon square, the name, "Season
 * 2025/2026", teams/gender, "View Standings" — eight of them stacked, and a
 * football league was indistinguishable from a cycling one until you read the
 * text. A card's job here is to be recognised before it is read.
 *
 * SPORT LEADS, AND A PHOTOGRAPH DOES THAT FASTER THAN TEXT
 * When the sport has a photograph (a real one in /public/hero, or the curated
 * Unsplash backdrop `sportThemes.ts` already uses elsewhere in the product),
 * a compact band up top carries it, with the sport name as an onDark chip —
 * the same translucent-white-on-photo treatment `Button`'s `onDark` variant
 * and the login/register hero pills already use, so it reads as this
 * product's photo-overlay idiom rather than an invented one. No photograph
 * means no band at all — never a grey box standing in for one — and the
 * sport instead leads as a small icon + label at the top of the body, still
 * ahead of the name, same order either way: sport, then name, then meta.
 *
 * STATUS STAYS OFF THE PHOTOGRAPH ON PURPOSE
 * StatusPill's tones (success/danger/neutral) are tuned for legibility on
 * `bg-surface`, not against whatever a photograph's colours happen to be at
 * that corner. Rather than gamble contrast, the pill sits in the body, where
 * every other status pill in the system lives.
 */

const sportPhoto = (slug?: string | null): string | null => {
  if (!slug) return null;
  if (SPORT_PHOTOS.has(slug)) return `/hero/${slug}.jpg`;
  const bg = (SPORT_THEMES as Record<string, { bg?: string }>)[slug]?.bg;
  return bg ? `${bg}&w=800` : null;
};

const LeagueCard = ({ league }: { league: any }) => {
  const { t } = useTranslation();
  const enumLabel = useEnumLabel();
  const slug = league.sport?.slug;
  const img = sportPhoto(slug);
  const sportLabel = enumLabel('sport', league.sport?.name);

  const meta = [
    t('leagues.season', { season: league.season }),
    enumLabel('gender', league.gender),
    t('leagues.team_count', { count: league._count?.teams || 0 }),
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Link
      to={`/leagues/${league.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-card border border-hairline bg-surface transition-colors duration-150 ease-standard hover:border-brand/40 hover:bg-surface-2"
    >
      {img && (
        <div className="relative h-28 shrink-0 overflow-hidden sm:h-32">
          <img
            src={img}
            alt=""
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-standard group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-transparent" />
          <span className="absolute bottom-2 left-2 inline-flex items-center gap-1.5 rounded-pill border border-white/25 bg-white/15 px-2 py-0.5 text-xs font-semibold text-white backdrop-blur-sm">
            <SportIcon slug={slug} size={11} />
            {sportLabel}
          </span>
        </div>
      )}

      <div className="flex flex-1 flex-col gap-2 p-4 sm:p-5">
        <div className={cn('flex items-start gap-2', img ? 'justify-end' : 'justify-between')}>
          {!img && (
            <span className="flex min-w-0 items-center gap-1.5 text-xs font-semibold text-tertiary">
              <SportIcon slug={slug} size={13} />
              <span className="truncate">{sportLabel}</span>
            </span>
          )}
          <StatusPill
            status={league.status}
            label={enumLabel('league_status', league.status)}
            className="shrink-0"
          />
        </div>

        <h3 className="line-clamp-2 font-display text-base font-semibold leading-snug text-primary sm:text-lg">
          {league.name}
        </h3>

        <p className="mt-auto truncate text-xs text-tertiary">{meta}</p>
      </div>

      <div className="flex items-center justify-between border-t border-hairline px-4 py-3 text-xs font-semibold text-secondary transition-colors duration-150 ease-standard group-hover:text-brand-text sm:px-5">
        {t('leagues.view_standings')}
        <ChevronRight size={15} aria-hidden="true" />
      </div>
    </Link>
  );
};

/** Next to the component so it can never drift from the real card's metrics. */
LeagueCard.Skeleton = function LeagueCardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-card border border-hairline bg-surface">
      <Skeleton className="h-28 w-full sm:h-32" />
      <div className="flex flex-1 flex-col gap-2 p-4 sm:p-5">
        <div className="flex justify-end">
          <Skeleton className="h-5 w-16" />
        </div>
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="mt-auto h-3 w-2/3" />
      </div>
      <div className="border-t border-hairline px-4 py-3 sm:px-5">
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
};

export default LeagueCard;
