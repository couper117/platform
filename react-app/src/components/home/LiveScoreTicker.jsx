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