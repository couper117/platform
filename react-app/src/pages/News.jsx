import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/client';

export default function News() {
  const { t } = useTranslation();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/news').then(r => { setArticles(r.data); setLoading(false); });
  }, []);

  if (loading) return <div className="spinner" />;

  return (
    <section className="section">
      <div className="container">
        <h2 className="section-title" style={{ marginBottom: '1.5rem' }}>{t('news')}</h2>
        <div className="grid-3">
          {articles.map(n => (
            <Link key={n.id} to={`/news/${n.slug}`} className="news-card">
              <div className="news-img" />
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
  );
}