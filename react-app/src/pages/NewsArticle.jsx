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