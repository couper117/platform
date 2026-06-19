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