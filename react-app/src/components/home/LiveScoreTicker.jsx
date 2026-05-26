import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getLiveScores } from '../../api/endpoints/fixtures';
import Pusher from 'pusher-js';

const LiveScoreTicker = () => {
  const { data: initialScores } = useQuery({
    queryKey: ['live-scores-ticker'],
    queryFn: getLiveScores,
  });

  const [scores, setScores] = useState([]);

  useEffect(() => {
    if (initialScores?.data) {
      setScores(initialScores.data);
    }
  }, [initialScores]);

  useEffect(() => {
    const pusher = new Pusher(import.meta.env.VITE_PUSHER_KEY, {
      cluster: import.meta.env.VITE_PUSHER_CLUSTER,
    });

    const channel = pusher.subscribe('live-scores');
    channel.bind('liveUpdate', (update) => {
      setScores(prev => prev.map(s => s.id === update.fixtureId ? { ...s, ...update } : s));
    });

    return () => {
      pusher.unsubscribe('live-scores');
    };
  }, []);

  if (scores.length === 0) return null;

  // Duplicate scores for seamless loop
  const displayScores = [...scores, ...scores];

  return (
    <div className="bg-red/5 border-y border-red/10 py-2.5 overflow-hidden relative">
      <div className="flex animate-ticker hover:[animation-play-state:paused] whitespace-nowrap">
        {displayScores.map((score, i) => (
          <Link 
            key={`${score.id}-${i}`}
            to={`/matches/${score.id}`}
            className="flex items-center space-x-4 px-8 border-r border-red/10 group transition-all"
          >
            <div className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 bg-red rounded-full animate-pulse" />
              <span className="text-[10px] font-bold text-red uppercase italic">Live</span>
            </div>
            
            <div className="flex items-center space-x-3">
              <span className="font-display text-sm uppercase tracking-tight opacity-70 group-hover:opacity-100">{score.homeTeam.shortName || score.homeTeam.name}</span>
              <div className="bg-surface-dark px-2.5 py-0.5 rounded flex items-center space-x-1.5">
                <span className="font-display text-sm text-white animate-score-pop">{score.homeScore}</span>
                <span className="text-[10px] text-white/20">:</span>
                <span className="font-display text-sm text-white animate-score-pop">{score.awayScore}</span>
              </div>
              <span className="font-display text-sm uppercase tracking-tight opacity-70 group-hover:opacity-100">{score.awayTeam.shortName || score.awayTeam.name}</span>
            </div>

            <span className="text-[10px] font-bold opacity-30 uppercase tracking-tighter">
              {score.minute}'
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default LiveScoreTicker;
