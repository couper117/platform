import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { School, Clock, MapPin, ChevronLeft, Calendar, Trophy, Flag } from 'lucide-react';
import { format } from 'date-fns';
import { getAkcFixture } from '../../api/endpoints/amashuri';
import ResponsiveWrapper from '../../components/shared/ResponsiveWrapper';
import Skeleton from '../../components/shared/Skeleton';
import Seo from '../../components/shared/Seo';
import Card from '../../components/ui/Card';
import Badge, { LiveBadge } from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';

const initials = (name = '') => name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();

const SchoolBadge = ({ team }) => {
  const school = team?.school;
  return (
    <div className="flex-1 flex flex-col items-center text-center gap-4">
      <div className="w-20 h-20 sm:w-32 sm:h-32 rounded-full bg-white/5 border-2 border-white/10 flex items-center justify-center p-4 overflow-hidden">
        {school?.logo ? (
          <img src={school.logo} alt={school.name} className="w-full h-full object-contain" />
        ) : (
          <span className="font-display text-3xl sm:text-5xl opacity-20">{initials(school?.name || 'SC')}</span>
        )}
      </div>
      <div>
        <h2 className="text-lg sm:text-3xl font-display uppercase tracking-tight">{school?.name || 'School'}</h2>
        <span className="text-[10px] uppercase tracking-widest opacity-50">{team?.ageCategory} · {team?.gender}</span>
      </div>
    </div>
  );
};

const ScoreDigit = ({ value }) => (
  <motion.span
    key={value}
    initial={{ scale: 1.4, color: '#FAD201' }}
    animate={{ scale: 1, color: '#FFFFFF' }}
    transition={{ type: 'spring', stiffness: 400, damping: 18 }}
    className="text-6xl sm:text-9xl font-display tabular-nums"
  >
    {value ?? 0}
  </motion.span>
);

const AmashuriMatchPage = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const { data, isLoading } = useQuery({
    queryKey: ['amashuri-match', id],
    queryFn: () => getAkcFixture(id),
    retry: false,
  });

  if (isLoading) {
    return <div className="py-20"><ResponsiveWrapper><Skeleton type="card" /></ResponsiveWrapper></div>;
  }

  const m = data?.data;
  if (!m) {