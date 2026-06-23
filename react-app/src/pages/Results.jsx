import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/client';

export default function Results() {
  const { t } = useTranslation();
  const [fixtures, setFixtures] = useState([]);
  const [sports, setSports] = useState([]);
  const [filterSport, setFilterSport] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams({ status: 'completed', limit: 40 });
    if (filterSport) params.set('sport_id', filterSport);

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