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