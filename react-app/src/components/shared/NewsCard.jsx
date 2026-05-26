import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, User, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

const NewsCard = ({ article }) => {
  return (
    <Link 
      to={`/news/${article.slug}`}
      className="group flex flex-col bg-white dark:bg-surface-dark2 rounded-2xl border border-surface-3 dark:border-white/5 overflow-hidden transition-all hover:shadow-2xl hover:-translate-y-1"
    >
      <div className="relative aspect-[16/9] overflow-hidden">
        {article.coverImage ? (
          <img 
            src={article.coverImage} 
            alt={article.title} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-surface-3 to-surface-2 dark:from-white/5 dark:to-white/10 flex items-center justify-center">
            <span className="font-display text-4xl opacity-10">RNSP</span>
          </div>
        )}
        <div className="absolute top-4 left-4">
          <span className="bg-red text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">
            {article.category}
          </span>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-surface-dark/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      <div className="p-5 sm:p-6 flex flex-col flex-grow">
        <div className="flex items-center space-x-3 text-[10px] uppercase font-bold tracking-widest opacity-40 mb-3">
          <div className="flex items-center space-x-1">
            <Calendar size={12} />
            <span>{format(new Date(article.createdAt), 'dd MMM yyyy')}</span>
          </div>
          <span>•</span>
          <div className="flex items-center space-x-1">
            <User size={12} />
            <span>{article.author?.fullName || 'Admin'}</span>
          </div>
        </div>

        <h3 className="text-xl sm:text-2xl font-display uppercase leading-tight tracking-tight group-hover:text-red transition-colors mb-3 line-clamp-2">
          {article.title}
        </h3>

        <p className="text-sm opacity-60 line-clamp-3 mb-6 flex-grow">
          {article.excerpt || article.body?.substring(0, 150).replace(/<[^>]*>?/gm, '') + '...'}
        </p>

        <div className="flex items-center text-[10px] font-bold uppercase tracking-[0.2em] text-red group-hover:gap-2 transition-all">
          <span>Read Full Story</span>
          <ArrowRight size={14} className="ml-2 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </Link>
  );
};

export default NewsCard;
