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
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">{t('all_sports')}</h2>
            <Link to="/sports" className="btn btn-outline">{t('view_all')}</Link>
          </div>
          <div className="grid-4">
            {sports.map(s => (
              <Link key={s.id} to={`/sports/${s.slug}`} className="sport-card">
                <div className="sport-icon">{s.icon || '⚽'}</div>
                <div>
                  <div className="sport-name">{s.name}</div>
                  <div className="sport-count">{s.league_count || 0} leagues</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ background: 'var(--surface2)' }}>
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">{t('live_fixtures_h')}</h2>
            <Link to="/fixtures" className="btn btn-outline">{t('view_all')}</Link>
          </div>
          <div className="grid-2">
            {fixtures.map(f => (
              <Link key={f.id} to={`/fixtures/${f.id}`} className="fixture-card">
                <div className="fixture-teams">
                  <img src={f.home_logo ? `/uploads/logos/${f.home_logo}` : ''} className="fixture-logo" alt="" />
                  <div>
                    <div className="fixture-team">{f.home_team}</div>
                    <div className="fixture-vs">vs</div>
                    <div className="fixture-team">{f.away_team}</div>
                  </div>
                  <img src={f.away_logo ? `/uploads/logos/${f.away_logo}` : ''} className="fixture-logo" alt="" />
                </div>
                <div className="fixture-meta">
                  <span className="badge badge-blue">{f.status}</span>
                  <span className="fixture-date">{new Date(f.match_date).toLocaleDateString()}</span>
                  <span>{f.league_name}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">{t('all_leagues')}</h2>
            <Link to="/leagues" className="btn btn-outline">{t('view_all')}</Link>
          </div>
          <div className="grid-3">
            {leagues.map(l => (
              <Link key={l.id} to={`/leagues/${l.slug}`} className="league-card">
                <div className="league-cover" />
                <div className="league-body">
                  <div className="league-name">{l.name}</div>
                  <div className="league-meta">
                    <span className="league-tag">{l.sport_name}</span>
                    <span className="league-tag">{l.season}</span>
                    <span className={`badge badge-${l.status === 'active' ? 'green' : 'gray'}`}>{l.status}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ background: 'var(--surface2)' }}>
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">{t('latest_news')}</h2>
            <Link to="/news" className="btn btn-outline">{t('view_all')}</Link>
          </div>
          <div className="grid-3">
            {news.map(n => (
              <Link key={n.id} to={`/news/${n.slug}`} className="news-card">
                <div className="news-img" style={{ background: '#ddd' }} />
                <div className="news-body">
                  <div className="news-cat">{n.category || 'News'}</div>
                  <div className="news-title">{n.title}</div>
                  <div className="news-excerpt">{n.excerpt?.slice(0, 100)}...</div>
                  <div className="news-date">{new Date(n.created_at).toLocaleDateString()}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}