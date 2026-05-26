import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../api/client';

export default function AdminDashboard() {
  const { t } = useTranslation();
  const [stats, setStats] = useState({ sports: 0, leagues: 0, teams: 0, players: 0, fixtures: 0, news: 0 });
  const [pending, setPending] = useState({ teams: 0, players: 0, messages: 0 });
  const [live, setLive] = useState([]);

  useEffect(() => {
    Promise.all([
      api.get('/sports'),
      api.get('/leagues'),
      api.get('/teams?status=verified'),
      api.get('/players'),
      api.get('/fixtures'),
      api.get('/news')
    ]).then(([s, l, t, p, f, n]) => {
      setStats({
        sports: s.data.length,
        leagues: l.data.length,
        teams: t.data.length,
        players: p.data.length,
        fixtures: f.data.length,
        news: n.data.length
      });
    });

    api.get('/fixtures?status=live').then(r => setLive(r.data));
    api.get('/teams?status=pending').then(r => setPending(p => ({ ...p, teams: r.data.length })));
  }, []);

  return (
    <div>
      <div className="admin-header">
        <h1 style={{ fontFamily: 'var(--fh)', fontSize: '1.8rem' }}>{t('dashboard')}</h1>
        <span style={{ color: 'var(--green)', fontWeight: 600 }}>● {t('system_online')}</span>
      </div>
      <div className="admin-content">
        {live.length > 0 && (
          <div style={{ background: 'var(--red)', color: '#fff', padding: '1rem 1.25rem', borderRadius: 8, marginBottom: '1.5rem', fontWeight: 600 }}>
            🔴 {live.length} {t('matches_live_alert')}
          </div>
        )}

        <div className="grid-4" style={{ marginBottom: '2rem' }}>
          {[
            { label: 'sports', value: stats.sports },
            { label: 'leagues', value: stats.leagues },
            { label: 'total_teams', value: stats.teams },
            { label: 'players_registered', value: stats.players },
            { label: 'total_fixtures', value: stats.fixtures },
            { label: 'news_posts', value: stats.news },
          ].map(s => (
            <div key={s.label} className="card" style={{ textAlign: 'center', padding: '1.5rem' }}>
              <div style={{ fontFamily: 'var(--fh)', fontSize: '2.5rem', fontWeight: 800, color: 'var(--red)' }}>{s.value}</div>
              <div style={{ color: 'var(--text2)', fontSize: '.85rem', marginTop: '.25rem' }}>{t(s.label)}</div>
            </div>
          ))}
        </div>

        <div className="grid-2">
          <div className="card">
            <div className="card-header">{t('quick_actions')}</div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
              <button className="btn btn-outline" style={{ justifyContent: 'flex-start' }}>{t('add_fixture')}</button>
              <button className="btn btn-outline" style={{ justifyContent: 'flex-start' }}>{t('add_news')}</button>
              <button className="btn btn-outline" style={{ justifyContent: 'flex-start' }}>{t('set_lineup')}</button>
              <button className="btn btn-outline" style={{ justifyContent: 'flex-start' }}>{t('manage_live')}</button>
            </div>
          </div>
          <div className="card">
            <div className="card-header">{t('pending_teams')}</div>
            <div className="card-body">
              {pending.teams > 0 ? (
                <p style={{ color: 'var(--gold)' }}>{pending.teams} teams awaiting approval</p>
              ) : (
                <p style={{ color: 'var(--text2)' }}>No pending teams</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}