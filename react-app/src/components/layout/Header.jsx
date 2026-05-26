import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export default function Header() {
  const { t, i18n } = useTranslation();
  const { user, logout, isAuthenticated } = useAuth();
  const [sports, setSports] = useState([]);
  const [liveMatches, setLiveMatches] = useState([]);

  useEffect(() => {
    api.get('/sports').then(r => setSports(r.data));
    api.get('/fixtures?status=live').then(r => setLiveMatches(r.data));
  }, []);

  const changeLang = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('rnsp-lang', lang);
  };

  const currentLang = i18n.language;

  return (
    <header className="header">
      {liveMatches.length > 0 && (
        <div className="ticker">
          <div className="ticker-inner">
            {[...liveMatches, ...liveMatches].map((m, i) => (
              <span key={i} className="ticker-item">
                <span className="live-dot" />{m.home_team} {m.home_score} – {m.away_score} {m.away_team}
              </span>
            ))}
          </div>
        </div>
      )}
      <div className="container">
        <div className="header-inner">
          <Link to="/" className="header-logo">
            <svg width="32" height="32" viewBox="0 0 32 32"><circle cx="16" cy="16" r="14" fill="#DC2626"/><path d="M10 20 L16 12 L22 20 Z" fill="white"/></svg>
            RNSP
          </Link>
          <nav className="header-nav">
            <Link to="/">{t('home')}</Link>
            <Link to="/sports">{t('sports')}</Link>
            <Link to="/leagues">{t('leagues')}</Link>
            <Link to="/fixtures">{t('fixtures')}</Link>
            <Link to="/results">{t('results')}</Link>
            <Link to="/news">{t('news')}</Link>
          </nav>
          <div className="header-actions">
            <div className="lang-switch">
              {['en', 'fr', 'rw', 'sw'].map(l => (
                <button key={l} className={`lang-btn ${currentLang === l ? 'active' : ''}`} onClick={() => changeLang(l)}>{l.toUpperCase()}</button>
              ))}
            </div>
            <button className="theme-toggle" onClick={() => document.documentElement.classList.toggle('dark')}>🌓</button>
            {isAuthenticated ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                {user?.role === 'superadmin' && <Link to="/admin" className="btn btn-primary">{t('admin_panel')}</Link>}
                <button className="btn btn-outline" onClick={logout}>{t('logout')}</button>
              </div>
            ) : (
              <Link to="/login" className="btn btn-primary">{t('login')}</Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}