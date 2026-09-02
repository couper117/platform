import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Newspaper } from 'lucide-react';
import { getNews } from '../../api/endpoints/news';
import NewsCard from '../../components/news/NewsCard';
import Seo from '../../components/shared/Seo';
import { Button, EmptyState, ErrorState, SectionHeading, cn } from '../../components/ui';
import { useEnumLabel } from '../../i18n/enums';

const CategoryChip = ({ active, children, ...props }: { active: boolean; children: React.ReactNode } & Record<string, any>) => (
  <button
    type="button"
    className={cn(
      'flex h-8 shrink-0 items-center rounded-pill border px-3 text-xs font-semibold',
      'transition-colors duration-150 ease-standard',
      active
        ? 'border-brand/40 bg-brand-tint text-brand-text'
        : 'border-hairline text-secondary hover:bg-surface-2 hover:text-primary'
    )}
    {...props}
  >
    {children}
  </button>
);

/**
 * News.
 *
 * WHAT THIS REPLACED
 * A dark photo hero shouting "News Center" over a blurred red glow, a sticky
 * filter bar stacked directly under the app header, and cards borrowed from a
 * completely different visual language (white/dark-twin fills, saturated red
 * category pills, `shadow-2xl` hover lift). None of it matched a single other
 * screen in the product.
 *
 * This is a page now, not a billboard: a plain header in the same slot
 * FixtureFilters and LeaguesPage use, an outlined-chip category filter (only
 * shown when the data actually carries categories), then the front page
 * itself — a masthead (lead story left, a short column of headlines beside
 * it) followed by a full-width grid of everything else. The masthead and
 * grid both come from NewsCard, the exact components SportNews and
 * SportOverview's news section use, so the sport pages read as the same
 * paper rather than a smaller, differently-built page.
 *
 * CATEGORY FILTERING IS CLIENT-SIDE ON PURPOSE. The list endpoint accepts a
 * `category` param but the fixture data behind it never actually filters on
 * it — passing it through silently did nothing before. Fetching the full list
 * once and filtering here makes the chips actually work instead of quietly
 * failing the way the old page did.
 */
const NewsListPage = () => {
  const { t } = useTranslation();
  const enumLabel = useEnumLabel();
  const [category, setCategory] = useState('');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['news-list'],
    queryFn: () => getNews(),
    retry: 1,
  });

  const articles = data?.data ?? [];

  const categories = useMemo(
    () => Array.from(new Set(articles.map((a: any) => a.category).filter(Boolean))) as string[],
    [articles]
  );

  const list = useMemo(
    () => (category ? articles.filter((a: any) => a.category === category) : articles),
    [articles, category]
  );

  // The front page: lead + up to four headlines beside it, everything past
  // that falls to the grid below — never silently dropped.
  const [lead, ...rest] = list;
  const secondary = rest.slice(0, 4);
  const grid = rest.slice(4);

  return (
    <div className="min-h-screen bg-page pb-10 lg:pb-14">
      <Seo title={t('news.title')} description={t('news.seo_description')} />

      <div className="mx-auto max-w-3xl px-4 pt-4 lg:max-w-6xl lg:px-6 lg:pt-6">
        <h1 className="mb-3 font-display text-xl font-extrabold tracking-[-0.02em] text-primary sm:mb-4 sm:text-3xl">
          {t('news.title')}
        </h1>
        <p className="mb-4 text-sm text-secondary sm:mb-6">{t('news.subtitle')}</p>

        {categories.length > 0 && (
          <div className="scroll-contain -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mb-6">
            <CategoryChip active={!category} onClick={() => setCategory('')}>
              {t('news.filter_all')}
            </CategoryChip>
            {categories.map((c) => (
              <CategoryChip key={c} active={category === c} onClick={() => setCategory(c)}>
                {enumLabel('news_category', c)}
              </CategoryChip>
            ))}
          </div>
        )}
      </div>

      <div className="mx-auto max-w-3xl px-4 lg:max-w-6xl lg:px-6">
        {isLoading ? (
          <div className="flex flex-col gap-8 lg:gap-10">
            <NewsCard.Masthead loading secondaryCount={4} />
            <NewsCard.Grid loading skeletonCount={6} />
          </div>
        ) : isError ? (
          <ErrorState title={t('news.error_title')} hint={t('news.error_hint')} onRetry={refetch} />
        ) : list.length > 0 ? (
          <div className="flex flex-col gap-8 pb-2 lg:gap-10">
            <NewsCard.Masthead lead={lead} secondary={secondary} secondaryLabel={t('news.more_headlines')} />
            {grid.length > 0 && (
              <section className="flex flex-col gap-3.5">
                <SectionHeading title={t('news.more_stories')} />
                <NewsCard.Grid articles={grid} />
              </section>
            )}
          </div>
        ) : (
          <EmptyState
            icon={Newspaper}
            title={t('news.empty_title')}
            hint={t('news.empty_hint')}
            action={
              category ? (
                <Button variant="secondary" onClick={() => setCategory('')}>
                  {t('common.clear_filters')}
                </Button>
              ) : null
            }
          />
        )}
      </div>
    </div>
  );
};

export default NewsListPage;
