import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, Users, UserCheck } from 'lucide-react';
import { getAkcTeam } from '../../api/endpoints/amashuri';
import { useEnumLabel } from '../../i18n/enums';
import { schoolCover } from '../../config/amashuriMedia';
import Seo from '../../components/shared/Seo';
import SportIcon from '../../components/shared/SportIcon';
import Avatar from '../../components/ui/Avatar';
import ClubCrest from '../../components/ui/ClubCrest';
import { EmptyState, ErrorState, Skeleton } from '../../components/ui';

/**
 * A school team: /amashuri/teams/:id.
 *
 * WHY IT EXISTS. A school's teams were four static cards on the school page —
 * "Male Team · 16 players" — and that was the end of the road. The squad was
 * already in the payload; there was simply nowhere to show it. The chain is
 * school → team → athlete now, the same depth the club side has had since
 * /teams/:id grew its tabs.
 *
 * THE HEADER IS THE SCHOOL'S PHOTOGRAPH, not a flat panel, because a team belongs
 * to a school and the school is the thing a reader recognises. Same cover the
 * directory card uses, so the two agree.
 */

const PlayerRow = ({ p, t }: { p: any; t: any }) => (
  <Link
    to={`/amashuri/athletes/${p.id}`}
    className="flex min-h-tap items-center gap-3 border-b border-hairline px-3 py-2.5 transition-colors duration-150 ease-standard last:border-0 hover:bg-surface-2"
  >
    <Avatar src={p.photo} name={p.fullName} size="md" />
    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-semibold text-primary">{p.fullName}</p>
      {p.position && <p className="truncate text-xs text-tertiary">{p.position}</p>}
    </div>
    {/* Document verification is the one status a school coordinator cares about
        at a glance, and it is already in the record. */}
    {p.docVerified && (
      <UserCheck size={14} className="shrink-0 text-brand-text" aria-label={t('amashuri.team_page.verified')} />
    )}
    {typeof p.jersey === 'number' && (
      <span className="shrink-0 text-sm tabular-nums text-secondary">
        {t('team.jersey_no', { number: p.jersey })}
      </span>
    )}
    <ChevronRight size={16} className="shrink-0 text-disabled" aria-hidden="true" />
  </Link>
);

const AmashuriTeamPage = () => {
  const { t } = useTranslation();
  const enumLabel = useEnumLabel();
  const { id } = useParams();

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ['akc-team', String(id)],
    queryFn: () => getAkcTeam(id),
    enabled: !!id,
  });

  const team = data?.data ?? data ?? null;

  if (isPending) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-4 lg:max-w-5xl lg:px-6 lg:py-6">
        <Skeleton className="h-40 rounded-card" />
        <Skeleton className="h-64 rounded-card" />
      </div>
    );
  }

  if (isError || !team) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 lg:px-6">
        <ErrorState title={t('amashuri.team_page.not_found')} hint={t('amashuri.team_page.not_found_hint')} onRetry={refetch} />
      </div>
    );
  }

  const players = team.players || [];
  const verified = players.filter((p: any) => p.docVerified).length;
  const title = `${enumLabel('gender', team.gender)} ${t('amashuri.school_profile.team')}`;

  return (
    <div className="min-h-screen bg-page">
      <Seo title={`${title} — ${team.school?.name}`} description={t('amashuri.team_page.seo', { school: team.school?.name })} />

      {/* ─── the school ─── */}
      <div className="relative h-[180px] overflow-hidden bg-[#0F0F0F] sm:h-[220px]">
        <img
          src={schoolCover(team.school)}
          alt=""
          loading="eager"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/15" />
        <div className="relative mx-auto flex h-full max-w-3xl flex-col justify-end px-4 pb-4 lg:max-w-5xl lg:px-6">
          <Link
            to={`/amashuri/schools/${team.school?.id}`}
            className="mb-auto mt-4 inline-flex w-fit items-center gap-1 text-sm font-semibold text-white/80 transition-colors duration-150 ease-standard hover:text-white"
          >
            <ChevronLeft size={16} aria-hidden="true" />
            {team.school?.name}
          </Link>
          <div className="flex items-end gap-3">
            <ClubCrest team={team.school} size="lg" />
            <div className="min-w-0">
              <h1 className="font-display text-xl font-extrabold tracking-[-0.02em] text-white sm:text-3xl">
                {title}
              </h1>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-white/70">
                {team.sport?.slug && <SportIcon slug={team.sport.slug} size={13} className="shrink-0" />}
                <span>{team.sport?.name}</span>
                <span aria-hidden="true">·</span>
                <span>{enumLabel('age_category', team.ageCategory)}</span>
                <span aria-hidden="true">·</span>
                <span>{enumLabel('competition_level', team.level) || team.level}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl space-y-4 px-4 py-4 lg:max-w-5xl lg:px-6 lg:py-6">
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-card border border-hairline bg-surface p-3 text-center">
            <p className="font-display text-2xl font-extrabold tabular-nums text-primary">{players.length}</p>
            <p className="mt-0.5 text-[11px] uppercase tracking-wide text-tertiary">{t('amashuri.team_page.squad')}</p>
          </div>
          <div className="rounded-card border border-hairline bg-surface p-3 text-center">
            <p className="font-display text-2xl font-extrabold tabular-nums text-primary">{verified}</p>
            <p className="mt-0.5 text-[11px] uppercase tracking-wide text-tertiary">{t('amashuri.team_page.verified')}</p>
          </div>
          <div className="flex flex-col justify-center rounded-card border border-hairline bg-surface p-3 text-center">
            {/* NOT `truncate`. A coach's name is the content of this tile, and
                "Jean Damascene" became "Jean Da…" beside two two-digit numbers.
                It wraps and steps down a size instead. */}
            <p className="font-display text-sm font-bold leading-tight text-primary">{team.coachName || t('common.tbd')}</p>
            <p className="mt-0.5 text-[11px] uppercase tracking-wide text-tertiary">{t('amashuri.school_profile.coach')}</p>
          </div>
        </div>

        <section className="space-y-3">
          {/* No count badge beside this heading: the SQUAD tile above already
              carries the number, and `school_profile.players` is a bare noun with
              no plural form, so the badge rendered as the word "Players" alone. */}
          <h2 className="font-display text-lg font-semibold text-primary">{t('amashuri.team_page.squad')}</h2>
          {players.length === 0 ? (
            <EmptyState icon={Users} title={t('amashuri.team_page.no_players')} hint={t('amashuri.team_page.no_players_hint')} />
          ) : (
            <div className="overflow-hidden rounded-card border border-hairline bg-surface">
              {players.map((p: any) => <PlayerRow key={p.id} p={p} t={t} />)}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default AmashuriTeamPage;
