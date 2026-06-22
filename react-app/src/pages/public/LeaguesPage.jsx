import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Trophy, Users, Calendar, Filter, Search, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getLeagues } from '../../api/endpoints/leagues';
import { getSports } from '../../api/endpoints/sports';
import ResponsiveWrapper from '../../components/shared/ResponsiveWrapper';
import Skeleton from '../../components/shared/Skeleton';

const LeagueCard = ({ league }) => (
  <Link 
    to={`/leagues/${league.id}`}
    className="group bg-white dark:bg-surface-dark2 rounded-2xl border border-surface-3 dark:border-white/5 p-6 transition-all hover:shadow-2xl hover:-translate-y-1"
  >
    <div className="flex items-start justify-between mb-6">
      <div className="p-3 bg-red/5 rounded-xl border border-red/10 text-red group-hover:bg-red group-hover:text-white transition-all">
        <Trophy size={24} />
      </div>
      <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${
        league.status === 'ACTIVE' ? 'bg-green/5 text-green border-green/10' : 'bg-gold/5 text-gold border-gold/10'
      }`}>
        {league.status}
      </span>
    </div>

    <div className="space-y-2">
      <h3 className="text-2xl font-display uppercase tracking-tight line-clamp-1">{league.name}</h3>
      <div className="flex items-center space-x-2 text-[10px] uppercase font-bold tracking-widest opacity-40">
        <span>{league.sport?.name}</span>
        <span>•</span>
        <span>Season {league.season}</span>
      </div>
    </div>

    <div className="mt-8 grid grid-cols-2 gap-4 border-t border-surface-3 dark:border-white/5 pt-6">
      <div className="flex items-center space-x-2">
        <Users size={14} className="text-red opacity-60" />
        <span className="text-xs font-bold opacity-60">{league._count?.teams || 0} Teams</span>
      </div>
      <div className="flex items-center space-x-2">
        <Calendar size={14} className="text-red opacity-60" />
        <span className="text-xs font-bold opacity-60">{league.gender}</span>
      </div>
    </div>

    <div className="mt-6 flex items-center justify-between group-hover:text-red transition-colors">
      <span className="text-[10px] font-bold uppercase tracking-[0.2em]">View Standings</span>
      <ChevronRight size={16} className="transform group-hover:translate-x-1 transition-transform" />
    </div>
  </Link>
);
