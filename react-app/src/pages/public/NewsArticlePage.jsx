import React from 'react';
import { useDateFormat } from '../../i18n/dateLocale';
import { useTranslation } from 'react-i18next';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Calendar, User, ChevronLeft, AlertCircle } from 'lucide-react';
import { getArticle } from '../../api/endpoints/news';
import ResponsiveWrapper from '../../components/shared/ResponsiveWrapper';
import Skeleton from '../../components/shared/Skeleton';
import Seo from '../../components/shared/Seo';

const NewsArticlePage = () => {
  const { t } = useTranslation();
  const formatDate = useDateFormat();
  const { slug } = useParams();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['news-article', slug],
    queryFn: () => getArticle(slug),
    retry: 1,
  });

  const article = data?.data;

  if (isLoading) {
    return <div className="py-24"><ResponsiveWrapper><Skeleton type="card" count={1} /></ResponsiveWrapper></div>;
  }

  if (isError || !article) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center px-4">
        <AlertCircle size={40} className="text-red" />
        <p className="font-display text-3xl uppercase tracking-widest opacity-60">{t('news.not_found')}</p>
        <Link to="/news" className="bg-red text-white px-6 py-2 rounded-lg font-display uppercase tracking-widest text-sm">{t('news.back_to_news')}</Link>
      </div>
    );
  }

  return (
    <article className="bg-surface-2 dark:bg-surface-dark min-h-screen pb-24">
      <Seo title={article.title} description={article.excerpt || ''} image={article.coverImage} />

      {/* Hero */}
      <div className="relative h-[42vh] min-h-[300px] bg-surface-dark overflow-hidden">
        {article.coverImage && (
          <img src={article.coverImage} alt={article.title} className="absolute inset-0 w-full h-full object-cover opacity-60" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-surface-dark via-surface-dark/70 to-transparent" />
        <ResponsiveWrapper className="relative z-10 h-full flex flex-col justify-end pb-10">
          <Link to="/news" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/50 hover:text-red mb-4 w-fit">
            <ChevronLeft size={14} /> Back to News
          </Link>
          <span className="bg-red text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full w-fit mb-4">{article.category}</span>
          <h1 className="text-3xl sm:text-5xl font-display text-white uppercase tracking-tighter leading-tight max-w-4xl">{article.title}</h1>
          <div className="flex items-center gap-4 mt-4 text-[10px] uppercase font-bold tracking-widest text-white/50">
            <span className="flex items-center gap-1"><Calendar size={12} />{formatDate(article.createdAt, 'dd MMM yyyy')}</span>
            <span className="flex items-center gap-1"><User size={12} />{article.author?.fullName || 'RwaSport'}</span>
          </div>
        </ResponsiveWrapper>
      </div>

      <ResponsiveWrapper className="mt-12 max-w-3xl">
        {article.excerpt && <p className="text-lg sm:text-xl font-light opacity-70 leading-relaxed mb-8 border-l-4 border-red pl-6">{article.excerpt}</p>}
        <div
          className="prose prose-lg dark:prose-invert max-w-none opacity-80 leading-relaxed [&_p]:mb-4"
          dangerouslySetInnerHTML={{ __html: article.body || '' }}
        />
      </ResponsiveWrapper>
    </article>
  );
};

export default NewsArticlePage;
