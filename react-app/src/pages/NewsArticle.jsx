import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/client';

export default function NewsArticle() {
  const { slug } = useParams();
  const { t } = useTranslation();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/news/${slug}`).then(r => { setArticle(r.data); setLoading(false); });
  }, [slug]);

  if (loading) return <div className="spinner" />;
  if (!article) return <div className="container" style={{ padding: '3rem' }}>Article not found</div>;

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 800 }}>
        <Link to="/news" style={{ color: 'var(--text2)', marginBottom: '1rem', display: 'inline-block' }}>← {t('news')}</Link>
        <div style={{ background: 'var(--surface)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ height: 300, background: '#ddd' }} />
          <div style={{ padding: '2rem' }}>
            <div style={{ color: 'var(--red)', fontWeight: 700, fontSize: '.85rem', textTransform: 'uppercase' }}>{article.category}</div>
            <h1 style={{ fontFamily: 'var(--fh)', fontSize: '2.5rem', fontWeight: 800, margin: '.75rem 0' }}>{article.title}</h1>
            <div style={{ color: 'var(--text2)', fontSize: '.85rem', marginBottom: '1.5rem' }}>
              By {article.author_name} · {new Date(article.created_at).toLocaleDateString()} · {article.views} views
            </div>
            <div style={{ lineHeight: 1.8, fontSize: '1.05rem' }}>{article.body}</div>
          </div>
        </div>
      </div>
    </section>
  );
}