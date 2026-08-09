import React from 'react';
import ResponsiveWrapper from '../../components/shared/ResponsiveWrapper';
import Seo from '../../components/shared/Seo';

const CONTENT = {
  privacy: {
    title: 'Privacy Policy',
    intro: 'RwaSport respects your privacy. This policy explains what we collect and how we use it.',
    sections: [
      ['Information we collect', 'Account details (name, email, phone), team and player information you submit, and basic usage analytics such as pages visited.'],
      ['How we use it', 'To operate leagues and competitions, verify teams and players, display fixtures and results, and improve the platform.'],
      ['Document handling', 'Uploaded verification documents are stored securely and only accessible to authorised administrators for review.'],
      ['Your rights', 'You may request access to, correction of, or deletion of your personal data by contacting us.'],
      ['Contact', 'For privacy questions, email info@rwasport.rw.'],
    ],
  },
  terms: {
    title: 'Terms of Service',
    intro: 'By using RwaSport you agree to these terms.',
    sections: [
      ['Accounts', 'You are responsible for the accuracy of information you provide and for keeping your credentials secure.'],
      ['Acceptable use', 'You agree not to misuse the platform, upload unlawful content, or attempt to disrupt the service.'],
      ['Content', 'Team, player, and match data you submit may be displayed publicly as part of league operations.'],
      ['Verification & subscriptions', 'Team verification and league participation may be subject to review and applicable fees.'],
      ['Changes', 'We may update these terms; continued use constitutes acceptance of the updated terms.'],
    ],
  },
};

const LegalPage = ({ type }) => {
  const c = CONTENT[type] || CONTENT.privacy;
  return (
    <div className="bg-surface-2 dark:bg-surface-dark min-h-screen pb-24">
      <Seo title={c.title} description={c.intro} />
      <section className="bg-surface-dark py-16 sm:py-20">
        <ResponsiveWrapper>
          <h1 className="text-4xl sm:text-6xl font-display text-white uppercase tracking-tighter">{c.title}</h1>
          <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.3em] mt-3">RwaSport Platform</p>
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
        <p className="text-[10px] uppercase font-bold tracking-widest opacity-30 pt-8">Last updated: 2026</p>
      </ResponsiveWrapper>
    </div>
  );
};

export default LegalPage;
