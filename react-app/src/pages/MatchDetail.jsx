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
              <div className="match-score-big">{match.home_score ?? '—'} – {match.away_score ?? '—'}</div>
              <div style={{ marginTop: '.5rem' }}>
                {match.status === 'live' && <span className="badge badge-red">🔴 {t('live_now')}</span>}
                {match.status === 'scheduled' && <span className="badge badge-blue">{t('scheduled')}</span>}
                {match.status === 'completed' && <span className="badge badge-green">{t('completed')}</span>}
              </div>
            </div>
            <div className="match-team">
              <img src={match.away_logo ? `/uploads/logos/${match.away_logo}` : ''} alt={match.away_team} />
              <div className="match-team-name">{match.away_team}</div>
            </div>
          </div>
          <div style={{ marginTop: '1.5rem', opacity: 0.8, fontSize: '.9rem' }}>
            <div>{match.league_name} · {match.venue}</div>
            <div>{new Date(match.match_date).toLocaleString()}</div>
            {match.referee && <div>Referee: {match.referee}</div>}
          </div>
        </div>
      </div>

      <section className="section">
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <div className="card">
              <div className="card-header">{t('match_timeline')}</div>
              <div className="card-body">
                {match.events?.length > 0 ? match.events.map(ev => (
                  <div key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '.75rem 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ fontFamily: 'var(--fh)', fontWeight: 700, color: 'var(--red)', minWidth: 40 }}>{ev.minute}'</span>
                    <span style={{ fontSize: '1.2rem' }}>
                      {ev.event_type === 'goal' && '⚽'}
                      {ev.event_type === 'yellow_card' && '🟨'}
                      {ev.event_type === 'red_card' && '🟥'}
                      {ev.event_type === 'substitution' && '🔄'}
                    </span>
                    <div>
                      <div style={{ fontWeight: 600 }}>{ev.player_name}</div>
                      {ev.description && <div style={{ fontSize: '.8rem', color: 'var(--text2)' }}>{ev.description}</div>}
                    </div>
                  </div>
                )) : <p style={{ color: 'var(--text2)' }}>{t('waiting_for_events')}</p>}
              </div>
            </div>

            <div className="card">
              <div className="card-header">{t('lineups')}</div>
              <div className="card-body">
                {match.lineups?.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <h4 style={{ marginBottom: '.75rem' }}>{match.home_team}</h4>
                      {match.lineups.filter(l => l.team_id == match.home_team_id).map(l => (
                        <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.4rem 0', borderBottom: '1px solid var(--border)' }}>
                          <span style={{ fontWeight: 700, minWidth: 24 }}>{l.jersey_no}</span>
                          <span>{l.player_name}</span>
                          {l.is_captain && <span style={{ fontSize: '.7rem' }}>C</span>}
                        </div>
                      ))}
                    </div>
                    <div>
                      <h4 style={{ marginBottom: '.75rem' }}>{match.away_team}</h4>
                      {match.lineups.filter(l => l.team_id == match.away_team_id).map(l => (
                        <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.4rem 0', borderBottom: '1px solid var(--border)' }}>
                          <span style={{ fontWeight: 700, minWidth: 24 }}>{l.jersey_no}</span>
                          <span>{l.player_name}</span>
                          {l.is_captain && <span style={{ fontSize: '.7rem' }}>C</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : <p style={{ color: 'var(--text2)' }}>No lineups available</p>}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}