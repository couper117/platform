import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';
import ClubCrest from '../ui/ClubCrest';

/**
 * The club's next matches, as a strip you push sideways.
 *
 * WHY A RAIL AND NOT A LIST. Next fixtures are glanceable data — a date, two
 * crests, a kickoff — and eight of them stacked vertically push everything else on
 * the page below the fold for information most visitors take in at a glance. Side
 * by side, the whole run of matches is one horizontal movement, and the roster
 * still starts on the first screen.
 *
 * It scrolls INSIDE ITSELF (`scroll-contain`), so a long fixture list never makes
 * the page scroll sideways — the failure this codebase has hit repeatedly.
 *
 * Every card is a link to the match. Kickoff times are formatted in the visitor's
 * locale, not hard-coded, because this platform ships in three languages.
 */
const UpcomingGames = ({
  fixtures,
  teamId,
  seeAllTo,
}: {
  fixtures: any[];
  teamId: string;
  seeAllTo: string;
}) => {
  const { t, i18n } = useTranslation();

  if (!fixtures.length) return null;

  const day = new Intl.DateTimeFormat(i18n.language, { day: '2-digit', month: 'short' });
  const time = new Intl.DateTimeFormat(i18n.language, { hour: '2-digit', minute: '2-digit' });

  return (
    <section className="overflow-hidden rounded-card border border-hairline bg-surface">
      <div className="flex items-center justify-between gap-3 border-b border-hairline px-4 py-3">
        <h2 className="font-display text-base font-semibold text-primary">{t('team.upcoming_games')}</h2>
        <Link
          to={seeAllTo}
          className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-secondary transition-colors duration-150 ease-standard hover:text-brand-text"
        >
          {t('team.see_full_schedule')}
          <ArrowRight size={13} aria-hidden="true" />
        </Link>
      </div>

      <ul className="scroll-contain flex snap-x snap-mandatory overflow-x-auto">
        {fixtures.map((f) => {
          const home = String(f.homeTeamId ?? f.homeTeam?.id) === teamId;
          // The club's own match, read from its side: they are always the second
          // row, the way a fixture list on a club's site is always about them.
          const opponent = home ? f.awayTeam : f.homeTeam;
          const kickoff = f.matchDate ? new Date(f.matchDate) : null;

          return (
            <li key={f.id} className="w-[13.5rem] shrink-0 snap-start border-r border-hairline last:border-r-0">
              <Link
                to={`/matches/${f.id}`}
                className="block h-full px-4 py-3 transition-colors duration-150 ease-standard hover:bg-surface-2"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-tertiary">
                    {kickoff ? day.format(kickoff) : t('common.tbd')}
                  </span>
                  <span className="text-xs tabular-nums text-tertiary">
                    {kickoff ? time.format(kickoff) : ''}
                  </span>
                </div>

                <div className="mt-2.5 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <ClubCrest team={home ? f.homeTeam : f.awayTeam} size="sm" />
                    <span className="truncate text-sm font-semibold text-primary">
                      {(home ? f.homeTeam : f.awayTeam)?.shortName || (home ? f.homeTeam : f.awayTeam)?.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ClubCrest team={opponent} size="sm" />
                    <span className="truncate text-sm text-secondary">
                      {opponent?.shortName || opponent?.name}
                    </span>
                  </div>
                </div>

                <p className="mt-2 truncate text-xs text-tertiary">
                  {/* Home or away is the thing a supporter checks next, and the
                      venue answers it more usefully than the word "home". */}
                  {f.venue || (home ? t('team.at_home') : t('team.away'))}
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

export default UpcomingGames;
