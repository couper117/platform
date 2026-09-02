import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CalendarDays, Star } from 'lucide-react';
import Select from '../ui/Select';
import SportIcon from '../shared/SportIcon';
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
 * THE COMPETITION FILTER IS DESKTOP-ONLY. It used to be a row of chips on mobile
 * and a select on desktop. On a phone that chip row sat under the sport rail and
 * the state tabs, so the first fixture began 281px down an 844px screen — a third
 * of the viewport spent on filters before a single score. The sport rail is the
 * scope people actually change; competition stays as the select on desktop, where
 * the row costs nothing.
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
      'flex h-8 shrink-0 items-center gap-1.5 rounded-pill border px-3 text-xs font-semibold',
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
 *   favouriteSlug?: string,
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
  favouriteSlug = '',
  onSport,
  isFavourite = false,
  onPin,
}) => {
  const { t } = useTranslation();

  // The sport you follow first, then the rest in the order the API sent them.
  const ordered = React.useMemo(() => {
    if (!favouriteSlug) return sports;
    const i = sports.findIndex((s) => s.slug === favouriteSlug);
    return i > 0 ? [sports[i], ...sports.slice(0, i), ...sports.slice(i + 1)] : sports;
  }, [sports, favouriteSlug]);

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
        /**
         * THREE THINGS MAKE A TWENTY-ITEM RAIL USABLE.
         *
         * An ICON per chip. The real platform carries twenty sports, not the
         * twelve the demo had, and twenty identical grey pills is a wall of text
         * you read one word at a time. Every slug has its own glyph, so the rail
         * is scanned rather than read.
         *
         * THE SPORT YOU FOLLOW COMES FIRST, straight after "All sports". Pinning
         * a sport and then having to scroll past nineteen others to reach it is
         * the pin not doing its job.
         *
         * A FADE ON THE RIGHT. The scrollbar used to say "there is more"; it is
         * hidden now because on Windows it drew a grey trough under the row, so
         * the fade carries that message instead. It sits over the page ground and
         * is `pointer-events-none`, so it never eats a tap meant for a chip.
         */
        <div className="relative -mx-4 mb-3 lg:mx-0">
          <div className="scroll-contain flex items-center gap-2 overflow-x-auto px-4 lg:px-0">
            <Chip active={!sportSlug} onClick={() => onSport?.('')}>
              {t('fixtures.all_sports')}
            </Chip>
            {ordered.map((s) => (
              <Chip key={s.id ?? s.slug} active={sportSlug === s.slug} onClick={() => onSport?.(s.slug)}>
                <SportIcon slug={s.slug} size={13} className="shrink-0" />
                {s.name}
              </Chip>
            ))}
          </div>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-page to-transparent"
          />
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

      {/* There is no competition filter on mobile.
          It used to be a third row of chips under the sport rail and the state
          tabs, which put the first fixture 281px down an 844px screen. The sport
          rail is the filter people actually reach for; competition stays on
          desktop as the Select above, where the row costs nothing. */}
    </div>
  );
};

export default FixtureFilters;
