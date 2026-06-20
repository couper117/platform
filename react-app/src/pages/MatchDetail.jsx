import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/client';

export default function MatchDetail() {
  const { id } = useParams();
  const { t } = useTranslation();
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/fixtures/${id}`).then(r => {
      setMatch(r.data);
      setLoading(false);
    });
  }, [id]);

  useEffect(() => {
    if (match?.status === 'live') {
      const interval = setInterval(() => {
        api.get(`/fixtures/${id}`).then(r => setMatch(r.data));
      }, 15000);
      return () => clearInterval(interval);
    }
  }, [match]);

  if (loading) return <div className="spinner" />;
  if (!match) return <div className="container" style={{ padding: '3rem' }}>Match not found</div>;

  return (
    <>
      <div className="match-header">
        <div className="container">
          <div className="match-teams">
            <div className="match-team">
              <img src={match.home_logo ? `/uploads/logos/${match.home_logo}` : ''} alt={match.home_team} />
              <div className="match-team-name">{match.home_team}</div>
            </div>
            <div>