import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/client';

export default function Home() {
  const { t } = useTranslation();
  const [sports, setSports] = useState([]);
  const [leagues, setLeagues] = useState([]);
  const [fixtures, setFixtures] = useState([]);
  const [news, setNews] = useState([]);
  const [stats, setStats] = useState({ sports: 0, teams: 0, players: 0, matches: 0 });

  useEffect(() => {
    api.get('/sports').then(r => {
      setSports(r.data);
      setStats(s => ({ ...s, sports: r.data.length }));
    });
    api.get('/leagues?status=active').then(r => setLeagues(r.data));
    api.get('/fixtures?status=scheduled&limit=4').then(r => setFixtures(r.data));
    api.get('/news?limit=3').then(r => {
      setNews(r.data);
      setStats(s => ({ ...s, matches: r.data.length }));
    });
  }, []);

  return (
    <>
      <section className="hero">
        <div className="container">
          <h1>Rwanda National Sports Platform</h1>
          <p>Your official hub for Rwandan sports — fixtures, results, standings and live scores</p>
          <div className="hero-btns">
            <Link to="/leagues" className="btn btn-primary">{t('explore_leagues')}</Link>
            <Link to="/fixtures" className="btn btn-outline" style={{ color: '#fff', borderColor: '#fff' }}>{t('live_scores')}</Link>
          </div>
        </div>
      </section>

      <section className="container">
        <div className="stats-bar">
          <div className="stat-item"><div className="stat-value">{stats.sports}</div><div className="stat-label">{t('sports')}</div></div>
          <div className="stat-item"><div className="stat-value">{stats.teams}</div><div className="stat-label">{t('teams')}</div></div>
          <div className="stat-item"><div className="stat-value">{stats.players}</div><div className="stat-label">{t('players_registered')}</div></div>
          <div className="stat-item"><div className="stat-value">{stats.matches}</div><div className="stat-label">{t('total_fixtures')}</div></div>
        </div>
      </section>

      <section className="section">