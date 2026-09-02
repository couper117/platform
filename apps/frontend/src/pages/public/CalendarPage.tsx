import React from 'react';
import { useTranslation } from 'react-i18next';
import ResponsiveWrapper from '../../components/shared/ResponsiveWrapper';
import Seo from '../../components/shared/Seo';
import UmugandaCalendar from '../../components/umuganda/UmugandaCalendar';
import UmugandaNotices from '../../components/umuganda/UmugandaNotices';
import UpcomingUmuganda from '../../components/umuganda/UpcomingUmuganda';
import PageAd from '../../components/shared/PageAd';

/**
 * The sports calendar, Umuganda-aware.
 *
 * One page carrying the month grid, the next community-work day, and the
 * notices explaining anything that moved — so a fan checking "is my match still
 * on" has a single place to look.
 */
const CalendarPage = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-page pb-20">
      <Seo
        title={t('umuganda.calendarTitle')}
        description={t('umuganda.calendarDescription')}
      />

      <ResponsiveWrapper className="space-y-8 py-8 sm:py-12">
        <header className="space-y-2">
          <h1 className="font-display text-2xl font-semibold text-primary sm:text-3xl">
            {t('umuganda.calendarTitle')}
          </h1>
          <p className="max-w-2xl text-sm text-secondary">
            {t('umuganda.calendarDescription')}
          </p>
        </header>

        <UpcomingUmuganda />

        <UmugandaCalendar />

        <UmugandaNotices limit={10} heading={t('umuganda.notices')} />
      </ResponsiveWrapper>
      {/* Advertising sits at the FOOT of the page, after the content, never
          spliced into it. An advert dropped between two fixtures or two
          paragraphs interrupts the thing the reader came for; down here it is
          the last item on the screen and costs the page nothing. AdSlot
          collapses to nothing when the position has no inventory. */}
      <div className="mx-auto max-w-3xl px-4 pb-8 lg:max-w-6xl lg:px-6 lg:pb-12">
        <PageAd position="calendar" />
      </div>
    </div>
  );
};

export default CalendarPage;
