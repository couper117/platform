import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';
import { useSport } from './SportLayout';
import { getLeague } from '../../../api/endpoints/leagues';
import MatchTile from '../../../components/match/MatchTile';
import NewsCard from '../../../components/news/NewsCard';
import StandingsTable from '../../../components/match/StandingsTable';
import TopScorers from '../../../components/match/TopScorers';
import ClubCrest from '../../../components/ui/ClubCrest';
import EmptyState from '../../../components/ui/EmptyState';

/**
 * Overview — the sport at a glance.
 *
 * FIRST ATTEMPT WAS A SUMMARY WITH "VIEW ALL" LINKS, and the client rightly said
 * it hid everything. SECOND ATTEMPT rendered the four tab pages one under another,
 * which put everything back but read as four pages stapled together — each with its
 * own filters, its own tabs, its own empty states, none of them composed.
 *
 * This is the third shape and the right one: every section is written FOR this
 * page. Matches are the lead and get the full-width tiles. The table and the
 * scorers share a row, because "who is top" and "who is scoring" are one question
 * asked twice. Teams are a crest rail, not a card grid — on the overview you want
 * to recognise the clubs, not read their names. News is the same masthead
 * (lead story + a short headline column) that /news and the sport's News tab
 * use, via NewsCard.Masthead — a smaller instance of the same design, not a
 * third variant.
 *
 * Every section links through to the tab that holds the full version, and any
 * section without data is not rendered at all.
 */

const Section = ({ title, to, action, children }) => (
  <section className="flex flex-col gap-3.5">
    <div className="flex items-baseline justify-between gap-3">
      <h2 className="font-display text-lg font-bold tracking-[-0.01em] text-primary">{title}</h2>
      {to && (
        <Link
          to={to}
          className="flex shrink-0 items-center gap-1 text-sm font-semibold text-secondary transition-colors duration-150 ease-standard hover:text-brand-text"
        >
          {action}
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      )}
    </div>
    {children}
  </section>
);

const SportOverview = () => {
  const { t } = useTranslation();
  const { slug, live, upcoming, results, teams, news, primaryLeague } = useSport();
  const base = `/sports/${slug}`;
  const seeAll = t('sporthub.view_all');

  // Same key the standings tab and the league pages use, so this is served from
  // cache rather than fetched again.
  const { data: leagueRes } = useQuery({
    queryKey: ['league-details', String(primaryLeague?.id)],
    queryFn: () => getLeague(primaryLeague.id),
    enabled: !!primaryLeague?.id,
  });
  const standings = (leagueRes?.data?.standings ?? []).slice(0, 5);
  const scorers = (leagueRes?.data?.topScorers ?? []).slice(0, 5);

  // What leads the page: whatever is actually happening. Live first, then the next
  // kickoffs, then the last results — never an empty "Live" heading.
  const lead = live.length ? live : upcoming.length ? upcoming : results;
  const leadTitle = live.length
    ? t('sporthub.live_now')
    : upcoming.length
      ? t('sporthub.upcoming')
      : t('sporthub.latest_results');

  const [feature, ...rest] = news;
  const nothing = !lead.length && !standings.length && !teams.length && !news.length;

  if (nothing) {
    return <EmptyState title={t('sporthub.coming_soon')} hint={t('sporthub.coming_soon_hint')} />;
  }

  return (
    <div className="flex flex-col gap-9">
      {lead.length > 0 && (
        <Section title={leadTitle} to={`${base}/matches`} action={seeAll}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {lead.slice(0, 6).map((f) => <MatchTile key={f.id} fixture={f} />)}
          </div>
        </Section>
      )}

      {/* "Who is top" and "who is scoring" are the same question asked twice, so
          they sit on one row rather than stacking into two more screens. */}
      {(standings.length > 0 || scorers.length > 0) && (
        <div className="grid gap-6 lg:grid-cols-2">
          {standings.length > 0 && (
            <Section title={t('sporthub.nav_standings')} to={`${base}/standings`} action={seeAll}>
              <StandingsTable rows={standings} />
            </Section>
          )}
          {scorers.length > 0 && (
            <Section title={t('sporthub.top_scorers', 'Top scorers')} to={`${base}/standings`} action={seeAll}>
              <TopScorers scorers={scorers} limit={5} />
            </Section>
          )}
        </div>
      )}

      {teams.length > 0 && (
        <Section title={t('sporthub.nav_teams')} to={`${base}/teams`} action={seeAll}>
          {/* A rail of crests, not a grid of cards: here you are recognising clubs,
              not reading a directory. The full grid lives one tap away. */}
          <div className="scroll-contain -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0">
            {teams.slice(0, 14).map((tm) => (
              <Link
                key={tm.id}
                to={`/teams/${tm.id}`}
                className="flex w-[104px] shrink-0 flex-col items-center gap-2 rounded-card border border-hairline bg-surface p-3 text-center transition-colors duration-150 ease-standard hover:border-brand/40 hover:bg-brand-tint"
              >
                <ClubCrest team={tm} size="md" />
                <span className="line-clamp-2 text-xs font-semibold leading-snug text-primary">{tm.name}</span>
              </Link>
            ))}
          </div>
        </Section>
      )}

      {news.length > 0 && (
        <Section title={t('sporthub.nav_news')} to={`${base}/news`} action={seeAll}>
          <NewsCard.Masthead lead={feature} secondary={rest.slice(0, 4)} />
        </Section>
      )}
    </div>
  );
};

export default SportOverview;
