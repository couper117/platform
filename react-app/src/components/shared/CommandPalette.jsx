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