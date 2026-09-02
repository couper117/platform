import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft } from 'lucide-react';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';
import cn from '../ui/cn';

/**
 * A player's profile: who they are, what they have done this season, recent form.
 *
 * ONE COMPONENT, TWO KINDS OF PLAYER. A club player from /players/:id and a school
 * athlete from /akc3/athletes/:id are the same page — a photograph, a season in
 * their own sport, recent form, a profile block — and the only real differences
 * are where "back" goes, what sits under the name, and one or two profile rows.
 * Those are props. Copying the whole page for the Amashuri side would have meant
 * two stat tables to keep in step with each other, and they would not have stayed
 * in step.
 *
 * THE STAT SHEET IS THE SPORT'S, NOT FOOTBALL'S. A squad list is the same shape in
 * every sport, but a season is not: a point guard is read in points, rebounds and
 * assists per game; a cyclist in stage wins and KOM points; a sprinter in a season
 * best and a national rank. Printing "Goals / Assists / Cards" over all of them is
 * the same mistake the match timeline used to make with yellow cards in basketball.
 * `STATS` below is one ordered list per sport; the first three entries are the
 * headline tiles and the rest fill the table underneath.
 *
 * ENTRIES ARE DROPPED WHEN THE VALUE IS ABSENT, not rendered as a dash. Clean
 * sheets belong to a goalkeeper and saves to a handball keeper; an outfield player
 * simply does not have that row.
 */

type Stat = { key: string; label: string; decimal?: boolean };

const STATS: Record<number, Stat[]> = {
  // Football — the three that lead are the three a fan quotes.
  1: [
    { key: 'goals', label: 'goals' },
    { key: 'assists', label: 'assists' },
    { key: 'appearances', label: 'appearances' },
    { key: 'minutes', label: 'minutes' },
    { key: 'cleanSheets', label: 'clean_sheets' },
    { key: 'yellowCards', label: 'yellow_cards' },
    { key: 'redCards', label: 'red_cards' },
  ],
  // Basketball is read per game, so these are averages to one decimal.
  2: [
    { key: 'points', label: 'ppg', decimal: true },
    { key: 'rebounds', label: 'rpg', decimal: true },
    { key: 'assists', label: 'apg', decimal: true },
    { key: 'games', label: 'games' },
    { key: 'steals', label: 'spg', decimal: true },
    { key: 'blocks', label: 'bpg', decimal: true },
    { key: 'minutes', label: 'mpg', decimal: true },
  ],
  3: [
    { key: 'points', label: 'points' },
    { key: 'kills', label: 'kills' },
    { key: 'blocks', label: 'blocks' },
    { key: 'matches', label: 'matches' },
    { key: 'aces', label: 'aces' },
    { key: 'digs', label: 'digs' },
  ],
  4: [
    { key: 'stageWins', label: 'stage_wins' },
    { key: 'podiums', label: 'podiums' },
    { key: 'points', label: 'points' },
    { key: 'races', label: 'races' },
    { key: 'komPoints', label: 'kom_points' },
  ],
  5: [
    { key: 'seasonBest', label: 'season_best' },
    { key: 'wins', label: 'wins' },
    { key: 'podiums', label: 'podiums' },
    { key: 'meets', label: 'meets' },
    { key: 'nationalRank', label: 'national_rank' },
  ],
  6: [
    { key: 'goals', label: 'goals' },
    { key: 'assists', label: 'assists' },
    { key: 'matches', label: 'matches' },
    { key: 'saves', label: 'saves' },
    { key: 'suspensions', label: 'suspensions' },
  ],
};

const FALLBACK: Stat[] = [
  { key: 'appearances', label: 'appearances' },
  { key: 'wins', label: 'wins' },
  { key: 'podiums', label: 'podiums' },
];

const show = (v: any) => v !== null && v !== undefined && v !== '';

const fmt = (v: any, decimal?: boolean) => {
  if (typeof v !== 'number') return String(v);
  return decimal ? v.toFixed(1) : v.toLocaleString();
};

const ageOf = (dob?: string) => {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / 31557600000);
};

/** W / D / L on tokens — `red` is remapped onto the brand green in this config. */
const RESULT: Record<string, string> = {
  W: 'bg-brand-tint text-brand-text',
  D: 'bg-surface-3 text-secondary',
  L: 'bg-danger/10 text-danger-text',
};

const StatTile = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-card border border-hairline bg-surface p-3 text-center">
    <p className="font-display text-2xl font-extrabold tabular-nums text-primary sm:text-3xl">{value}</p>
    <p className="mt-0.5 text-[11px] uppercase tracking-wide text-tertiary">{label}</p>
  </div>
);

const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex items-center justify-between gap-3 border-b border-hairline px-3 py-2.5 last:border-0">
    <span className="text-sm text-secondary">{label}</span>
    <span className="text-sm font-semibold tabular-nums text-primary">{value}</span>
  </div>
);

type PlayerProfileProps = {
  player: any;
  /** Where the back link goes; omitted, there is no back link. */
  backTo?: string;
  backLabel?: React.ReactNode;
  /** The lockup under the name — a club crest, a school crest, anything. */
  affiliation?: React.ReactNode;
  /** Extra rows for the profile block, appended after the shared ones. */
  extraRows?: React.ReactNode;
  /**
   * Route prefix for a form row. A club fixture lives at /matches/:id and a school
   * fixture at /amashuri/matches/:id; hard-coding the club one sent every school
   * athlete's form into the national match centre, which does not hold that game.
   */
  matchBase?: string;
};

const PlayerProfile = ({ player, backTo, backLabel, affiliation, extraRows, matchBase = '/matches' }: PlayerProfileProps) => {
  const { t, i18n } = useTranslation();

  const season = player.season ?? {};
  const spec = (STATS[player.sportId] ?? FALLBACK).filter((s) => show(season[s.key]));

  // A KEEPER'S HEADLINE IS NOT A FORWARD'S. The three tiles are the first three
  // entries of the sport's list, which for football and handball are the scoring
  // ones — so a goalkeeper's page opened on "0 GOALS · 0 ASSISTS", three numbers
  // that say nothing about how they played. `keeperLead` promotes the stats that
  // do. Anything not named here keeps the sport's normal order.
  const keeperLead = show(season.cleanSheets)
    ? ['appearances', 'cleanSheets', 'minutes']
    : show(season.saves)
      ? ['saves', 'matches', 'goals']
      : null;
  const ordered = keeperLead
    ? [...spec].sort((a, b) => {
        const rank = (k: string) => (keeperLead.indexOf(k) === -1 ? keeperLead.length : keeperLead.indexOf(k));
        return rank(a.key) - rank(b.key);
      })
    : spec;

  const hero = ordered.slice(0, 3);
  const table = ordered.slice(3);
  const age = ageOf(player.dateOfBirth);
  const form = player.form ?? [];
  const dateFmt = new Intl.DateTimeFormat(i18n.language, { day: 'numeric', month: 'short' });

  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-4 lg:max-w-5xl lg:px-6 lg:py-6">
      {backTo && (
        <Link
          to={backTo}
          className="inline-flex min-h-tap items-center gap-1 text-sm text-secondary transition-colors duration-150 ease-standard hover:text-primary"
        >
          <ChevronLeft size={16} aria-hidden="true" />
          {backLabel}
        </Link>
      )}

      {/* Identity */}
      <header className="flex items-center gap-4 rounded-card border border-hairline bg-surface p-4">
        <Avatar
          src={player.photo}
          name={player.fullName}
          size="lg"
          className="h-16 w-16 shrink-0 text-lg sm:h-20 sm:w-20 sm:text-xl"
        />
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-xl font-extrabold tracking-[-0.02em] text-primary sm:text-2xl">
            {player.fullName}
          </h1>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-secondary">
            {player.position && <span>{player.position}</span>}
            {typeof player.jerseyNumber === 'number' && (
              <span className="text-tertiary">{t('team.jersey_no', { number: player.jerseyNumber })}</span>
            )}
          </p>
          {affiliation}
        </div>
      </header>

      {/* Season */}
      {hero.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-display text-lg font-semibold text-primary">{t('player.this_season')}</h2>
          <div className="grid grid-cols-3 gap-3">
            {hero.map((s) => (
              <StatTile
                key={s.key}
                label={t(`player.stat.${s.label}`)}
                value={fmt(season[s.key], s.decimal)}
              />
            ))}
          </div>
          {table.length > 0 && (
            <div className="overflow-hidden rounded-card border border-hairline bg-surface">
              {table.map((s) => (
                <Row
                  key={s.key}
                  label={t(`player.stat.${s.label}`)}
                  value={fmt(season[s.key], s.decimal)}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Form */}
      {form.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-display text-lg font-semibold text-primary">{t('player.recent_form')}</h2>
          <div className="overflow-hidden rounded-card border border-hairline bg-surface">
            {form.map((f: any) => (
              <Link
                key={f.fixtureId}
                to={`${matchBase}/${f.fixtureId}`}
                className="flex items-center gap-3 border-b border-hairline px-3 py-2.5 transition-colors duration-150 ease-standard last:border-0 hover:bg-surface-2"
              >
                <span
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                    RESULT[f.result]
                  )}
                >
                  {t(`player.result.${f.result}`)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-primary">
                    {t(f.home ? 'player.vs_home' : 'player.vs_away', { team: f.opponent?.name })}
                  </p>
                  <p className="text-xs text-tertiary">{dateFmt.format(new Date(f.date))}</p>
                </div>
                {f.contribution?.value > 0 && (
                  <Badge className="shrink-0">
                    {t(`player.contribution.${f.contribution.label}`, { count: f.contribution.value })}
                  </Badge>
                )}
                <span className="shrink-0 text-sm font-semibold tabular-nums text-secondary">{f.score}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Profile */}
      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold text-primary">{t('player.profile')}</h2>
        <div className="overflow-hidden rounded-card border border-hairline bg-surface">
          {age !== null && <Row label={t('player.age')} value={t('player.years', { count: age })} />}
          {player.nationality && <Row label={t('player.nationality')} value={player.nationality} />}
          {player.height && <Row label={t('player.height')} value={`${player.height} cm`} />}
          {player.weight && <Row label={t('player.weight')} value={`${player.weight} kg`} />}
          {player.licenseNo && <Row label={t('player.licence')} value={player.licenseNo} />}
          {extraRows}
        </div>
      </section>
    </div>
  );
};

export default PlayerProfile;
