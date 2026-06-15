import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { School, Users, Trophy, MapPin, GraduationCap, ChevronRight, Layers } from 'lucide-react';
import { getSchools, getChampionships } from '../../api/endpoints/amashuri';
import ResponsiveWrapper from '../../components/shared/ResponsiveWrapper';
import Skeleton from '../../components/shared/Skeleton';
import Seo from '../../components/shared/Seo';
import AmashuriHero from '../../components/amashuri/AmashuriHero';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import SectionHeading from '../../components/ui/SectionHeading';
import EmptyState from '../../components/ui/EmptyState';

const LEVEL_KEYS = ['cell', 'sector', 'district', 'province', 'national'];

const AkcHome = () => {
  const { t } = useTranslation();
  const { data: schools, isLoading: schoolsLoading } = useQuery({
    queryKey: ['amashuri-schools-summary'],
    queryFn: () => getSchools(),
    retry: false,
  });
  const { data: comps } = useQuery({
    queryKey: ['amashuri-comps-summary'],
    queryFn: () => getChampionships(),
    retry: false,
  });

  const schoolList = schools?.data || [];
  const championships = comps?.data || [];

  // Real, honest counts derived from live data (no hardcoded numbers).
  const stats = [
    { label: t('amashuri.schools'), value: schoolList.length, icon: <School size={16} /> },
    { label: t('amashuri.championships'), value: championships.length, icon: <Trophy size={16} /> },
    { label: t('amashuri.categories'), value: 3, icon: <Layers size={16} /> },
  ];

  return (
    <div className="bg-surface-2 dark:bg-surface-dark min-h-screen pb-24">
      <Seo title="Amashuri Games — Rwanda Inter-School Sports" description="The home of every Rwandan school championship, from the Kagame Cup to district and provincial leagues." />

      <AmashuriHero
        title="Amashuri"
        accent="Games"