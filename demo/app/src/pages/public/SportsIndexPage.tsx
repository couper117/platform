import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import { getSports } from '../../api/endpoints/sports';
import { SPORT_THEMES } from '../../config/sportThemes';
import { SPORT_PHOTOS } from '../../config/heroMedia';
import { cover } from '../../utils/crest';
import Seo from '../../components/shared/Seo';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import Skeleton from '../../components/ui/Skeleton';
import PageAd from '../../components/shared/PageAd';

/**
 * Every sport on the platform. Route `/sports`.
 *
 * The homepage's "More sports" tile used to link to `/leagues` — a different thing
 * entirely: a league is a competition within a sport, so the tile promised the rest
 * of the catalogue and delivered a list of Premier League seasons. There was no
 * page listing sports at all; the homepage rail WAS the catalogue, and it only
 * showed what fitted on one row.
 */

const SportCard = ({ sport, t }) => {
  const isRacing = sport.type === 'RACING';
  const count = sport._count?.matches ?? 0;
  const themeBg = SPORT_THEMES[sport.slug]?.bg;

  // A `data:` URI is a placeholder this app drew for itself, so it loses to a real
  // file on disk. An uploaded cover arrives as an http(s) URL and still wins.
  const uploaded =
    sport.coverImage && !String(sport.coverImage).startsWith('data:') ? sport.coverImage : null;
  const img =
    uploaded ||
    (SPORT_PHOTOS.has(sport.slug) ? `/hero/${sport.slug}.jpg` : null) ||
    (themeBg ? `${themeBg}&w=800` : cover(sport.slug));

  return (
    <Link
      to={`/sports/${sport.slug}`}
      className="group relative flex aspect-[3/4] flex-col justify-end overflow-hidden rounded-card border border-hairline transition-colors duration-200 ease-standard hover:border-brand/50"
    >
      <img
        src={img}
        alt=""
        loading="lazy"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-standard group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
      <div className="relative p-4">
        <h2 className="font-display text-lg font-bold leading-tight tracking-tight text-white">{sport.name}</h2>
        <p className="mt-1 text-xs text-white/65">
          {count > 0
            ? `${count} ${isRacing ? t('explore.events') : t('explore.matches')}`
            : t('explore.enter')}
        </p>
      </div>
    </Link>
  );
};

const SportsIndexPage = () => {
  const { t } = useTranslation();
  const [q, setQ] = useState('');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['nav-sports'],
    queryFn: getSports,
    staleTime: 300000,
  });

  const sports = useMemo(() => {
    const list = [...(data?.data ?? [])].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    const needle = q.trim().toLowerCase();
    return needle ? list.filter((s) => s.name.toLowerCase().includes(needle)) : list;
  }, [data, q]);

  return (
    <div className="bg-page">
      <Seo title={t('sports.title')} description={t('sports.subtitle')} />

      <div className="mx-auto max-w-3xl px-4 pt-4 lg:max-w-6xl lg:px-6 lg:pt-6">
        <h1 className="mb-3 font-display text-xl font-extrabold tracking-[-0.02em] text-primary sm:mb-4 sm:text-3xl">
          {t('sports.title')}
        </h1>
        <p className="mb-5 max-w-lg text-sm text-secondary">{t('sports.subtitle')}</p>

        <label className="mb-6 flex h-10 max-w-sm items-center gap-2.5 rounded-control border border-hairline bg-surface-2 px-3 transition-colors duration-150 ease-standard focus-within:border-brand/40">
          <Search size={15} aria-hidden="true" className="shrink-0 text-tertiary" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('sports.search')}
            aria-label={t('sports.search')}
            className="min-w-0 flex-1 bg-transparent text-sm text-primary outline-none placeholder:text-tertiary"
          />
        </label>
      </div>

      <div className="mx-auto max-w-3xl px-4 pb-14 lg:max-w-6xl lg:px-6">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4] w-full rounded-card" />
            ))}
          </div>
        ) : isError ? (
          <ErrorState title={t('sports.error_title')} hint={t('sports.error_hint')} onRetry={refetch} />
        ) : sports.length === 0 ? (
          <EmptyState
            title={q ? t('sports.no_match', { q }) : t('sports.empty')}
            hint={q ? t('sports.no_match_hint') : t('sports.empty_hint')}
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
            {sports.map((s) => <SportCard key={s.id ?? s.slug} sport={s} t={t} />)}
          </div>
        )}
      </div>
      {/* Advertising sits at the FOOT of the page, after the content, never
          spliced into it. An advert dropped between two fixtures or two
          paragraphs interrupts the thing the reader came for; down here it is
          the last item on the screen and costs the page nothing. AdSlot
          collapses to nothing when the position has no inventory. */}
      <div className="mx-auto max-w-3xl px-4 pb-8 lg:max-w-6xl lg:px-6 lg:pb-12">
        <PageAd position="sports" />
      </div>
    </div>
  );
};

export default SportsIndexPage;
