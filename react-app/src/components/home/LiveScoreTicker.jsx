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
    // Only wire up realtime when Pusher is configured — otherwise skip so the
    // ticker still renders the initial scores without crashing.
    const key = import.meta.env.VITE_PUSHER_KEY;
    if (!key) return undefined;

    let pusher;
    try {
      pusher = new Pusher(key, { cluster: import.meta.env.VITE_PUSHER_CLUSTER });
    } catch {
      return undefined;
    }

    const channel = pusher.subscribe('live-scores');
    channel.bind('liveUpdate', (update) => {
      setScores((prev) => prev.map((s) => (s.id === update.fixtureId ? { ...s, ...update } : s)));
    });

    return () => {
      pusher.unsubscribe('live-scores');
      pusher.disconnect();
    };
  }, []);

  if (scores.length === 0) return null;

  // Duplicate scores for seamless loop
  const displayScores = [...scores, ...scores];

  return (
    <div className="bg-black/40 border-b border-white/10 py-2 overflow-hidden relative">
      {/* Left "LIVE NOW" tag, isengesho-ribbon style */}
      <div className="absolute left-0 top-0 bottom-0 z-10 hidden sm:flex items-center px-4 bg-red text-white">
        <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em]">
          <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
          Live Now
        </span>
      </div>
      <div className="animate-ticker hover:[animation-play-state:paused] whitespace-nowrap sm:pl-28">
        {displayScores.map((score, i) => (
          <Link
            key={`${score.id}-${i}`}
            to={`/matches/${score.id}`}
            className="inline-flex items-center align-middle space-x-4 px-8 border-r border-white/10 group transition-all text-white"
          >
            <div className="flex items-center space-x-3">
              <span className="font-display text-sm uppercase tracking-tight text-white/70 group-hover:text-white transition-colors">{score.homeTeam.shortName || score.homeTeam.name}</span>
              <div className="bg-red px-2.5 py-0.5 rounded flex items-center space-x-1.5">
                <span className="font-display text-sm text-white animate-score-pop">{score.homeScore}</span>
                <span className="text-[10px] text-white/50">:</span>
                <span className="font-display text-sm text-white animate-score-pop">{score.awayScore}</span>
              </div>
              <span className="font-display text-sm uppercase tracking-tight text-white/70 group-hover:text-white transition-colors">{score.awayTeam.shortName || score.awayTeam.name}</span>
            </div>

            <span className="text-[10px] font-bold text-white/40 uppercase tracking-tighter">
              {score.minute}'
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default LiveScoreTicker;
