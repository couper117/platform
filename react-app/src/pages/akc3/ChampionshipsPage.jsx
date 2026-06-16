import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Trophy, Calendar, MapPin, Layers, ChevronRight, Medal } from 'lucide-react';
import { format } from 'date-fns';
import { getChampionships, getSchools } from '../../api/endpoints/amashuri';
import ResponsiveWrapper from '../../components/shared/ResponsiveWrapper';
import Skeleton from '../../components/shared/Skeleton';
import Seo from '../../components/shared/Seo';
import AmashuriHero from '../../components/amashuri/AmashuriHero';
import AmashuriStats from '../../components/amashuri/AmashuriStats';
import SectionHeading from '../../components/ui/SectionHeading';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';

const statusTone = (status) => {
  switch (status) {
    case 'ONGOING': return 'green';
    case 'COMPLETED': return 'blue';
    case 'CANCELLED': return 'red';
    default: return 'gold';
  }
};

const ChampionshipCard = ({ c, t }) => (
  <Card hover className="p-6 relative overflow-hidden">
    <div className="absolute top-0 right-0 w-28 h-28 bg-rwanda-blue/5 -mr-12 -mt-12 rounded-full" />
    <div className="relative z-10 space-y-4">
      <div className="flex items-start justify-between">
        <span className="p-3 bg-rwanda-blue/10 rounded-2xl text-rwanda-blue"><Trophy size={24} /></span>
        <Badge tone={statusTone(c.status)}>{(c.status || 'UPCOMING').replace(/_/g, ' ')}</Badge>
      </div>
      <div>
        <h3 className="font-display text-2xl uppercase tracking-tight leading-tight">{c.name}</h3>
        {c.edition && <p className="text-[10px] uppercase tracking-widest opacity-40 mt-1">{c.edition}</p>}
      </div>
      <div className="flex flex-wrap gap-4 text-[10px] font-bold uppercase tracking-widest opacity-50">
        <span className="flex items-center gap-1.5"><Layers size={12} className="text-rwanda-blue" />{c.level || 'National'}</span>
        {c.venue && <span className="flex items-center gap-1.5"><MapPin size={12} className="text-rwanda-blue" />{c.venue}</span>}
        {c.startDate && <span className="flex items-center gap-1.5"><Calendar size={12} className="text-rwanda-blue" />{format(new Date(c.startDate), 'dd MMM yyyy')}</span>}
      </div>
      <div className="flex items-center justify-between pt-4 border-t border-surface-3 dark:border-white/5 text-[10px] uppercase font-bold tracking-widest">
        <span className="opacity-50">{t('amashuri.championships_page.fixtures_teams', { fixtures: c._count?.fixtures ?? 0, teams: c._count?.standings ?? 0 })}</span>
        <Link to="/amashuri/standings" className="flex items-center gap-1 text-rwanda-blue hover:underline">
          {t('amashuri.championships_page.standings')} <ChevronRight size={14} />
        </Link>
      </div>
    </div>
  </Card>
);

const ChampionshipsPage = () => {
  const { t } = useTranslation();
  const { data: comps, isLoading } = useQuery({
    queryKey: ['amashuri-championships'],
    queryFn: () => getChampionships(),
    retry: false,
  });
  const { data: schools } = useQuery({
    queryKey: ['amashuri-schools-all'],
    queryFn: () => getSchools(),
    retry: false,
  });

  const championships = comps?.data || [];

  return (
    <div className="bg-surface-2 dark:bg-surface-dark min-h-screen pb-24">
      <Seo title="School Championships — Amashuri Games" description="Every Rwandan inter-school championship in one place, including the Kagame Cup." />

      <AmashuriHero
        title={t('amashuri.championships_page.title')}
        accent={t('amashuri.championships_page.accent')}
        subtitle={t('amashuri.championships_page.subtitle')}
      />

      <ResponsiveWrapper className="mt-16 space-y-20">
        {/* Championships list */}
        <section>
          <SectionHeading eyebrow={t('amashuri.championships_page.umbrella')} title={t('amashuri.championships_page.all')} accent={t('amashuri.championships_page.all_accent')} />
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"><Skeleton type="card" count={3} /></div>
          ) : championships.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {championships.map((c) => <ChampionshipCard key={c.id} c={c} t={t} />)}
            </div>
          ) : (
            <EmptyState icon={Medal} title={t('amashuri.championships_page.none')} hint={t('amashuri.championships_page.none_hint')} />
          )}
        </section>

        {/* Stats */}
        <section>
          <SectionHeading eyebrow={t('amashuri.championships_page.insights')} title={t('amashuri.championships_page.numbers')} accent={t('amashuri.championships_page.numbers_accent')} />
          <AmashuriStats schools={schools?.data || []} championships={championships} />
        </section>
      </ResponsiveWrapper>
    </div>
  );
};

export default ChampionshipsPage;
