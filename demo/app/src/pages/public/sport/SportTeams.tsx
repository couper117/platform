import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, Users } from 'lucide-react';
import { useSport } from './SportLayout';
import ClubCrest from '../../../components/ui/ClubCrest';
import EmptyState from '../../../components/ui/EmptyState';

/**
 * Teams — this sport's clubs, nothing else.
 *
 * `teams` arrives ready-made from SportLayout, which already fetched it once for
 * the header counter. Re-requesting it here would double the network cost of this
 * tab for data the shell already holds.
 *
 * The search box only earns its place once there is enough to search through —
 * below twelve clubs, scanning a 2/3/4-column grid is faster than typing.
 */
const SEARCH_THRESHOLD = 12;

const SportTeams = () => {
  const { t } = useTranslation();
  const { teams } = useSport();
  const [search, setSearch] = useState('');

  const showSearch = teams.length >= SEARCH_THRESHOLD;
  const query = search.trim().toLowerCase();
  const visible = query ? teams.filter((tm) => tm.name.toLowerCase().includes(query)) : teams;

  if (teams.length === 0) {
    return <EmptyState icon={Users} title={t('team.sport_none_title')} hint={t('team.sport_none_hint')} />;
  }

  return (
    <div className="flex flex-col gap-4">
      {showSearch && (
        <div className="relative">
          <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-tertiary" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('team.search_placeholder')}
            aria-label={t('team.search_placeholder')}
            className="min-h-tap w-full rounded-pill border border-hairline bg-surface py-2.5 pl-10 pr-4 text-sm text-primary outline-none transition-colors duration-150 ease-standard focus:border-brand"
          />
        </div>
      )}

      {visible.length === 0 ? (
        <EmptyState icon={Search} title={t('team.search_none_title')} hint={t('team.search_none_hint')} />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {visible.map((tm) => (
            <Link
              key={tm.id}
              to={`/teams/${tm.id}`}
              className="group flex items-center gap-3 rounded-card border border-hairline bg-surface p-3.5 transition-colors duration-150 ease-standard hover:border-brand/30 hover:bg-surface-2"
            >
              <ClubCrest team={tm} size="lg" />
              <div className="min-w-0">
                <p className="truncate font-bold text-primary group-hover:text-brand-text">{tm.name}</p>
                {tm.city && <p className="mt-0.5 truncate text-xs text-tertiary">{tm.city}</p>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default SportTeams;
