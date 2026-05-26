import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/client';

export default function Sports() {
  const { t } = useTranslation();
  const [sports, setSports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/sports').then(r => { setSports(r.data); setLoading(false); });
  }, []);

  if (loading) return <div className="spinner" />;

  return (
    <section className="section">
      <div className="container">
        <h2 className="section-title" style={{ marginBottom: '1.5rem' }}>{t('all_sports')}</h2>
        <div className="grid-3">
          {sports.map(s => (
            <Link key={s.id} to={`/sports/${s.slug}`} className="sport-card">
              <div className="sport-icon">{s.icon || '⚽'}</div>
              <div>
                <div className="sport-name">{s.name}</div>
                <div className="sport-count">{s.league_count || 0} leagues · {s.team_count || 0} teams</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}