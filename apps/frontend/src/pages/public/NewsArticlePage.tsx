import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Calendar, User, ChevronLeft, Newspaper } from 'lucide-react';
import { getArticle } from '../../api/endpoints/news';
import Seo from '../../components/shared/Seo';
import useDateFormat from '../../i18n/dateLocale';
import { useEnumLabel } from '../../i18n/enums';
import { Badge, Button, EmptyState, ErrorState, Skeleton, SkeletonText } from '../../components/ui';

/**
 * Article.
 *
 * WHAT THIS REPLACED
 * A 42vh photo hero with a dark gradient scrim, an uppercase red category
 * pill floating over it, and body copy dropped in at `max-w-none` — the
 * measure ran the full content column, well past a readable line length.
 *
 * This is a reading page now: the header (back link, category, headline,
 * date/author) sits in the normal page-header slot, the cover image (when
 * there is one) runs as a plain in-flow hero rather than a text-on-photo
 * banner, and the body sits at `max-w-[68ch]` — the width every other prose
 * block in the system targets.
 *
 * The body is still rendered with `dangerouslySetInnerHTML`, unchanged from
 * before — this pass restyles the wrapper, it does not touch how the HTML
 * gets there or gets sanitised.
 */
const NewsArticlePage = () => {
  const { t } = useTranslation();
  const { slug } = useParams();
  const formatDate = useDateFormat();
  const enumLabel = useEnumLabel();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['news-article', slug],
    queryFn: () => getArticle(slug),
    retry: 1,
  });

  const article = data?.data;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 pt-4 lg:px-6 lg:pt-6">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-4 h-8 w-3/4" />
        <Skeleton className="mt-3 h-4 w-40" />
        <Skeleton className="mt-5 aspect-[16/9] w-full" />
        <SkeletonText lines={6} className="mt-6 max-w-[68ch]" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 lg:px-6">
        <ErrorState title={t('news.error_title')} hint={t('news.error_hint')} onRetry={refetch} />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 lg:px-6">
        <EmptyState
          icon={Newspaper}
          title={t('news.not_found_title')}
          hint={t('news.not_found_hint')}
          action={
            <Button to="/news" variant="secondary" icon={ChevronLeft}>
              {t('news.back_to_news')}
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <article className="min-h-screen bg-page pb-16">
      <Seo title={article.title} description={article.excerpt || ''} />

      <div className="mx-auto max-w-3xl px-4 pt-4 lg:px-6 lg:pt-6">
        <Link
          to="/news"
          className="mb-4 inline-flex min-h-tap items-center gap-1.5 text-sm font-semibold text-secondary transition-colors duration-150 ease-standard hover:text-brand-text"
        >
          <ChevronLeft size={16} aria-hidden="true" />
          {t('news.back_to_news')}
        </Link>

        {article.category && <Badge className="mb-3">{enumLabel('news_category', article.category)}</Badge>}

        <h1 className="font-display text-2xl font-extrabold leading-tight tracking-[-0.02em] text-primary sm:text-4xl">
          {article.title}
        </h1>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-tertiary">
          {article.createdAt && (
            <span className="flex items-center gap-1.5">
              <Calendar size={13} aria-hidden="true" />
              {formatDate(article.createdAt, 'd MMMM yyyy')}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <User size={13} aria-hidden="true" />
            {article.author?.fullName || t('news.default_author')}
          </span>
        </div>
      </div>

      {article.coverImage && (
        <div className="mx-auto mt-5 max-w-3xl px-4 lg:px-6">
          <div className="aspect-[16/9] overflow-hidden rounded-card bg-surface-2">
            <img
              src={article.coverImage}
              alt={article.title}
              loading="eager"
              decoding="async"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      )}

      <div className="mx-auto max-w-3xl px-4 pt-6 lg:px-6">
        {article.excerpt && (
          <p className="max-w-[68ch] text-lg font-medium leading-relaxed text-secondary">{article.excerpt}</p>
        )}
        <div
          className={[
            'max-w-[68ch] text-base leading-relaxed text-secondary',
            article.excerpt ? 'mt-6' : '',
            '[&>p]:mb-4 [&>p:last-child]:mb-0',
            '[&_h2]:mb-3 [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-primary',
            '[&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:font-display [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-primary',
            '[&_a]:font-semibold [&_a]:text-brand-text [&_a]:underline [&_a]:underline-offset-2',
            '[&_strong]:font-semibold [&_strong]:text-primary',
            '[&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-1',
            '[&_blockquote]:border-l-2 [&_blockquote]:border-brand/40 [&_blockquote]:pl-4 [&_blockquote]:italic',
            '[&_img]:my-4 [&_img]:rounded-card',
          ].join(' ')}
          dangerouslySetInnerHTML={{ __html: article.body || '' }}
        />
      </div>
    </article>
  );
};

export default NewsArticlePage;
