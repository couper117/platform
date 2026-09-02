import React from 'react';
import { useTranslation } from 'react-i18next';
import { Users } from 'lucide-react';
import FormationPitch from './FormationPitch';
import { surfaceFor, NO_SURFACE_REASON } from '../../config/playingSurfaces';
import ClubCrest from '../ui/ClubCrest';
import Badge from '../ui/Badge';
import EmptyState from '../ui/EmptyState';
import cn from '../ui/cn';

/**
 * MatchLineups — THE headline ask: each team's starting XI and substitutes,
 * with shirt number, name and position, side by side on desktop and stacked
 * on mobile.
 *
 * Renders ONLY what the fixture detail actually carries. No lineup rows at all
 * (team sheet not published) is not an error — it is EmptyState, never a
 * fabricated XI. When starters exist, FormationPitch (already built and
 * approved — reused, not reimplemented) sits above the list as a visual
 * summary; the list below is the source of truth (number, name, position) for
 * every player, including the bench.
 */

type LineupEntry = {
  id?: any;
  teamId?: any;
  jerseyNo?: number | string;
  isStarter?: boolean;
  isCaptain?: boolean;
  position?: string;
  player?: { id?: any; fullName?: string };
};

type TeamSheet = { teamId?: any; formation?: string; coachName?: string };

type Fixture = {
  homeTeamId?: any;
  awayTeamId?: any;
  homeTeam?: any;
  awayTeam?: any;
  lineups?: LineupEntry[];
  teamSheets?: TeamSheet[];
  /** Carries the sport, which decides which surface is drawn — or whether one is. */
  league?: { sport?: { id?: number; name?: string; slug?: string; type?: string } };
};

const PlayerRow = ({ p }: { p: LineupEntry }) => {
  const { t } = useTranslation();
  return (
    <li className="flex items-center gap-3 rounded-control px-1.5 py-2 transition-colors duration-150 ease-standard hover:bg-surface-2">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-control bg-surface-2 text-xs font-semibold tabular-nums text-secondary">
        {p.jerseyNo ?? '—'}
      </span>
      <span className="min-w-0 flex-1 truncate text-sm text-primary">{p.player?.fullName || 'Player'}</span>
      {p.isCaptain && (
        <span className="shrink-0 text-xs font-bold text-tertiary" aria-label={t('match.captain')}>
          C
        </span>
      )}
      {p.position && <span className="shrink-0 text-xs text-tertiary">{p.position}</span>}
    </li>
  );
};

const TeamLineupCard = ({
  team,
  list,
  sheet,
}: {
  team: any;
  list: LineupEntry[];
  sheet?: TeamSheet;
}) => {
  const { t } = useTranslation();
  const starters = list.filter((p) => p.isStarter);
  const bench = list.filter((p) => !p.isStarter);

  return (
    <div className="rounded-card border border-hairline bg-surface p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-2 border-b border-hairline pb-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <ClubCrest team={team} size="md" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-primary">{team?.name || 'TBD'}</p>
            {sheet?.coachName && (
              <p className="truncate text-xs text-tertiary">
                {t('match.coach')}: {sheet.coachName}
              </p>
            )}
          </div>
        </div>
        {sheet?.formation && <Badge className="shrink-0">{sheet.formation}</Badge>}
      </div>

      {starters.length > 0 && (
        <>
          <p className="mb-1 text-xs font-semibold text-tertiary">{t('match.starting_xi')}</p>
          <ul className="mb-3">
            {starters.map((p) => (
              <PlayerRow key={p.id ?? `${p.jerseyNo}-${p.player?.fullName}`} p={p} />
            ))}
          </ul>
        </>
      )}

      {bench.length > 0 && (
        <>
          <p className="mb-1 text-xs font-semibold text-tertiary">{t('match.substitutes')}</p>
          <ul>
            {bench.map((p) => (
              <PlayerRow key={p.id ?? `${p.jerseyNo}-${p.player?.fullName}`} p={p} />
            ))}
          </ul>
        </>
      )}
    </div>
  );
};

const MatchLineups = ({ fixture, className }: { fixture: Fixture; className?: string }) => {
  const { t } = useTranslation();
  const lineups = fixture?.lineups || [];
  const homeAll = lineups.filter((l) => l.teamId === fixture.homeTeamId);
  const awayAll = lineups.filter((l) => l.teamId === fixture.awayTeamId);

  if (!homeAll.length && !awayAll.length) {
    return (
      <EmptyState
        icon={Users}
        title={t('match.lineups_unavailable')}
        hint={t('match.lineups_unavailable_hint')}
        className="py-16"
      />
    );
  }

  const sheetFor = (teamId: any) => (fixture?.teamSheets || []).find((s) => s.teamId === teamId);
  const homeSheet = sheetFor(fixture.homeTeamId);
  const awaySheet = sheetFor(fixture.awayTeamId);
  const homeStarters = homeAll.filter((p) => p.isStarter);
  const awayStarters = awayAll.filter((p) => p.isStarter);

  // The sport decides what, if anything, is drawn. Nineteen of the twenty sports
  // here are not football, and nine are not played on a surface at all.
  const sport = fixture?.league?.sport;
  const surface = surfaceFor(sport);
  const noSurfaceReason = !surface && sport?.type ? NO_SURFACE_REASON[sport.type] : null;

  return (
    <div className={cn('space-y-4', className)}>
      {surface && (homeStarters.length > 0 || awayStarters.length > 0) && (
        <div className="rounded-card border border-hairline bg-surface p-4 sm:p-6">
          <FormationPitch
            home={{ team: fixture.homeTeam, starters: homeStarters, formation: homeSheet?.formation, coachName: homeSheet?.coachName }}
            away={{ team: fixture.awayTeam, starters: awayStarters, formation: awaySheet?.formation, coachName: awaySheet?.coachName }}
            sport={sport}
          />
        </div>
      )}

      {/* Said plainly rather than drawing a field the sport does not use. The
          rosters below still show who is taking part. */}
      {noSurfaceReason && (
        <p className="rounded-card border border-dashed border-hairline bg-surface-2 p-4 text-sm text-tertiary">
          {noSurfaceReason}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <TeamLineupCard team={fixture.homeTeam} list={homeAll} sheet={homeSheet} />
        <TeamLineupCard team={fixture.awayTeam} list={awayAll} sheet={awaySheet} />
      </div>
    </div>
  );
};

export default MatchLineups;
