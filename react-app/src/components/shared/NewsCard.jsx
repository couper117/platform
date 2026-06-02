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