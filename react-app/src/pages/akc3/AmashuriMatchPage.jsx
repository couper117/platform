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
    return (
      <div className="py-32">
        <ResponsiveWrapper><EmptyState title={t('match.not_found')} hint={t('match.not_found_hint')} /></ResponsiveWrapper>
      </div>
    );
  }

  const isLive = m.status === 'ONGOING';
  const isCompleted = m.status === 'COMPLETED';
  const homeName = m.homeTeam?.school?.name;
  const awayName = m.awayTeam?.school?.name;

  return (
    <div className="bg-surface-2 dark:bg-surface-dark min-h-screen pb-24">
      <Seo title={`${homeName} vs ${awayName} — Amashuri Games`} description={`School fixture: ${homeName} vs ${awayName}.`} />

      <div className="bg-rwanda-blue/95 py-4">
        <ResponsiveWrapper>
          <Link to="/amashuri/fixtures" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/70 hover:text-rwanda-yellow transition-colors">
            <ChevronLeft size={14} />
            <span>{t('match.back_to_schedule')}</span>
          </Link>
        </ResponsiveWrapper>
      </div>

      {/* Scoreboard */}
      <section className="bg-rwanda-blue py-12 sm:py-20 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-rwanda-blue via-rwanda-blue to-[#007bb0]" />
        <div className="absolute -top-24 -right-16 w-[28rem] h-[28rem] rounded-full bg-rwanda-yellow/15 blur-[120px]" />
        <ResponsiveWrapper className="relative z-10">
          <div className="flex flex-col items-center gap-10">
            <div className="flex flex-col items-center gap-3">
              <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/50">
                {m.competition?.name || 'Schools Championship'}
              </span>
              {isLive ? <LiveBadge /> : (
                <Badge tone="neutral" className="bg-white/10 border-white/20 text-white/80">
                  {isCompleted ? t('match.full_time') : (m.status || 'Scheduled').replace(/_/g, ' ')}
                </Badge>
              )}
            </div>

            <div className="w-full flex items-center justify-between max-w-4xl">
              <SchoolBadge team={m.homeTeam} />
              <div className="flex items-center gap-5 sm:gap-12 px-4 sm:px-12">
                {isLive || isCompleted ? (
                  <>
                    <ScoreDigit value={m.homeScore} />
                    <span className="text-3xl sm:text-5xl font-display opacity-30">:</span>
                    <ScoreDigit value={m.awayScore} />
                  </>
                ) : (
                  <div className="text-center">
                    <span className="block text-5xl sm:text-7xl font-display text-rwanda-yellow leading-none">
                      {m.matchDate ? format(new Date(m.matchDate), 'HH:mm') : 'TBD'}
                    </span>
                    <span className="text-[10px] uppercase tracking-widest opacity-50 mt-2 block">{t('match.kick_off')}</span>
                  </div>
                )}
              </div>
              <SchoolBadge team={m.awayTeam} />
            </div>
