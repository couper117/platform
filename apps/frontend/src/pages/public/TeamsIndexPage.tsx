import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import FollowButton from '../../components/shared/FollowButton';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Search, Users, MapPin } from 'lucide-react';
import apiClient from '../../api/client';
import { getSports } from '../../api/endpoints/sports';
import ClubCrest from '../../components/ui/ClubCrest';
import ResponsiveWrapper from '../../components/shared/ResponsiveWrapper';
import Seo from '../../components/shared/Seo';
import { EmptyState, Skeleton } from '../../components/ui';

/**
 * Public teams directory — a discovery entry point for the "Teams" nav item.
 * Reads the real /teams endpoint and reuses <ClubCrest>; a team card leads to its
 * sport hub for now (a dedicated public team profile can slot in later without
 * changing this page). Theme-aware and fully translated (EN/FR/RW).
 */
const TeamsIndexPage = () => {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [sportId, setSportId] = useState('');

  const { data: sportsRes } = useQuery({ queryKey: ['nav-sports'], queryFn: getSports, staleTime: 300000 });
  const sports = sportsRes?.data || [];

  const { data, isLoading } = useQuery({
    queryKey: ['teams-index'],
    queryFn: async () => (await apiClient.get('/teams')).data,
  });
  const all = data?.data || [];
  const teams = all.filter((tm) => {
    const okSport = !sportId || String(tm.sportId ?? tm.sport?.id) === String(sportId);
    const okText = tm.name.toLowerCase().includes(search.toLowerCase());
    return okSport && okText;
  });
  const sportSlug = (tm) => tm.sport?.slug || sports.find((s) => s.id === (tm.sportId ?? tm.sport?.id))?.slug || 'football';

  return (
    <div className="min-h-screen bg-page py-8 lg:py-12">
      <Seo title={t('teams.title')} description={t('teams.seo_description')} />
      <ResponsiveWrapper>
        <div className="mb-6 flex flex-col gap-2">
          <h1 className="flex items-center gap-2.5 text-3xl font-display uppercase tracking-tight text-primary">
            <Users size={26} className="text-brand" /> {t('teams.title')}
          </h1>
          <p className="text-secondary">{t('teams.subtitle')}</p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-tertiary" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('teams.search_placeholder')}
              aria-label={t('teams.search_placeholder')}
              className="w-full rounded-pill border border-hairline bg-surface py-2.5 pl-10 pr-4 text-sm text-primary outline-none focus-visible:border-brand"
            />
          </div>
          <div className="scroll-contain flex gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setSportId('')}
              className={`shrink-0 rounded-pill border px-3 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${!sportId ? 'border-brand bg-brand-tint text-brand-text' : 'border-hairline text-secondary hover:text-primary'}`}
            >
              {t('teams.all_sports')}
            </button>
            {sports.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSportId(String(s.id))}
                className={`shrink-0 rounded-pill border px-3 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${String(sportId) === String(s.id) ? 'border-brand bg-brand-tint text-brand-text' : 'border-hairline text-secondary hover:text-primary'}`}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
          </div>
        ) : teams.length === 0 ? (
          <EmptyState icon={Users} title={t('teams.none_title')} hint={t('teams.none_hint')} />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {teams.map((tm) => (
              <Link
                key={tm.id}
                to={`/sports/${sportSlug(tm)}`}
                className="group flex items-center gap-3 rounded-2xl border border-hairline bg-surface p-3.5 transition-all hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-md"
              >
                <ClubCrest team={tm} size="lg" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-primary group-hover:text-brand-text">{tm.name}</p>
                  <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-tertiary">
                    {tm.city ? <><MapPin size={11} /> {tm.city}</> : tm.sport?.name}
                  </p>
                  {/* Inside the card but outside the link's job: the button stops
                      the click propagating, so following never navigates away. */}
                  <div className="mt-2">
                    <FollowButton teamId={tm.id} size="sm" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </ResponsiveWrapper>
    </div>
  );
};

export default TeamsIndexPage;
