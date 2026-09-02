import React from 'react';
import { Link } from 'react-router-dom';
import useDateFormat from '../../i18n/dateLocale';
import { useEnumLabel } from '../../i18n/enums';
import Badge from '../ui/Badge';
import Skeleton from '../ui/Skeleton';
import cn from '../ui/cn';

export type NewsArticleSummary = {
  id?: string | number;
  slug?: string;
  title: string;
  excerpt?: string;
  body?: string;
  coverImage?: string;
  createdAt?: string;
  category?: string;
  author?: { fullName?: string };
};

const articleHref = (article: NewsArticleSummary) => `/news/${article.slug || article.id}`;

const stripHtml = (html: string) => html.replace(/<[^>]*>?/g, ' ').replace(/\s+/g, ' ').trim();

/** Falls back to a plain-text clip of the body when no excerpt was set. */
const previewOf = (article: NewsArticleSummary) => {
  if (article.excerpt) return article.excerpt;
  if (!article.body) return undefined;
  const text = stripHtml(article.body);
  return text.length > 160 ? `${text.slice(0, 160).trimEnd()}…` : text;
};

/** Category + date meta row, shared by both card sizes. Badge is deliberately
 * uncoloured — a saturated per-article category pill is the exact violation
 * this card replaces. */
const Meta = ({ article, formatDate, className }: { article: NewsArticleSummary; formatDate: (v: any, p: string) => string; className?: string }) => {
  const enumLabel = useEnumLabel();
  if (!article.category && !article.createdAt) return null;

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {article.category && <Badge>{enumLabel('news_category', article.category)}</Badge>}
      {article.createdAt && <span className="text-xs text-tertiary">{formatDate(article.createdAt, 'd MMM yyyy')}</span>}
    </div>
  );
};

/**
 * NewsCard — the news feature's own card, replacing the legacy
 * `components/shared/NewsCard`. Same anatomy as MatchTile/LeagueCard: a
 * hairline-bordered surface, no shadow, no hover lift or scale — hover only
 * washes the border and background, and the title tints brand.
 *
 * An article with no `coverImage` renders as text only. The old card drew an
 * empty gradient frame with a watermark in its place, which read as a broken
 * image rather than a deliberate text-only story.
 */
const NewsCard = ({ article, className }: { article: NewsArticleSummary; className?: string }) => {
  const formatDate = useDateFormat();
  const preview = previewOf(article);

  return (
    <Link
      to={articleHref(article)}
      className={cn(
        'group flex h-full flex-col overflow-hidden rounded-card border border-hairline bg-surface',
        'transition-colors duration-150 ease-standard hover:border-brand/40 hover:bg-surface-2',
        className
      )}
    >
      {article.coverImage && (
        <div className="aspect-[16/9] overflow-hidden bg-surface-2">
          <img
            src={article.coverImage}
            alt={article.title}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        </div>
      )}
      <div className="flex flex-1 flex-col gap-2 p-4 sm:p-5">
        <Meta article={article} formatDate={formatDate} />
        <h3 className="font-display text-base font-semibold leading-snug text-primary transition-colors duration-150 ease-standard group-hover:text-brand-text sm:text-lg">
          {article.title}
        </h3>
        {preview && <p className="line-clamp-2 text-sm text-secondary">{preview}</p>}
      </div>
    </Link>
  );
};

/**
 * The top story — larger type, full-width photo where one exists. Same
 * text-only fallback as the grid card: no image means no frame, just copy.
 */
NewsCard.Lead = function NewsCardLead({ article, className }: { article: NewsArticleSummary; className?: string }) {
  const formatDate = useDateFormat();
  const preview = previewOf(article);

  return (
    <Link
      to={articleHref(article)}
      className={cn(
        'group block overflow-hidden rounded-card border border-hairline bg-surface',
        'transition-colors duration-150 ease-standard hover:border-brand/40',
        className
      )}
    >
      {article.coverImage && (
        <div className="aspect-[16/9] overflow-hidden bg-surface-2">
          <img
            src={article.coverImage}
            alt={article.title}
            loading="eager"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-150 ease-standard group-hover:scale-105"
          />
        </div>
      )}
      <div className="p-4 sm:p-6">
        <Meta article={article} formatDate={formatDate} className="mb-2" />
        <h2 className="font-display text-xl font-semibold leading-snug text-primary transition-colors duration-150 ease-standard group-hover:text-brand-text sm:text-2xl lg:text-3xl">
          {article.title}
        </h2>
        {preview && <p className="mt-2 line-clamp-2 text-sm text-secondary sm:text-base">{preview}</p>}
      </div>
    </Link>
  );
};

/**
 * A compact row for the secondary column beside the lead: a small 4:3
 * thumbnail on one side, headline + date on the other. No excerpt, no
 * category badge — this is the "also happening" list, not a second grid.
 * Text-only fallback when there is no image, same rule as every other card.
 */
NewsCard.Row = function NewsCardRow({ article, className }: { article: NewsArticleSummary; className?: string }) {
  const formatDate = useDateFormat();

  return (
    <Link
      to={articleHref(article)}
      className={cn(
        'group flex min-h-tap items-center gap-3 py-3',
        'transition-colors duration-150 ease-standard hover:bg-surface-2',
        className
      )}
    >
      {article.coverImage && (
        <div className="aspect-[4/3] w-20 shrink-0 overflow-hidden rounded-control bg-surface-2 sm:w-24">
          <img
            src={article.coverImage}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-150 ease-standard group-hover:scale-105"
          />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-primary transition-colors duration-150 ease-standard group-hover:text-brand-text">
          {article.title}
        </h3>
        {article.createdAt && (
          <p className="mt-1 text-xs text-tertiary">{formatDate(article.createdAt, 'd MMM yyyy')}</p>
        )}
      </div>
    </Link>
  );
};

/** The GRID responsive breakpoints, shared so every surface's "more stories"
 * grid is pixel-identical: 1 col at 360, 2 at sm, 3 at lg. */
const GRID_CLASSES = 'grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 lg:gap-5';

/** The full-width grid of remaining stories beneath the masthead. Centralised
 * here (rather than repeated per page) so NewsListPage, SportNews and
 * SportOverview cannot drift into three different grids. */
NewsCard.Grid = ({
  articles,
  loading = false,
  skeletonCount = 6,
  className,
}: {
  articles?: NewsArticleSummary[];
  loading?: boolean;
  skeletonCount?: number;
  className?: string;
}) => (
  <div className={cn(GRID_CLASSES, className)}>
    {loading
      ? Array.from({ length: skeletonCount }).map((_, i) => <NewsCard.Skeleton key={i} />)
      : (articles ?? []).map((a) => <NewsCard key={a.id ?? a.slug} article={a} />)}
  </div>
);

/** The bordered list of NewsCard.Row items that makes up the secondary
 * column — one hairline-divided card, same idiom as StandingsTable. */
NewsCard.SideList = ({ articles, className }: { articles: NewsArticleSummary[]; className?: string }) => (
  <div className={cn('flex flex-col divide-y divide-hairline overflow-hidden rounded-card border border-hairline bg-surface', className)}>
    {articles.map((a) => (
      <NewsCard.Row key={a.id ?? a.slug} article={a} className="px-3 sm:px-4" />
    ))}
  </div>
);

/**
 * The masthead: lead story on the left, a short column of secondary stories
 * on the right. This is THE shared composition behind the client's "a news
 * then news on side like the right" request — NewsListPage, SportNews and
 * SportOverview all render this same component so the three surfaces read
 * as one design, not three variants.
 *
 * Stacks to a single column (lead first) below `lg` — the side column never
 * fights the lead for space on a phone.
 */
NewsCard.Masthead = ({
  lead,
  secondary = [],
  secondaryLabel,
  loading = false,
  secondaryCount = 4,
  className,
}: {
  lead?: NewsArticleSummary;
  secondary?: NewsArticleSummary[];
  secondaryLabel?: React.ReactNode;
  loading?: boolean;
  secondaryCount?: number;
  className?: string;
}) => (
  <div className={cn('grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:gap-6', className)}>
    {loading ? <NewsCard.Skeleton variant="lead" /> : lead ? <NewsCard.Lead article={lead} /> : null}

    {(loading || secondary.length > 0) && (
      <div className="flex flex-col gap-3">
        {secondaryLabel && (
          <h3 className="font-display text-sm font-semibold text-secondary">{secondaryLabel}</h3>
        )}
        {loading ? (
          <div className="flex flex-col divide-y divide-hairline overflow-hidden rounded-card border border-hairline bg-surface">
            {Array.from({ length: secondaryCount }).map((_, i) => (
              <NewsCard.Skeleton key={i} variant="row" className="px-3 sm:px-4" />
            ))}
          </div>
        ) : (
          <NewsCard.SideList articles={secondary} />
        )}
      </div>
    )}
  </div>
);

/** Lives next to the card and mirrors its exact metrics, grid/lead/row alike,
 * so the skeleton can never drift from the real layout — same idiom as
 * MatchTile.Skeleton. */
NewsCard.Skeleton = ({ variant = 'grid', className }: { variant?: 'grid' | 'lead' | 'row'; className?: string }) => {
  const lead = variant === 'lead';
  const row = variant === 'row';

  if (row) {
    return (
      <div className={cn('flex min-h-tap items-center gap-3 py-3', className)}>
        <Skeleton className="aspect-[4/3] w-20 shrink-0 sm:w-24" />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex h-full flex-col overflow-hidden rounded-card border border-hairline bg-surface', className)}>
      <Skeleton className="aspect-[16/9] w-full" />
      <div className={cn('flex flex-1 flex-col gap-2', lead ? 'p-4 sm:p-6' : 'p-4 sm:p-5')}>
        <Skeleton className="h-5 w-20" />
        <Skeleton className={cn('h-4', lead ? 'w-4/5' : 'w-full')} />
        {lead && <Skeleton className="h-4 w-2/3" />}
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  );
};

export default NewsCard;
