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

        {tab === 'standings' && (
          <div className="card">
            <table className="data-table">
              <thead>
                <tr><th>#</th><th>Team</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GF</th><th>GA</th><th>GD</th><th>Pts</th></tr>
              </thead>
              <tbody>
                {standings.map(s => (
                  <tr key={s.team_id}>
                    <td>{s.rank}</td>
                    <td style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                      {s.logo && <img src={`/uploads/logos/${s.logo}`} style={{ width: 24, height: 24, borderRadius: 4 }} alt="" />}
                      {s.name}
                    </td>
                    <td>{s.gp}</td><td>{s.gw}</td><td>{s.gd}</td><td>{s.gl}</td>
                    <td>{s.gf}</td><td>{s.ga}</td><td>{s.gd}</td><td><strong>{s.pts}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'fixtures' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {fixtures.map(f => (
              <Link key={f.id} to={`/fixtures/${f.id}`} className="fixture-card">
                <div className="fixture-teams">
                  <span className="fixture-team">{f.home_team}</span>
                  <span className="fixture-score">{f.home_score ?? '—'} : {f.away_score ?? '—'}</span>
                  <span className="fixture-team">{f.away_team}</span>
                </div>
                <div className="fixture-meta">
                  <span className={`badge badge-${f.status === 'live' ? 'red' : 'blue'}`}>{t(f.status)}</span>
                  <span>{new Date(f.match_date).toLocaleDateString()}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}