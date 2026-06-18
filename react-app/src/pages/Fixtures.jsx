import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/client';

export default function Fixtures() {
  const { t } = useTranslation();
  const [fixtures, setFixtures] = useState([]);
  const [sports, setSports] = useState([]);
  const [filterSport, setFilterSport] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filterSport) params.set('sport_id', filterSport);
    params.set('status', 'scheduled');

    Promise.all([
      api.get(`/fixtures?${params.toString()}`),
      api.get('/sports')
    ]).then(([f, s]) => {
      setFixtures(f.data);
      setSports(s.data);
      setLoading(false);
    });
  }, [filterSport]);

  if (loading) return <div className="spinner" />;

  return (
    <section className="section">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">{t('fixtures')}</h2>
          <select className="form-input" style={{ width: 'auto' }} value={filterSport} onChange={e => setFilterSport(e.target.value)}>
            <option value="">{t('all_sports')}</option>
            {sports.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
                <span className="badge badge-blue">{t('scheduled')}</span>
                <span className="fixture-date">{new Date(f.match_date).toLocaleDateString()}</span>
                <span>{f.league_name}</span>
                <span>{f.venue}</span>
              </div>
            </Link>
          ))}
          {fixtures.length === 0 && <p style={{ textAlign: 'center', color: 'var(--text2)' }}>{t('no_results_yet')}</p>}
        </div>
      </div>
    </section>
  );
}