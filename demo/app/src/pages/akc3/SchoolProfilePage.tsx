import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { School, MapPin, Users, Trophy, ChevronLeft } from 'lucide-react';
import { getSchool, getAkcFixtures } from '../../api/endpoints/amashuri';
import { useEnumLabel } from '../../i18n/enums';
import Seo from '../../components/shared/Seo';
import AmashuriFixtureCard from '../../components/amashuri/AmashuriFixtureCard';
import ClubCrest from '../../components/ui/ClubCrest';
import { Badge, EmptyState, ErrorState, SectionHeading, Skeleton, SkeletonList } from '../../components/ui';

const TeamCard = ({ team, t, enumLabel }: { team: any; t: any; enumLabel: any }) => (
  <div className="flex flex-col gap-4 rounded-card border border-hairline bg-surface p-4">
    <div className="flex items-start justify-between gap-2">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-surface-2 text-tertiary">
        <Trophy size={18} aria-hidden="true" />
      </span>
      <Badge>{enumLabel('age_category', team.ageCategory)}</Badge>
    </div>
    <div>
      <h3 className="font-display text-base font-semibold text-primary">
        {enumLabel('gender', team.gender)} {t('amashuri.school_profile.team')}
      </h3>
      <p className="mt-0.5 text-xs text-tertiary">
        {t('amashuri.school_profile.coach')}: {team.coachName || t('common.tbd')}
      </p>
    </div>
    <div className="flex items-center gap-2 border-t border-hairline pt-3 text-xs text-secondary">
      <Users size={14} className="text-tertiary" aria-hidden="true" />
      <span>{team.players?.length || 0} {t('amashuri.school_profile.players')}</span>
    </div>
  </div>
);

const SchoolProfilePage = () => {
  const { t } = useTranslation();
  const enumLabel = useEnumLabel();
  const { id } = useParams();

  const { data: school, isLoading, isError, refetch } = useQuery({
    queryKey: ['amashuri-school-profile', id],
    queryFn: () => getSchool(id),
    enabled: !!id,
    retry: false,
  });

  const { data: fixtures, isLoading: fixturesLoading, isError: fixturesError, refetch: refetchFixtures } = useQuery({
    queryKey: ['amashuri-school-fixtures', id],
    queryFn: () => getAkcFixtures({ schoolId: id }),
    enabled: !!id,
    retry: false,
  });

  const s = school?.data;
  const teams = s?.teams || [];
  const matches = fixtures?.data || [];
  const ready = !isLoading && !isError && !!s;

  return (
    <div className="min-h-screen bg-page">
      <Seo
        title={t('seo.school_profile_title', { school: s?.name || t('amashuri.school') })}
        description={t('seo.school_profile_desc', { school: s?.name || t('amashuri.school') })}
      />

      <div className="mx-auto max-w-3xl px-4 pt-4 lg:max-w-6xl lg:px-6 lg:pt-6">
        <Link
          to="/amashuri/schools"
          className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-secondary transition-colors duration-150 ease-standard hover:text-brand-text"
        >
          <ChevronLeft size={14} aria-hidden="true" /> {t('amashuri.school_profile.back')}
        </Link>

        {isLoading ? (
          <div className="flex items-center gap-4 pb-4">
            <Skeleton circle className="h-16 w-16" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        ) : isError ? (
          <ErrorState title={t('amashuri.school_profile.error_title')} hint={t('amashuri.school_profile.error_hint')} onRetry={refetch} className="py-10" />
        ) : !s ? (
          <EmptyState icon={School} title={t('amashuri.school_profile.not_found')} hint={t('amashuri.school_profile.not_found_hint')} className="py-10" />
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-4 pb-4">
              <ClubCrest team={s} size="lg" />
              <div className="min-w-0">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <Badge>{enumLabel('school_category', s.category)}</Badge>
                  {s.code && <span className="text-xs text-tertiary">{t('amashuri.directory.code', { code: s.code })}</span>}
                </div>
                <h1 className="font-display text-xl font-extrabold tracking-[-0.02em] text-primary sm:text-3xl">{s.name}</h1>
                <p className="mt-1 flex items-center gap-1 text-xs text-tertiary">
                  <MapPin size={12} aria-hidden="true" /> {s.sector || t('sporthub.rwanda')}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-hairline pb-4 pt-4">
              <span className="flex items-center gap-1.5 text-sm">
                <Trophy size={14} className="text-tertiary" aria-hidden="true" />
                <span className="font-semibold tabular-nums text-primary">{teams.length}</span>
                <span className="text-tertiary">{t('amashuri.school_profile.active_teams')}</span>
              </span>
              <span className="flex items-center gap-1.5 text-sm">
                <Users size={14} className="text-tertiary" aria-hidden="true" />
                <span className="font-semibold tabular-nums text-primary">{matches.length}</span>
                <span className="text-tertiary">{t('amashuri.school_profile.fixtures')}</span>
              </span>
            </div>
          </>
        )}
      </div>

      {ready && (
        <div className="mx-auto max-w-3xl px-4 pb-10 lg:max-w-6xl lg:px-6 lg:pb-14">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <section className="lg:col-span-2">
              <SectionHeading title={t('amashuri.school_profile.teams_title')} accent={t('amashuri.school_profile.teams_accent')} className="mb-4" />
              {teams.length > 0 ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {teams.map((team: any) => <TeamCard key={team.id} team={team} t={t} enumLabel={enumLabel} />)}
                </div>
              ) : (
                <EmptyState icon={Users} title={t('amashuri.school_profile.no_teams')} hint={t('amashuri.school_profile.no_teams_hint')} />
              )}
            </section>

            <section>
              <SectionHeading title={t('amashuri.school_profile.match_center')} accent={t('amashuri.school_profile.match_center_accent')} className="mb-4" />
              {fixturesLoading ? (
                <div className="grid grid-cols-1 gap-3">
                  <SkeletonList count={2}>
                    <AmashuriFixtureCard.Skeleton />
                  </SkeletonList>
                </div>
              ) : fixturesError ? (
                <ErrorState title={t('amashuri.schedule.error_title')} hint={t('amashuri.schedule.error_hint')} onRetry={refetchFixtures} />
              ) : matches.length > 0 ? (
                <div className="grid grid-cols-1 gap-3">
                  {matches.slice(0, 4).map((f: any) => <AmashuriFixtureCard key={f.id} fixture={f} />)}
                </div>
              ) : (
                <EmptyState title={t('amashuri.school_profile.no_matches')} hint={t('amashuri.school_profile.no_matches_hint')} className="py-10" />
              )}
            </section>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchoolProfilePage;
