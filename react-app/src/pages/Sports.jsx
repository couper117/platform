import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/client';

export default function Sports() {
  const { t } = useTranslation();
  const [sports, setSports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/sports').then(r => { setSports(r.data); setLoading(false); });
  }, []);

  if (loading) return <div className="spinner" />;

  return (
    <section className="section">