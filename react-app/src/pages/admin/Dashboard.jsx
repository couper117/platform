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