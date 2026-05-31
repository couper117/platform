import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  Search, Home, Trophy, CalendarDays, Newspaper, Shield, GraduationCap,
  Users, CornerDownLeft, Loader2, X,
} from 'lucide-react';
import { useCommandPalette } from '../../context/CommandPaletteContext';
import { getLeagues } from '../../api/endpoints/leagues';
import { getTeams } from '../../api/endpoints/teams';
import { getNews } from '../../api/endpoints/news';
import { getSchools } from '../../api/endpoints/amashuri';
import cn from '../ui/cn';

// Static destinations — always available, even if the API is offline.
// labelKey is resolved via i18n at render; keywords stay English to keep matching broad.
const PAGES = [
  { id: 'p-home', labelKey: 'nav.home', icon: Home, to: '/', keywords: 'start dashboard accueil nyumbani ahabanza' },
  { id: 'p-leagues', labelKey: 'nav.leagues', icon: Trophy, to: '/leagues', keywords: 'competition table standings ligue ligi amarigoro' },
  { id: 'p-fixtures', labelKey: 'nav.fixtures', icon: CalendarDays, to: '/fixtures', keywords: 'matches schedule games calendrier ratiba imikino' },
  { id: 'p-results', labelKey: 'nav.results', icon: CalendarDays, to: '/results', keywords: 'scores fulltime resultats matokeo' },
  { id: 'p-news', labelKey: 'nav.news', icon: Newspaper, to: '/news', keywords: 'articles bulletin headlines actualites habari amakuru' },
  { id: 'p-amashuri', labelKey: 'nav.amashuri', icon: GraduationCap, to: '/amashuri', keywords: 'schools inter-school kagame cup championship education amashuri ishuri shule ecole' },
  { id: 'p-championships', labelKey: 'amashuri.championships', icon: GraduationCap, to: '/amashuri/championships', keywords: 'kagame cup tournament competition schools mashindano marushanwa' },
  { id: 'p-schools', labelKey: 'amashuri.directory.title', icon: GraduationCap, to: '/amashuri/schools', keywords: 'find school primary secondary tvet directory orodha urutonde' },
];

const useDebounced = (value, delay = 250) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
};

const CommandPalette = () => {
  const { t } = useTranslation();
  const { open, closePalette } = useCommandPalette();
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const debouncedQuery = useDebounced(query.trim());
  const hasQuery = debouncedQuery.length >= 2;

  // Reset on open
  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Lock body scroll while open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [open]);

  const { data: leaguesData, isFetching: lf } = useQuery({
    queryKey: ['cmd-leagues', debouncedQuery],
    queryFn: () => getLeagues({ search: debouncedQuery, limit: 5 }),
    enabled: open && hasQuery,
    retry: false,
  });
  const { data: teamsData, isFetching: tf } = useQuery({
    queryKey: ['cmd-teams', debouncedQuery],
    queryFn: () => getTeams({ search: debouncedQuery, limit: 5 }),
    enabled: open && hasQuery,
    retry: false,
  });
  const { data: newsData, isFetching: nf } = useQuery({
    queryKey: ['cmd-news', debouncedQuery],
    queryFn: () => getNews({ search: debouncedQuery, limit: 5 }),
    enabled: open && hasQuery,
    retry: false,
  });
  const { data: schoolsData, isFetching: sf } = useQuery({
    queryKey: ['cmd-schools', debouncedQuery],
    queryFn: () => getSchools({ search: debouncedQuery, limit: 5 }),
    enabled: open && hasQuery,
    retry: false,
  });

  const isFetching = lf || tf || nf || sf;

  // Build the flat, ordered list of selectable items + section groupings.
  const { groups, flat } = useMemo(() => {
    const q = debouncedQuery.toLowerCase();

    // Resolve translated labels, then filter against label + (multilingual) keywords.
    const resolvedPages = PAGES.map((p) => ({ ...p, label: t(p.labelKey), type: 'page' }));
    const pageItems = q
      ? resolvedPages.filter((p) => (p.label + ' ' + p.keywords).toLowerCase().includes(q))
      : resolvedPages;

    const leagueItems = (leaguesData?.data || []).map((l) => ({
      id: `l-${l.id}`, type: 'league', label: l.name, sub: l.season || t('search.leagues'),
      icon: Trophy, to: `/leagues/${l.id}`,
    }));
    const teamItems = (teamsData?.data || []).map((tm) => ({
      id: `t-${tm.id}`, type: 'team', label: tm.name, sub: tm.city || t('search.teams'),
      icon: Shield, to: `/leagues`, logo: tm.logo,
    }));
    const newsItems = (newsData?.data || []).map((a) => ({
      id: `n-${a.id}`, type: 'news', label: a.title, sub: t('search.news'),
      icon: Newspaper, to: a.slug ? `/news/${a.slug}` : '/news',
    }));
    const schoolItems = (schoolsData?.data || []).map((s) => ({
      id: `s-${s.id}`, type: 'school', label: s.name, sub: s.category || t('search.schools'),
      icon: GraduationCap, to: `/amashuri/schools/${s.id}`, logo: s.logo,
    }));

    const g = [
      { key: 'pages', heading: t('search.pages'), items: pageItems },
      { key: 'leagues', heading: t('search.leagues'), items: leagueItems },
      { key: 'teams', heading: t('search.teams'), items: teamItems },
      { key: 'schools', heading: t('search.schools'), items: schoolItems },
      { key: 'news', heading: t('search.news'), items: newsItems },
    ].filter((grp) => grp.items.length > 0);

    return { groups: g, flat: g.flatMap((grp) => grp.items) };
  }, [debouncedQuery, leaguesData, teamsData, newsData, schoolsData, t]);

  // Keep active index in range
  useEffect(() => {
    setActive((a) => Math.min(a, Math.max(flat.length - 1, 0)));
  }, [flat.length]);

  const go = (item) => {
    if (!item) return;
    closePalette();
    navigate(item.to);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Escape') { closePalette(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, flat.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    if (e.key === 'Enter') { e.preventDefault(); go(flat[active]); }
  };

  if (!open) return null;

  let runningIndex = -1;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center p-4 sm:pt-[12vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Search RwaSport"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-surface-dark/70 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={closePalette}
      />

      {/* Panel */}
      <div className="relative w-full max-w-xl bg-white dark:bg-surface-dark2 rounded-2xl border border-surface-3 dark:border-white/10 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-top-4 duration-200">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 border-b border-surface-3 dark:border-white/10">
          {isFetching ? (
            <Loader2 size={18} className="text-red animate-spin shrink-0" />
          ) : (
            <Search size={18} className="text-surface-dark/40 dark:text-white/40 shrink-0" />
          )}
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={t('search.placeholder')}
            className="flex-1 bg-transparent py-4 text-base text-surface-dark dark:text-white placeholder:text-surface-dark/30 dark:placeholder:text-white/30 focus:outline-none"
            aria-label={t('common.search')}
          />
          <button
            onClick={closePalette}
            className="p-1.5 rounded-lg text-surface-dark/30 dark:text-white/30 hover:text-red hover:bg-red/5 transition-colors cursor-pointer"
            aria-label="Close search"
          >
            <X size={16} />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[55vh] overflow-y-auto py-2">
          {flat.length === 0 ? (
            <div className="px-4 py-12 text-center text-surface-dark/40 dark:text-white/40">
              {hasQuery ? (
                <>
                  <Search size={28} className="mx-auto mb-3 opacity-50" />
                  <p className="font-display uppercase tracking-widest text-lg">{t('search.no_results')}</p>
                  <p className="text-xs mt-1">{t('search.no_results_hint')}</p>
                </>
              ) : (