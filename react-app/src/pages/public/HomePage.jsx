import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Play, Trophy, Users, Star, Activity, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getFixtures } from '../../api/endpoints/fixtures';
import { getNews } from '../../api/endpoints/news';
import ResponsiveWrapper from '../../components/shared/ResponsiveWrapper';
import FixtureCard from '../../components/shared/FixtureCard';
import NewsCard from '../../components/shared/NewsCard';
import Skeleton from '../../components/shared/Skeleton';
import AdBanner from '../../components/shared/AdBanner';
import Seo from '../../components/shared/Seo';

const HomePage = () => {
  const { t } = useTranslation();
  
  const { data: fixtures, isLoading: fixturesLoading } = useQuery({
    queryKey: ['home-fixtures-hero'],
    queryFn: () => getFixtures({ limit: 6 }),
  });

  const { data: news, isLoading: newsLoading } = useQuery({
    queryKey: ['home-news-home'],
    queryFn: () => getNews({ limit: 3, featured: true }),
  });

  const liveMatches = fixtures?.data?.filter(f => f.status === 'LIVE') || [];
  const upcomingMatches = fixtures?.data?.filter(f => f.status === 'SCHEDULED') || [];
  const heroMatches = [...liveMatches, ...upcomingMatches].slice(0, 1);

  return (
    <div className="space-y-0">
      <Seo title="Home" description="Experience the heartbeat of Rwandan sports." />
      {/* 1. AD SPACE BELOW NAV */}
      <AdBanner position="HOME_BANNER" />

      {/* 2. HERO SECTION */}
      <section className="relative bg-surface-dark overflow-hidden py-16 sm:py-24 lg:py-32">
        <div className="absolute inset-0 z-0">
          {/* Branded gradient wash */}
          <div className="absolute inset-0 bg-gradient-to-br from-surface-dark via-surface-dark to-surface-dark2" />
          {/* Red glow + Rwanda-blue accent orbs */}
          <div className="absolute -top-40 -right-32 w-[36rem] h-[36rem] rounded-full bg-red/20 blur-[120px]" />
          <div className="absolute -bottom-40 -left-24 w-[32rem] h-[32rem] rounded-full bg-rwanda-blue/10 blur-[120px]" />
          {/* Subtle grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{