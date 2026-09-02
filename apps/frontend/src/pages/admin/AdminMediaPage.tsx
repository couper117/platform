import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Image as ImageIcon, Copy, Check } from 'lucide-react';
import apiClient from '../../api/client';
import { Skeleton, SkeletonList, EmptyState, ErrorState, IconButton, cn } from '../../components/ui';
import { PageHeader } from '../../components/admin/AdminUI';

/**
 * Super Admin → Media Library. Every uploaded image referenced across the platform
 * (news covers, club crests, sport covers, player photos), aggregated by GET
 * /admin/media, filterable by source, with one-click URL copy.
 */
const SOURCES = ['all', 'news', 'team', 'sport', 'player'];

/**
 * One tile. The square box is fixed whether or not the image arrives, so a broken
 * URL — and this library aggregates URLs from four different tables, so there are
 * always some — leaves a labelled placeholder rather than a collapsed tile that
 * reflows the whole grid.
 */
const Tile = ({ src, alt }: { src?: string | null; alt?: string }) => {
  const [broken, setBroken] = useState(false);
  const show = src && !broken;
  return show ? (
    <img
      src={src as string}
      alt={alt || ''}
      loading="lazy"
      onError={() => setBroken(true)}
      className="h-full w-full object-cover"
    />
  ) : (
    <span className="flex h-full w-full items-center justify-center text-tertiary">
      <ImageIcon size={20} strokeWidth={1.75} aria-hidden="true" />
    </span>
  );
};

const AdminMediaPage = () => {
  const { t } = useTranslation();
  const [source, setSource] = useState('all');
  const [copied, setCopied] = useState(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-media'],
    queryFn: async () => (await apiClient.get('/admin/media')).data.data,
  });

  const media = (data || []).filter((m) => source === 'all' || m.source === source);

  const copy = (url) => {
    if (navigator.clipboard) navigator.clipboard.writeText(url).then(() => { setCopied(url); setTimeout(() => setCopied(null), 1500); });
  };

  const GRID = 'grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4';

  return (
    <div>
      <PageHeader
        title={`${t('admin.media.title')} ${t('admin.media.title_accent')}`}
        subtitle={t('admin.media.subtitle')}
      />

      {/* Source filter. Sentence case, and the active chip is the only green thing
          on the screen so it reads as a state rather than decoration. */}
      <div className="mb-4 flex flex-wrap gap-2">
        {SOURCES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSource(s)}
            aria-pressed={source === s}
            className={cn(
              'min-h-9 rounded-pill border px-3 text-sm font-medium',
              'transition-colors duration-150 ease-standard',
              source === s
                ? 'border-transparent bg-brand-tint text-brand-text'
                : 'border-hairline text-secondary hover:bg-surface-2 hover:text-primary'
            )}
          >
            {t(`admin.media.src_${s}`, s)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <SkeletonList count={8} className={GRID}>
          <div className="overflow-hidden rounded-card border border-hairline bg-surface">
            <Skeleton className="aspect-square w-full rounded-none" />
            <div className="space-y-1.5 p-2.5">
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        </SkeletonList>
      ) : isError ? (
        <ErrorState title={t('admin.media.load_error')} />
      ) : media.length === 0 ? (
        <EmptyState icon={ImageIcon} title={t('admin.media.none_title')} hint={t('admin.media.none_hint')} />
      ) : (
        <>
          <p className="mb-3 text-sm tabular-nums text-tertiary">
            {t('admin.media.count', { count: media.length })}
          </p>
          <div className={GRID}>
            {media.map((m, i) => (
              <figure key={i} className="overflow-hidden rounded-card border border-hairline bg-surface">
                <div className="relative aspect-square bg-surface-2">
                  <Tile src={m.url} alt={m.label} />
                  {/* Always visible, not hover-only: this grid is used on a touch
                      screen too, and a control that needs a pointer to appear does
                      not exist there. */}
                  <IconButton
                    icon={copied === m.url ? Check : Copy}
                    label={String(t('admin.media.copy_url'))}
                    size="sm"
                    variant="secondary"
                    onClick={() => copy(m.url)}
                    className="absolute right-2 top-2 bg-surface/90 backdrop-blur-sm"
                  />
                </div>
                <figcaption className="p-2.5">
                  <p className="truncate text-sm font-medium text-primary">{m.label}</p>
                  <p className="truncate text-xs text-tertiary">
                    {String(t(`admin.media.src_${m.source}`, m.source))}
                  </p>
                </figcaption>
              </figure>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default AdminMediaPage;
