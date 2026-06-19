import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/client';

export default function LeagueDetail() {
  const { slug } = useParams();
  const { t } = useTranslation();
  const [league, setLeague] = useState(null);
  const [standings, setStandings] = useState([]);
  const [fixtures, setFixtures] = useState([]);
  const [tab, setTab] = useState('standings');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`/leagues/${slug}`),
      api.get(`/leagues/${slug}/standings`),
      api.get(`/fixtures?league_id=${slug}`)
    ]).then(([l, s, f]) => {
      setLeague(l.data);
      setStandings(s.data);
      setFixtures(f.data);
      setLoading(false);
    });
  }, [slug]);

  if (loading) return <div className="spinner" />;
  if (!league) return <div className="container" style={{ padding: '3rem' }}>League not found</div>;

  return (
    <section className="section">
      <div className="container">
        <div style={{ marginBottom: '1.5rem' }}>
          <span style={{ color: 'var(--text2)' }}>{league.sport_name}</span>
          <h1 style={{ fontFamily: 'var(--fh)', fontSize: '2rem', fontWeight: 800 }}>{league.name}</h1>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          {['standings', 'fixtures', 'teams'].map(tb => (
            <button key={tb} className={`btn ${tab === tb ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab(tb)}>{t(tb)}</button>
          ))}
        </div>
