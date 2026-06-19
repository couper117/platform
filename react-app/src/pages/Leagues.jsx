import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/client';

export default function Leagues() {
  const { t } = useTranslation();
  const [leagues, setLeagues] = useState([]);
  const [sports, setSports] = useState([]);
  const [filterSport, setFilterSport] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/leagues'),
      api.get('/sports')
    ]).then(([l, s]) => {
      setLeagues(l.data);
      setSports(s.data);
      setLoading(false);
    });
  }, []);

  const filtered = filterSport ? leagues.filter(l => l.sport_id == filterSport) : leagues;

  if (loading) return <div className="spinner" />;

  return (
    <section className="section">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">{t('all_leagues')}</h2>
          <select className="form-input" style={{ width: 'auto' }} value={filterSport} onChange={e => setFilterSport(e.target.value)}>
            <option value="">{t('all_sports')}</option>
            {sports.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="grid-3">
          {filtered.map(l => (
            <Link key={l.id} to={`/leagues/${l.slug}`} className="league-card">
              <div className="league-cover" />
              <div className="league-body">
                <div className="league-name">{l.name}</div>
                <div className="league-meta">
                  <span className="league-tag">{l.sport_name}</span>
                  <span className="league-tag">{l.season}</span>
                  <span className="league-tag">{l.gender}</span>
                  <span className={`badge badge-${l.status === 'active' ? 'green' : 'gray'}`}>{l.status}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}