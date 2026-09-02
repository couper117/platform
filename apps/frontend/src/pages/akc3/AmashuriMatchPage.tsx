import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { getAkcFixture } from '../../api/endpoints/amashuri';
import { useEnumLabel } from '../../i18n/enums';
import { useDateFormat } from '../../i18n/dateLocale';
import MatchScoreboard from '../../components/match/MatchScoreboard';
import MatchComments from '../../components/match/MatchComments';
import MatchEventTimeline from '../../components/shared/MatchEventTimeline';
import PageAd from '../../components/shared/PageAd';
import Seo from '../../components/shared/Seo';
import ClubCrest from '../../components/ui/ClubCrest';
import ErrorState from '../../components/ui/ErrorState';
import Skeleton from '../../components/ui/Skeleton';

/**
 * A school match: /amashuri/matches/:id.
 *
 * WHAT THIS REPLACED. The last pre-redesign screen in the public app. It opened
 * on a full-bleed saturated green-to-teal gradient — a palette the token system
 * removed everywhere else — set both school names in ALL CAPS display type that
 * wrapped to three lines each, and then had almost nothing to say: an empty
 * "MATCH SUMMARY" card and a four-row table, floating in half a screen of green.
 * It also carried its own `SchoolBadge`, `ScoreDigit` and `initials()` — a third
 * private implementation of the scoreboard every other match screen shares.
 *
 * IT IS THE NATIONAL MATCH PAGE NOW. Same MatchScoreboard, same timeline, same
 * comments, same tokens. A schools fixture is a fixture; the only real differences
 * are that a team is identified by its SCHOOL and that age group and gender
 * matter, and both of those are facts to print rather than reasons for a
 * separate design.
 *
 * THE ADAPTER IS THE WHOLE TRICK. `/akc3/fixtures/:id` returns `competition` where
 * a league fixture returns `league`, and its `homeTeam` is `{ id, school,
 * ageCategory, gender }` with the name one level down on the school. `asFixture`
 * maps the two into the shape MatchScoreboard already reads, so nothing had to be
 * generalised or forked to make it work.
 */

/** Reshapes a schools fixture into what the shared match components expect. */
const asFixture = (m: any) => {
  const side = (team: any) => (team ? {
    ...team,
    name: team.school?.name,
    shortName: team.school?.shortName,
    logo: team.school?.logo,
  } : null);
  return {
    ...m,
    league: m.competition,
    homeTeam: side(m.homeTeam),
    awayTeam: side(m.awayTeam),
    // THE SCHOOLS FEED SAYS `ONGOING` WHERE THE LEAGUE FEED SAYS `LIVE`, and
    // `matchState` only knows the league's word — so a schools match in progress
    // fell through to "upcoming" and the scoreboard printed VS instead of 1-1 on
    // a game that was being played. Translated here rather than taught to
    // matchState, because this is one endpoint's spelling, not a new state.
    status: String(m.status).toUpperCase() === 'ONGOING' ? 'LIVE' : m.status,
  };
};

/** A link through to one of the two school teams. */
const TeamLink = ({ team }: { team: any }) => {
  const { t } = useTranslation();
  const enumLabel = useEnumLabel();
  if (!team?.id) return null;
  return (
    <Link
      to={`/amashuri/teams/${team.id}`}
      className="group flex min-h-tap items-center gap-3 rounded-card border border-hairline bg-surface px-3 py-2.5 transition-colors duration-150 ease-standard hover:border-brand/40 hover:bg-surface-2"
    >
      <ClubCrest team={team.school} size="md" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-primary transition-colors duration-150 ease-standard group-hover:text-brand-text">
          {team.school?.name}
        </p>
        <p className="truncate text-xs text-tertiary">
          {enumLabel('gender', team.gender)} · {enumLabel('age_category', team.ageCategory)}
        </p>
      </div>
      <Users size={14} className="shrink-0 text-disabled" aria-hidden="true" />
      <ChevronRight size={16} className="shrink-0 text-disabled" aria-hidden="true" />
    </Link>
  );
};

const AmashuriMatchPage = () => {
  const { t } = useTranslation();
  const enumLabel = useEnumLabel();
  const df = useDateFormat();
  const { id } = useParams();

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ['akc-fixture', String(id)],
    queryFn: () => getAkcFixture(id),
    enabled: !!id,
  });

  const raw = data?.data ?? null;

  if (isPending) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-4 lg:max-w-6xl lg:px-6 lg:py-6">
        <Skeleton className="h-44 rounded-card" />
        <Skeleton className="h-32 rounded-card" />
        <Skeleton className="h-56 rounded-card" />
      </div>
    );
  }

  if (isError || !raw) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 lg:px-6">
        <ErrorState title={t('match.not_found')} hint={t('match.not_found_hint')} onRetry={refetch} />
      </div>
    );
  }

  const m = asFixture(raw);

  const infoRows: Array<[string, React.ReactNode]> = [
    [t('match.competition'), m.competition?.name],
    [t('match.stage'), enumLabel('stage', raw.stage) || raw.stage],
    [t('match.round'), raw.round],
    [t('amashuri.athlete.age_group'), enumLabel('age_category', raw.homeTeam?.ageCategory)],
    [t('match.status'), enumLabel('fixture_status', raw.status) || raw.status],
    [t('match.venue'), raw.venue],
  ].filter(([, v]) => v !== undefined && v !== null && v !== '') as Array<[string, React.ReactNode]>;

  return (
    <div className="min-h-screen bg-page">
      <Seo
        title={`${m.homeTeam?.name} ${t('match.versus')} ${m.awayTeam?.name}`}
        description={`${m.homeTeam?.name} vs ${m.awayTeam?.name} — ${m.competition?.name || ''}`.trim()}
      />

      <div className="mx-auto max-w-3xl px-4 pt-4 lg:max-w-6xl lg:px-6 lg:pt-6">
        <Link
          to="/amashuri/fixtures"
          className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-secondary transition-colors duration-150 ease-standard hover:text-brand-text"
        >
          <ChevronLeft size={14} aria-hidden="true" /> {t('match.back_to_schedule')}
        </Link>

        {/* `live` is the shape MatchScoreboard expects from useLiveMatch. There is
            no live socket on the schools feed, so it gets the fixture's own score
            and status and the scoreboard renders exactly as it does elsewhere. */}
        <MatchScoreboard
          fixture={m}
          live={{ status: m.status, homeScore: raw.homeScore, awayScore: raw.awayScore }}
          connected={false}
        />

        <div className="space-y-6 py-6">
          <section className="rounded-card border border-hairline bg-surface p-4 sm:p-6">
            <h2 className="font-display text-lg font-bold text-primary">{t('match.match_info')}</h2>
            <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 text-sm sm:grid-cols-3">
              {infoRows.map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs text-tertiary">{k}</dt>
                  <dd className="mt-0.5 font-medium text-primary">{v}</dd>
                </div>
              ))}
              {raw.matchDate && (
                <div>
                  <dt className="text-xs text-tertiary">{t('match.kick_off')}</dt>
                  <dd className="mt-0.5 font-medium text-primary">{df(raw.matchDate, 'd MMM yyyy · HH:mm')}</dd>
                </div>
              )}
            </dl>
          </section>

          {/* THE TEAMS ARE DESTINATIONS. The old page's only outbound link was a
              "view school" line in the info panel; the squads that actually play
              this fixture are two taps closer now. */}
          <section className="space-y-3">
            <h2 className="font-display text-lg font-bold text-primary">{t('amashuri.team_page.squad')}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <TeamLink team={raw.homeTeam} />
              <TeamLink team={raw.awayTeam} />
            </div>
          </section>

          <section>
            <h2 className="mb-3 font-display text-lg font-bold text-primary">{t('match.timeline')}</h2>
            {/* Owns its own empty state, so a fixture with no events reads as
                "nothing has happened yet" rather than as a blank panel. */}
            <MatchEventTimeline events={raw.events || []} homeTeamId={raw.homeTeamId} />
          </section>

          <MatchComments matchId={`amashuri-${id}`} />
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 pb-8 lg:max-w-6xl lg:px-6 lg:pb-12">
        <PageAd position="match" />
      </div>
    </div>
  );
};

export default AmashuriMatchPage;
