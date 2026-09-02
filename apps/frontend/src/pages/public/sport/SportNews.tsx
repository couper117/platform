import React from 'react';
import { useTranslation } from 'react-i18next';
import { Newspaper } from 'lucide-react';
import { useSport } from './SportLayout';
import NewsCard from '../../../components/news/NewsCard';
import EmptyState from '../../../components/ui/EmptyState';

/**
 * SportNews — the sport's own front page.
 *
 * Same composition as `/news`, built from the exact same NewsCard pieces:
 * a masthead (lead story left, a short column of headlines beside it) and,
 * if there is enough left over, a grid underneath. A sport with only a
 * handful of stories just renders a smaller masthead and no grid — the
 * client's "lead + a few rows" case — but it is never a different card, a
 * different column layout, or a different corner radius from `/news`.
 */
const SportNews = () => {
  const { t } = useTranslation();
  const { sport, news } = useSport();

  if (news.length === 0) {
    return (
      <EmptyState
        icon={Newspaper}
        title={t('sporthub.no_news', { sport: sport?.name })}
        hint={t('sporthub.news_empty_hint')}
      />
    );
  }

  const [lead, ...rest] = news;
  const secondary = rest.slice(0, 4);
  const grid = rest.slice(4);

  return (
    <div className="flex flex-col gap-8 lg:gap-10">
      <NewsCard.Masthead lead={lead} secondary={secondary} secondaryLabel={t('news.more_headlines')} />
      {grid.length > 0 && <NewsCard.Grid articles={grid} />}
    </div>
  );
};

export default SportNews;
