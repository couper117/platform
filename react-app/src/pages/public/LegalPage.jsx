import React from 'react';
import { useTranslation } from 'react-i18next';
import ResponsiveWrapper from '../../components/shared/ResponsiveWrapper';
import Seo from '../../components/shared/Seo';

const SECTION_COUNT = 5;

const LegalPage = ({ type }) => {
  const { t } = useTranslation();
  const doc = type === 'terms' ? 'terms' : 'privacy';
  const c = {
    title: t(`legal.${doc}.title`),
    intro: t(`legal.${doc}.intro`),
    sections: Array.from({ length: SECTION_COUNT }, (_, i) => [
      t(`legal.${doc}.s${i + 1}_h`),
      t(`legal.${doc}.s${i + 1}_body`),
    ]),
  };
  return (
    <div className="bg-surface-2 dark:bg-surface-dark min-h-screen pb-24">
      <Seo title={c.title} description={c.intro} />
      <section className="bg-surface-dark py-16 sm:py-20">
        <ResponsiveWrapper>
          <h1 className="text-4xl sm:text-6xl font-display text-white uppercase tracking-tighter">{c.title}</h1>
          <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.3em] mt-3">{t('auth.login_subtitle')}</p>
        </ResponsiveWrapper>
      </section>
      <ResponsiveWrapper className="mt-12 max-w-3xl space-y-8">
        <p className="text-lg opacity-70 leading-relaxed border-l-4 border-red pl-6">{c.intro}</p>
        {c.sections.map(([h, body]) => (
          <div key={h} className="space-y-2">
            <h2 className="font-display text-2xl uppercase tracking-tight">{h}</h2>
            <p className="opacity-60 leading-relaxed">{body}</p>
          </div>
        ))}
        <p className="text-[10px] uppercase font-bold tracking-widest opacity-30 pt-8">{t('legal.last_updated', { year: 2026 })}</p>
      </ResponsiveWrapper>
    </div>
  );
};

export default LegalPage;
