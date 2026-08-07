import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Newspaper, AlertCircle } from 'lucide-react';
import { getNews } from '../../api/endpoints/news';
import ResponsiveWrapper from '../../components/shared/ResponsiveWrapper';
import NewsCard from '../../components/shared/NewsCard';
import Skeleton from '../../components/shared/Skeleton';
import Seo from '../../components/shared/Seo';

const CATEGORIES = ['ALL', 'NEWS', 'ANNOUNCEMENT', 'RESULT', 'TRANSFER', 'INJURY'];

const NewsListPage = () => {
  const { t } = useTranslation();
  const [category, setCategory] = useState('ALL');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['news-list', category],
    queryFn: () => getNews(category === 'ALL' ? {} : { category }),
    retry: 1,
  });

  const articles = data?.data || [];

  return (
    <div className="bg-surface-2 dark:bg-surface-dark min-h-screen pb-24">
      <Seo title="News" description="Latest news, announcements, results and transfers across Rwandan sport." />

      {/* Header */}
      <section className="bg-surface-dark py-16 sm:py-24 relative overflow-hidden">
        <div className="absolute -top-32 -right-24 w-[30rem] h-[30rem] rounded-full bg-red/15 blur-[120px]" />
        <ResponsiveWrapper className="relative z-10 text-center space-y-3">
          <h1 className="text-5xl sm:text-7xl font-display text-white uppercase tracking-tighter">
            {t('nav.news')} <span className="text-red">Center</span>
          </h1>
          <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.3em]">The pulse of Rwandan sport</p>
        </ResponsiveWrapper>
      </section>

      {/* Category filter */}
      <div className="sticky top-[60px] z-40 bg-white/80 dark:bg-surface-dark2/80 backdrop-blur-xl border-b border-surface-3 dark:border-white/5">
        <ResponsiveWrapper>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide py-4">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all border ${
                  category === c
                    ? 'bg-red text-white border-red'
                    : 'border-surface-3 dark:border-white/10 text-surface-dark/50 dark:text-white/50 hover:border-red/40'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </ResponsiveWrapper>
      </div>

      <ResponsiveWrapper className="mt-12">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8"><Skeleton type="card" count={6} /></div>
        ) : isError ? (
          <div className="py-24 flex flex-col items-center gap-4 text-center">
            <AlertCircle size={40} className="text-red" />
            <p className="font-display text-2xl uppercase tracking-widest opacity-60">Couldn't load news</p>
            <button onClick={() => refetch()} className="bg-red text-white px-6 py-2 rounded-lg font-display uppercase tracking-widest text-sm">Retry</button>
          </div>
        ) : articles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {articles.map((a) => <NewsCard key={a.id} article={a} />)}
          </div>
        ) : (
          <div className="py-24 flex flex-col items-center gap-4 text-center opacity-30">
            <Newspaper size={40} />
            <p className="font-display text-2xl uppercase tracking-widest">No articles yet</p>
          </div>
        )}
      </ResponsiveWrapper>
    </div>
  );
};

export default NewsListPage;
