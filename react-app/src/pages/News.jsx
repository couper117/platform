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