import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { tickClock } from '../../utils/matchClock';
import { Calendar, Clock, MapPin, Award, Wifi, Play } from 'lucide-react';
import { matchState } from './MatchRow';
import ClubCrest from '../ui/ClubCrest';
import StatusPill from '../ui/StatusPill';
import Button from '../ui/Button';
import cn from '../ui/cn';
import { useDateFormat } from '../../i18n/dateLocale';
import { useMotionSafe, scorePop } from '../../lib/motion';

/**
 * MatchScoreboard — the header of the single-match page.
 *
 * Built from the same pieces MatchCard/MatchTile use (matchState, ClubCrest,
 * StatusPill, scorePop) so a match reads identically whether it is a tile in a
 * grid or the hero of its own page — just bigger, because this is the one place
 * on the site a score is allowed to be large.
 */

type Team = { id?: any; name?: string; logo?: string; primaryColor?: string };

type MatchScoreboardProps = {
  fixture: {
    homeTeam?: Team;
    awayTeam?: Team;
    league?: { name?: string };
    venue?: string;
    referee?: string;
    matchDate?: string;
    status?: string;
    streamUrl?: string;
    statusLabel?: string;
  };
  live: {
    homeScore?: number;
    awayScore?: number;
    minute?: number;
    status?: string;
    /** The running clock, stamped when it arrived — see utils/matchClock.ts. */
    clock?: any;
  };
  connected: boolean;
};

const ScoreSide = ({ team, className }: { team?: Team; className?: string }) => (
  <div className={cn('flex min-w-0 flex-1 flex-col items-center gap-2 text-center', className)}>
    <ClubCrest team={team} size="lg" className="h-14 w-14 text-base sm:h-20 sm:w-20 sm:text-xl" />
    <span className="line-clamp-2 max-w-[9rem] text-sm font-semibold leading-tight text-primary sm:max-w-none sm:text-lg">
      {team?.name || 'TBD'}
    </span>
  </div>
);

const MatchScoreboard = ({ fixture, live, connected }: MatchScoreboardProps) => {
  const { t } = useTranslation();
  const formatDate = useDateFormat();
  const safe = useMotionSafe();

  const state = matchState({ ...fixture, status: live.status || fixture.status });
  const isLive = state === 'live' || state === 'halftime';
  const showScore = isLive || state === 'fulltime';
  const off = state === 'postponed' || state === 'abandoned';

  // The minute has to move.
  //
  // `live.minute` only changes when the server pushes, so a viewer watching a
  // quiet passage of play sees the clock freeze — and it disagrees with the
  // reporter's console, which is the one thing a match clock must never do. The
  // server sends the kick-off timestamp; tickClock extrapolates from it, so this
  // counts every second without a request per second. Same implementation both
  // sides use, deliberately: see utils/matchClock.ts.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!isLive) return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [isLive]);

  const clock = tickClock(live.clock, now);
  const minute = live.clock ? clock.minute : live.minute;
  const liveLabel =
    fixture.statusLabel
    || (live.clock ? clock.display : (typeof minute === 'number' ? `${minute}'` : t('match.live')));

  const kickoff = fixture.matchDate ? new Date(fixture.matchDate) : null;

  return (
    <div className="rounded-card border border-hairline bg-surface p-4 sm:p-6">
      {/* Competition + state */}
      <div className="mb-4 flex items-center justify-between gap-2">
        <span className="min-w-0 truncate text-sm font-semibold text-secondary">
          {fixture.league?.name || t('match.competition')}
        </span>

        {isLive && (
          <StatusPill status={state === 'halftime' ? 'HALFTIME' : 'LIVE'} label={state === 'live' ? liveLabel : undefined} className="shrink-0" />
        )}
        {state === 'fulltime' && (
          <span className="shrink-0 text-sm font-semibold text-tertiary">{t('match.full_time')}</span>
        )}
        {(state === 'postponed' || state === 'abandoned') && (
          <StatusPill status={fixture.status} className="shrink-0" />
        )}
        {state === 'upcoming' && kickoff && (
          <time
            dateTime={kickoff.toISOString()}
            className="shrink-0 text-sm font-semibold tabular-nums text-secondary"
          >
            {formatDate(kickoff, 'EEE d MMM, HH:mm')}
          </time>
        )}
      </div>

      {/* sr-only heading: the page's actual title, for assistive tech and SEO structure */}
      <h1 className="sr-only">
        {fixture.homeTeam?.name || 'TBD'} {t('match.versus')} {fixture.awayTeam?.name || 'TBD'}
      </h1>

      {/* Score */}
      <div className="flex items-center justify-center gap-3 sm:gap-8">
        <ScoreSide team={fixture.homeTeam} className={off ? 'opacity-60' : undefined} />

        <div className="flex shrink-0 flex-col items-center gap-1">
          {showScore ? (
            <div className="flex items-baseline gap-2 font-display text-4xl font-extrabold tabular-nums text-primary sm:gap-4 sm:text-6xl">
              <motion.span key={`h-${live.homeScore ?? 0}`} {...scorePop(safe && isLive)}>
                {live.homeScore ?? 0}
              </motion.span>
              <span className="text-tertiary">–</span>
              <motion.span key={`a-${live.awayScore ?? 0}`} {...scorePop(safe && isLive)}>
                {live.awayScore ?? 0}
              </motion.span>
            </div>
          ) : (
            <span className="font-display text-2xl font-semibold text-tertiary sm:text-4xl">
              {t('match.versus')}
            </span>
          )}
          {isLive && connected && (
            <span className="flex items-center gap-1 text-xs font-semibold text-secondary">
              <Wifi size={12} aria-hidden="true" /> {t('match.real_time')}
            </span>
          )}
        </div>

        <ScoreSide team={fixture.awayTeam} className={off ? 'opacity-60' : undefined} />
      </div>

      {/* Meta */}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 border-t border-hairline pt-4 text-sm text-secondary">
        {kickoff && (
          <>
            <span className="inline-flex items-center gap-1.5">
              <Calendar size={14} className="shrink-0 text-tertiary" aria-hidden="true" />
              {formatDate(kickoff, 'EEE d MMM yyyy')}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock size={14} className="shrink-0 text-tertiary" aria-hidden="true" />
              {formatDate(kickoff, 'HH:mm')}
            </span>
          </>
        )}
        {fixture.venue && (
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <MapPin size={14} className="shrink-0 text-tertiary" aria-hidden="true" />
            <span className="truncate">{fixture.venue}</span>
          </span>
        )}
        {fixture.referee && (
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <Award size={14} className="shrink-0 text-tertiary" aria-hidden="true" />
            {t('match.referee')}: {fixture.referee}
          </span>
        )}
      </div>

      {/* Stream */}
      {fixture.streamUrl ? (
        <div className="mt-5 flex justify-center">
          <Button href={fixture.streamUrl} target="_blank" rel="noreferrer" icon={Play} size="md">
            {t('match.watch_live')}
          </Button>
        </div>
      ) : isLive ? (
        <p className="mt-5 text-center text-sm text-tertiary">{t('match.stream_unavailable')}</p>
      ) : null}
    </div>
  );
};

export default MatchScoreboard;
