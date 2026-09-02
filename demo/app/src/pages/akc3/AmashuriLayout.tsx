import React from 'react';
import { NavLink, Outlet, useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { GraduationCap, Layers, School, Trophy, Radio } from 'lucide-react';
import {
  getSchools, getChampionships, getAkcSports, getAkcFixtures,
} from '../../api/endpoints/amashuri';
import { AMASHURI_HERO } from '../../config/amashuriMedia';
import Seo from '../../components/shared/Seo';
import cn from '../../components/ui/cn';
import PageAd from '../../components/shared/PageAd';

/**
 * The shell every Amashuri Games page shares: the photograph, the identity, the
 * headline numbers and the tab bar.
 *
 * WHY THIS EXISTS
 * /amashuri was ONE page carrying live matches, the sports, the competitions, the
 * schools and the news all stacked on top of each other, with four sibling routes
 * (championships, fixtures, standings, schools) that looked like unrelated pages
 * because nothing tied them together — no shared header, no tabs, no way to tell
 * you were still inside the Games. Same fix as the sport and club sections: a
 * shell that fetches the shared counts ONCE, and real routes underneath it.
 *
 * IT LEADS WITH A PHOTOGRAPH, and it has to. Amashuri is school sport — the
 * subject is children competing for their schools — and the section opened on a
 * grey icon, a badge and a line of type. Every other section of this product shows
 * you the sport before it tells you about it.
 *
 * THE HERO IS SHORT. 220px on a phone, 280px on a desktop. A photograph is the
 * argument for the section, not the section itself, and the tab bar has to be
 * reachable without a scroll.
 *
 * WHAT THE PHONE VERSION HAD TO GIVE UP. At 390px the desktop lockup does not fit:
 * a 24px headline wrapped to two lines, the four stats wrapped to a second row,
 * and the photo credit landed on top of them — three things fighting over 200px.
 * The headline steps down and tightens, the stats become one no-wrap row that can
 * scroll, and the credit moves to the top corner where nothing else is. None of it
 * changes above `sm`, where all of it fitted already.
 */

export type AmashuriContext = {
  schools: any[];
  competitions: any[];
  sports: any[];
  fixtures: any[];
  live: any[];
  isPending: boolean;
  isError: boolean;
  refetchAll: () => void;
};

export const useAmashuri = () => useOutletContext<AmashuriContext>();

/** One headline number. Same anatomy as SportLayout's Stat. */
const Stat = ({ icon: Icon, value, label, live = false, className }: { icon: any; value: any; label: any; live?: boolean; className?: string }) => (
  <span className={cn('flex shrink-0 items-center gap-1.5', className)}>
    <Icon size={12} aria-hidden="true" className={live ? 'text-live' : 'text-white/60'} />
    <span className={cn('text-[11px] font-semibold tabular-nums sm:text-sm', live ? 'text-live' : 'text-white')}>{value}</span>
    <span className="whitespace-nowrap text-[11px] text-white/60 sm:text-sm">{label}</span>
  </span>
);

const TABS = [
  { to: '.', end: true, labelKey: 'amashuri.tab_overview' },
  { to: 'championships', labelKey: 'amashuri.tab_championships' },
  // NO SEPARATE RESULTS TAB. The fixtures page carries Upcoming / Live / Results
  // as its own state tabs — the same shape as the main Matches screen — so a
  // Results tab here would be the second way to reach one screen, which is the
  // Live-and-Matches duplication all over again. /amashuri/results still resolves
  // for anyone holding the link; it opens the fixtures page on Results.
  { to: 'fixtures', labelKey: 'amashuri.tab_fixtures' },
  { to: 'standings', labelKey: 'amashuri.tab_standings' },
  { to: 'schools', labelKey: 'amashuri.tab_schools' },
];

const AmashuriLayout = () => {
  const { t } = useTranslation();

  const schoolsQ = useQuery({ queryKey: ['akc-schools'], queryFn: () => getSchools() });
  const compsQ = useQuery({ queryKey: ['akc-championships'], queryFn: () => getChampionships() });
  const sportsQ = useQuery({ queryKey: ['akc-sports'], queryFn: () => getAkcSports() });
  const fixturesQ = useQuery({ queryKey: ['akc-fixtures'], queryFn: () => getAkcFixtures() });

  const schools = schoolsQ.data?.data || [];
  const competitions = compsQ.data?.data || [];
  const sports = sportsQ.data?.data || [];
  const fixtures = fixturesQ.data?.data || [];
  const live = fixtures.filter((f: any) => f.status === 'ONGOING');

  const context: AmashuriContext = {
    schools,
    competitions,
    sports,
    fixtures,
    live,
    isPending: schoolsQ.isPending || compsQ.isPending || sportsQ.isPending || fixturesQ.isPending,
    isError: schoolsQ.isError || compsQ.isError || sportsQ.isError || fixturesQ.isError,
    refetchAll: () => {
      schoolsQ.refetch();
      compsQ.refetch();
      sportsQ.refetch();
      fixturesQ.refetch();
    },
  };

  return (
    <div className="min-h-screen bg-page">
      <Seo title={t('seo.amashuri_home_title')} description={t('seo.amashuri_home_desc')} />

      {/* ─── the photograph ─── */}
      <div className="relative h-[220px] overflow-hidden bg-[#0F0F0F] sm:h-[260px] lg:h-[280px]">
        <img
          src={AMASHURI_HERO.src}
          alt=""
          loading="eager"
          // lowercase: React 18 does not recognise the camelCase form
          fetchpriority="high"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        {/* Weighted to the bottom, where the type sits — the top of the frame is
            the photograph. Theme-independent by design: these sit on a picture,
            not on the page surface. */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/20" />

        <div className="relative mx-auto flex h-full max-w-3xl flex-col justify-end px-4 pb-4 lg:max-w-6xl lg:px-6 lg:pb-6">
          <p className="mb-2 inline-flex w-fit items-center gap-1.5 rounded-pill border border-white/20 bg-white/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
            <GraduationCap size={13} aria-hidden="true" />
            {t('amashuri.tagline')}
          </p>
          <h1 className="font-display text-lg font-extrabold leading-tight tracking-[-0.02em] text-white sm:text-4xl sm:leading-tight">
            {t('amashuri.home_title_line1')} {t('amashuri.home_title_pre')}{t('amashuri.home_title_accent')}
          </h1>
          <div className="scroll-contain -mx-4 mt-2 flex items-center gap-x-2.5 overflow-x-auto px-4 sm:mx-0 sm:mt-3 sm:flex-wrap sm:gap-x-5 sm:overflow-visible sm:px-0">
            <Stat icon={Layers} value={sports.length} label={t('amashuri.stat_sports')} />
            <Stat icon={School} value={schools.length} label={t('amashuri.stat_schools')} />
            {/* THREE STATS ON A PHONE, FOUR ABOVE `sm`. All four came to 398px of
                labels, which overflows a 360px screen and sliced "Live matches" in
                half at the edge — a clipped word reads as a bug, not as a hint to
                scroll. Competitions is the one to drop: it is the longest label and
                the Championships tab is six pixels below it. */}
            <Stat icon={Trophy} value={competitions.length} label={t('amashuri.stat_competitions')} className="hidden sm:flex" />
            <Stat icon={Radio} value={live.length} label={t('amashuri.stat_live')} live={live.length > 0} />
          </div>
        </div>

        {/* BOTTOM RIGHT, NOT TOP RIGHT. At the top it landed on the brightest
            part of the frame, unreadable, and overlapped the tagline pill on a
            narrow screen. Down here it sits inside the scrim, out of the way of
            the stats on the left. */}
        {AMASHURI_HERO.credit && (
          <span className="pointer-events-none absolute right-3 top-2 text-[10px] font-normal text-white/70 [text-shadow:0_1px_3px_rgba(0,0,0,0.9)] sm:bottom-2 sm:top-auto sm:text-white/45 sm:[text-shadow:none]">
            {t('explore.photo_credit', { author: AMASHURI_HERO.credit })}
          </span>
        )}
      </div>

      {/* ─── the categories ───
          Underline tabs, scrolling horizontally on a phone, exactly like the sport
          and club sections. This is the whole point of the restructure: six places
          to go instead of one page holding all six. */}
      <div className="border-b border-hairline bg-surface">
        <div className="scroll-contain mx-auto flex max-w-3xl gap-5 overflow-x-auto px-4 lg:max-w-6xl lg:px-6">
          {TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                cn(
                  'relative -mb-px flex min-h-tap shrink-0 items-center whitespace-nowrap text-sm font-semibold',
                  'transition-colors duration-150 ease-standard',
                  'after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:content-[""]',
                  isActive
                    ? 'text-primary after:bg-brand'
                    : 'text-secondary after:bg-transparent hover:text-primary'
                )
              }
            >
              {t(tab.labelKey)}
            </NavLink>
          ))}
        </div>
      </div>

      <Outlet context={context} />
      {/* Advertising sits at the FOOT of the page, after the content, never
          spliced into it. An advert dropped between two fixtures or two
          paragraphs interrupts the thing the reader came for; down here it is
          the last item on the screen and costs the page nothing. AdSlot
          collapses to nothing when the position has no inventory. */}
      <div className="mx-auto max-w-3xl px-4 pb-8 lg:max-w-6xl lg:px-6 lg:pb-12">
        <PageAd position="amashuri" />
      </div>
    </div>
  );
};

export default AmashuriLayout;
