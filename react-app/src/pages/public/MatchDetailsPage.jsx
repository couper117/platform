import React, { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  Trophy, Clock, MapPin, ChevronLeft, Calendar, Users, Play, Award, Wifi,
} from 'lucide-react';
import { format } from 'date-fns';
import { getFixture } from '../../api/endpoints/fixtures';
import useLiveMatch from '../../hooks/useLiveMatch';
import ResponsiveWrapper from '../../components/shared/ResponsiveWrapper';
import MatchEventTimeline from '../../components/shared/MatchEventTimeline';
import Skeleton from '../../components/shared/Skeleton';
import Seo from '../../components/shared/Seo';
import { LiveBadge } from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';

// Animated score digit that pops when the value changes.
const ScoreDigit = ({ value }) => (
  <motion.span
    key={value}
    initial={{ scale: 1.5, color: '#E8002D' }}
    animate={{ scale: 1, color: 'currentColor' }}
    transition={{ type: 'spring', stiffness: 400, damping: 18 }}
    className="text-6xl sm:text-9xl font-display text-white tabular-nums"
  >
    {value ?? 0}
  </motion.span>
);

const StatBar = ({ label, home, away }) => {
  const total = (home || 0) + (away || 0);
  const homePct = total ? Math.round((home / total) * 100) : 50;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs font-bold tabular-nums">
        <span className={home >= away ? 'text-red' : 'opacity-50'}>{home}</span>
        <span className="text-[10px] uppercase tracking-widest opacity-40">{label}</span>
        <span className={away >= home ? 'text-red' : 'opacity-50'}>{away}</span>
      </div>
      <div className="flex h-1.5 rounded-full overflow-hidden bg-surface-3 dark:bg-white/10">
        <div className="bg-red transition-all duration-500" style={{ width: `${homePct}%` }} />
        <div className="bg-rwanda-blue transition-all duration-500" style={{ width: `${100 - homePct}%` }} />
      </div>
    </div>
  );
};

const TeamBadge = ({ team, size = 'lg' }) => {
  const dim = size === 'lg' ? 'w-20 h-20 sm:w-32 sm:h-32' : 'w-12 h-12';
  return (
    <div className={`${dim} rounded-full bg-white/5 border-2 border-white/10 flex items-center justify-center p-4 overflow-hidden`}>
      {team?.logo ? (
        <img src={team.logo} alt={team.name} className="w-full h-full object-contain" />
      ) : (
        <Trophy size={size === 'lg' ? 48 : 20} className="opacity-10" />
      )}
    </div>
  );
};

const MatchDetailsPage = () => {
  const { t } = useTranslation();
  const { id } = useParams();