import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, FileText, Activity, AlertCircle, Plus, ChevronRight, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import apiClient from '../../api/client';
import Skeleton from '../../components/shared/Skeleton';
import FixtureCard from '../../components/shared/FixtureCard';

const TeamDashboard = () => {
  const { data: team, isLoading: teamLoading } = useQuery({
    queryKey: ['team-dashboard-data'],
    queryFn: async () => {
      const { data } = await apiClient.get('/teams/my');
      return data.data;
    },
  });

  const teamId = team?.id;

  const { data: fixtures } = useQuery({
    queryKey: ['team-fixtures-upcoming', teamId],
    queryFn: async () => {
      const { data } = await apiClient.get('/fixtures', { params: { teamId, status: 'SCHEDULED', limit: 2 } });
      return data.data;
    },
    enabled: !!teamId,
  });

  const missingDocsCount = team?.players?.reduce((acc, player) => {
    const docCount = player.documents?.filter(d => d.status === 'APPROVED').length || 0;
    return acc + (3 - Math.min(3, docCount)); // Assuming 3 docs required per player
  }, 0) || 0;

  const nextMatch = fixtures?.[0];
  const nextMatchDate = nextMatch?.matchDate ? new Date(nextMatch.matchDate) : null;
  const daysUntilMatch = nextMatchDate ? Math.ceil((nextMatchDate - new Date()) / (1000 * 60 * 60 * 24)) : '—';

  if (teamLoading) return <Skeleton type="card" count={3} />;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex items-center space-x-6">
          <div className="w-20 h-20 bg-white dark:bg-surface-dark2 rounded-3xl flex items-center justify-center border border-surface-3 dark:border-white/5 shadow-xl">
            {team?.logo ? (
              <img src={team.logo} alt={team.name} className="w-full h-full object-cover rounded-3xl" />
            ) : (
              <Trophy size={40} className="text-red opacity-20" />
            )}
          </div>
          <div className="space-y-1">