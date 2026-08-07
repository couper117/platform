import React, { useState } from 'react';
import { useEnumLabel } from '../../i18n/enums';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, ArrowRight, Compass } from 'lucide-react';
import { getSports } from '../../api/endpoints/sports';
import { sportTheme } from '../../config/sportThemes';
import SportIcon from '../../components/shared/SportIcon';
import ResponsiveWrapper from '../../components/shared/ResponsiveWrapper';
import LiveTodayStrip from '../../components/public/LiveTodayStrip';
import Skeleton from '../../components/shared/Skeleton';
import Seo from '../../components/shared/Seo';



const ExplorePage = () => {
  const { t } = useTranslation();
  const enumLabel = useEnumLabel();
  const [search, setSearch] = useState('');
  const { data, isLoading } = useQuery({ queryKey: ['explore-sports'], queryFn: getSports });
  const sports = (data?.data || []).filter((s) => s.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="bg-surface-2 dark:bg-surface-dark min-h-screen pb-24">
      <Seo title={t('explore.seo_title')} description={t('explore.seo_desc')} />

      <section className="relative overflow-hidden bg-surface-dark text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-red/25 via-transparent to-rwanda-green/20" />
        <ResponsiveWrapper className="relative z-10 py-16 sm:py-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.3em] bg-white/10 border border-white/15 mb-5">
            <Compass size={13} /> {t('nav.explore')}
          </div>
          <h1 className="text-5xl sm:text-7xl font-display uppercase tracking-tighter leading-none">
            {t('explore.hero_title')} <span className="text-red">{t('explore.hero_accent')}</span>
          </h1>
          <p className="text-white/50 mt-4 max-w-lg text-sm">
            {t('explore.hero_hint')}
          </p>
          <div className="mt-8 flex items-center bg-white/10 border border-white/15 rounded-2xl px-4 max-w-md backdrop-blur">
            <Search size={18} className="text-white/40" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('explore.search_placeholder')}
              className="bg-transparent text-white placeholder:text-white/30 p-4 w-full outline-none text-sm"
            />
          </div>
        </ResponsiveWrapper>
      </section>

      {/* Slim live/today match strip — instant scores without leaving the chooser */}
      <LiveTodayStrip />

      <ResponsiveWrapper className="mt-12">
        {isLoading ? (
          <Skeleton type="card" count={6} />
        ) : sports.length === 0 ? (
          <p className="opacity-50 py-16 text-center">No sports match "{search}".</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {sports.map((s) => {
              const theme = sportTheme(s.slug);
              const bg = s.coverImage || theme.bg;
              return (
                <Link
                  key={s.id}
                  to={`/sports/${s.slug}`}
                  className="group relative aspect-[4/5] rounded-3xl overflow-hidden border border-surface-3 dark:border-white/10 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
                >
                  {bg && <img src={bg} alt="" className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10" />
                  <div className="absolute inset-0" style={{ background: `radial-gradient(70% 60% at 50% 100%, ${theme.accent}44, transparent)` }} />

                  <div className="relative z-10 h-full flex flex-col justify-between p-4 sm:p-5 text-white">
                    <SportIcon slug={s.slug} className="text-3xl sm:text-4xl drop-shadow-lg" style={{ color: theme.accent }} />
                    <div>
                      <span className="text-[8px] font-bold uppercase tracking-[0.3em] text-white/60">{enumLabel('sport_type', s.type, t('explore.generic_sport'))}</span>
                      <h3 className="font-display text-xl sm:text-2xl uppercase tracking-tight leading-none mt-1">{s.name}</h3>
                      <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest mt-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity" style={{ color: theme.accent }}>
                        Enter <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </ResponsiveWrapper>
    </div>
  );
};

export default ExplorePage;
