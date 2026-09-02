import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CalendarDays, Star } from 'lucide-react';
import Select from '../ui/Select';
import cn from '../ui/cn';

/**
 * The page's own head: its title, the state tabs, and the competition filter.
 *
 * WHAT THIS REPLACED, AND WHY
 * A second full-bleed bar glued under the fixed header — `sticky top-tap`, its own
 * border, its own background — carrying three FILLED GREEN PILLS. Three problems
 * at once: `top-tap` is the 44px touch-target token rather than a header height, so
 * the bar slid under the 56/72px header on every scroll; a bar directly beneath the
 * app bar reads as a second navigation the product does not have; and a saturated
 * green pill is the loudest object on a screen whose subject is scores.
 *
 * It is now part of the page. A title, underline tabs beneath it, and the whole
 * thing sitting in the content column on the same left edge as the fixtures — so
 * the eye travels down one line instead of crossing two stacked bars. Nothing is
 * sticky: this is a page header, and a page header scrolls away.
 *
 * GREEN IS THE UNDERLINE AND NOTHING ELSE. One 2px rule under the active tab,
 * which is the entire colour budget this control needs.
 *
 * TWO CONTROLS FOR THE COMPETITION, ONE PER BREAKPOINT — mutually exclusive, not
 * duplicated. Chips on mobile (self-evident, full-height targets, and they show
 * what exists without a tap); a select on desktop, where a dozen chips would eat
 * the row that the tabs need.
 */

const Tab = ({ active, children, ...props }) => (
  <button
    type="button"
    aria-current={active ? 'page' : undefined}
    className={cn(
      'relative -mb-px flex min-h-tap shrink-0 items-center whitespace-nowrap px-0.5 text-sm font-semibold',
      'transition-colors duration-150 ease-standard',
      'after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:content-[""]',
      active
        ? 'text-primary after:bg-brand'
        : 'text-secondary after:bg-transparent hover:text-primary'
    )}
    {...props}
  >
    {children}
  </button>
);

const Chip = ({ active, children, ...props }) => (
  <button
    type="button"
    className={cn(
      'flex h-8 shrink-0 items-center rounded-pill border px-3 text-xs font-semibold',
      'transition-colors duration-150 ease-standard',
      active
        ? 'border-brand/40 bg-brand-tint text-brand-text'
        : 'border-hairline text-secondary hover:bg-surface-2 hover:text-primary'
    )}
    {...props}
  >
    {children}
  </button>
);

const STATES = [
  ['SCHEDULED', 'fixtures.tab_upcoming'],
  ['LIVE', 'fixtures.tab_live'],
  ['COMPLETED', 'fixtures.tab_results'],
];

/**
 * @param {{
 *   title?: React.ReactNode,
 *   status?: any,
 *   leagueId?: any,
 *   leagues?: any[],
 *   onStatus?: any,
 *   onLeague?: any,
 *   sports?: any[],
 *   sportSlug?: string,
 *   onSport?: any,
 *   isFavourite?: boolean,
 *   onPin?: any,
 * }} props
 */
const FixtureFilters = ({
  title,
  status,
  leagueId,
  leagues = [],
  onStatus,
  onLeague,
  sports = [],
  sportSlug = '',
  onSport,
  isFavourite = false,
  onPin,
}) => {
  const { t } = useTranslation();

  return (
    <div className="mx-auto max-w-3xl px-4 pt-4 lg:max-w-6xl lg:px-6 lg:pt-6">
      {title && (
        <h1 className="mb-3 font-display text-xl font-extrabold tracking-[-0.02em] text-primary sm:mb-4 sm:text-3xl">
          {title}
        </h1>
      )}

      {/* SPORT SCOPE — this screen shows ONE sport at a time.
          Every sport used to pour into one list: a football fixture, a basketball
          quarter and a volleyball set stacked together, which is not how anyone
          follows sport. "All sports" is still here for people who do want the
          whole day at once, but it is a choice now rather than the only option. */}
      {sports.length > 0 && (
        <div className="scroll-contain -mx-4 mb-3 flex items-center gap-2 overflow-x-auto px-4 lg:mx-0 lg:px-0">
          <Chip active={!sportSlug} onClick={() => onSport?.('')}>
            {t('fixtures.all_sports')}
          </Chip>
          {sports.map((s) => (
            <Chip key={s.id ?? s.slug} active={sportSlug === s.slug} onClick={() => onSport?.(s.slug)}>
              {s.name}
            </Chip>
          ))}
        </div>
      )}

      {/* Remembering the choice is a separate, explicit act — switching sport to
          look at something is not the same as changing the sport you follow. */}
      {sportSlug && (
        <button
          type="button"
          onClick={onPin}
          aria-pressed={isFavourite}
          className={cn(
            'mb-3 flex min-h-tap items-center gap-1.5 text-xs font-semibold',
            'transition-colors duration-150 ease-standard',
            isFavourite ? 'text-brand-text' : 'text-secondary hover:text-primary'
          )}
        >
          <Star size={13} aria-hidden="true" className={isFavourite ? 'fill-brand text-brand' : ''} />
          {isFavourite ? t('fixtures.your_sport_on') : t('fixtures.make_my_sport')}
        </button>
      )}

      <div className="flex items-stretch gap-6 border-b border-hairline">
        <nav aria-label={t('fixtures.filter_state', 'State')} className="flex items-stretch gap-6">
          {STATES.map(([value, labelKey]) => (
            <Tab key={value} active={status === value} onClick={() => onStatus(value)}>
              {/* The live tab carries a pulsing dot when you are not on it, so
                  "is anything on right now" is answerable without tapping. */}
              {value === 'LIVE' && status !== 'LIVE' && (
                <span
                  aria-hidden="true"
                  className="mr-2 inline-block h-1.5 w-1.5 animate-live-pulse rounded-pill bg-live align-middle"
                />
              )}
              {t(labelKey)}
            </Tab>
          ))}
        </nav>

        {/* The month view. It sat in its own right-aligned row above the list,
            which cost ~50px and read as a stray button; it belongs on the same
            line as the tabs, since it is another way of asking "what is on". */}
        <Link
          to="/calendar"
          className="ml-auto flex min-h-tap shrink-0 items-center gap-1.5 self-center px-1 text-xs font-semibold text-secondary transition-colors duration-150 ease-standard hover:text-brand-text lg:order-last lg:ml-3"
        >
          <CalendarDays size={13} aria-hidden="true" />
          {t('nav.calendar')}
        </Link>

        {leagues.length > 0 && (
          <Select
            className="ml-auto hidden self-center lg:inline-flex"
            label={t('fixtures.filter_league')}
            value={leagueId}
            // Select forwards the native event; unwrap it here.
            onChange={(e) => onLeague(e.target.value)}
            placeholder={t('fixtures.all_leagues')}
            options={leagues.map((l) => ({ value: String(l.id), label: l.name }))}
          />
        )}
      </div>

      {/* Competition — mobile only, as chips. */}
      {leagues.length > 0 && (
        <div className="scroll-contain -mx-4 flex gap-2 overflow-x-auto px-4 pb-0.5 pt-2.5 lg:hidden">
          <Chip active={!leagueId} onClick={() => onLeague('')}>
            {t('fixtures.all_leagues')}
          </Chip>
          {leagues.map((l) => (
            <Chip
              key={l.id}
              active={String(leagueId) === String(l.id)}
              onClick={() => onLeague(String(l.id))}
            >
              {l.name}
            </Chip>
          ))}
        </div>
      )}
    </div>
  );
};

export default FixtureFilters;
