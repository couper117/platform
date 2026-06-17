import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { School, MapPin, Users, Trophy, ChevronLeft } from 'lucide-react';
import ResponsiveWrapper from '../../components/shared/ResponsiveWrapper';
import Skeleton from '../../components/shared/Skeleton';
import Seo from '../../components/shared/Seo';
import AmashuriFixtureCard from '../../components/amashuri/AmashuriFixtureCard';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import { getSchool, getAkcFixtures } from '../../api/endpoints/amashuri';

const SchoolProfilePage = () => {
  const { t } = useTranslation();
  const { id } = useParams();

  const { data: school, isLoading } = useQuery({
    queryKey: ['amashuri-school-profile', id],
    queryFn: () => getSchool(id),
    retry: false,
  });

  const { data: fixtures } = useQuery({
    queryKey: ['amashuri-school-fixtures', id],
    queryFn: () => getAkcFixtures({ schoolId: id }),
    enabled: !!id,
    retry: false,
  });

  if (isLoading) return <div className="py-20"><ResponsiveWrapper><Skeleton type="card" /></ResponsiveWrapper></div>;

  const s = school?.data;
  const teams = s?.teams || [];
  const matches = fixtures?.data || [];

  return (
    <div className="bg-surface-2 dark:bg-surface-dark min-h-screen pb-24">
      <Seo title={`${s?.name || 'School'} — Amashuri Games`} description={`${s?.name} teams, fixtures and results in Rwanda's inter-school championships.`} />

      {/* Header */}
      <section className="bg-rwanda-blue py-16 sm:py-20 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-rwanda-blue via-rwanda-blue to-[#007bb0]" />