import React from 'react';
import ResponsiveWrapper from '../../components/shared/ResponsiveWrapper';
import Seo from '../../components/shared/Seo';

// The privacy notice has to carry everything Law N° 058/2021 art. 42 requires a
// data subject to be told at collection: who the controller is, why the data is
// processed and on what basis, who receives it, how long it is kept, the rights
// available and how to exercise them, whether it leaves Rwanda, and the right to
// appeal to the supervisory authority.
const CONTENT = {
  privacy: {
    title: 'Privacy Policy',
    intro:
      'This notice explains what personal data RwaSport collects, why, and what you can do about it. '
      + 'It is written to meet Law N° 058/2021 of 13/10/2021 relating to the protection of personal data and privacy, '
      + 'supervised in Rwanda by the National Cyber Security Authority (NCSA).',
    sections: [
      ['Who is responsible',
        'RwaSport — the Rwanda National Sports Platform, operated under the Ministry of Sports — is the data controller. '
        + 'Privacy questions and requests go to our data protection contact at privacy@rwasport.rw.'],
      ['What we collect',
        'Account details (name, username, email, phone). For registered players and student athletes: name, date of birth, '
        + 'nationality, gender, position and shirt number, identity or birth-certificate reference, and — for school athletes — '
        + 'class, student code and a parent or guardian\u2019s name and phone number. We also keep verification documents you upload, '
        + 'and page-view records that include your IP address.'],
      ['Why we use it, and on what basis',
        'To run competitions: confirm a player or athlete is eligible for their age category and competition, publish fixtures, '
        + 'team sheets and results, verify submitted documents, and reach a parent or guardian in an emergency. '
        + 'We rely on your consent, on performing our agreement with your team or school, and on the public-interest duty of '
        + 'organising national sport (art. 46).'],
      ['Children',
        'Most Amashuri Games athletes are children. Where an athlete is under 16, we register them only when a parent or '
        + 'guardian has consented, and we record who gave that consent (art. 9). Consent can be withdrawn at any time through '
        + 'the school or by contacting us, and the athlete is then removed from the register.'],
      ['What is published',
        'Public pages show only what a team sheet shows: name, position, shirt number, team and competition. '
        + 'Dates of birth, identity numbers, guardian phone numbers, student codes and any disability information are never '
        + 'published — they are visible only to the administrators who carry out eligibility, verification and safeguarding duties.'],
      ['Sensitive data',
        'Disability information is sensitive personal data under art. 3(2). It is collected only to run inclusive categories, '
        + 'is restricted to staff performing that duty, and is never shown publicly (art. 11).'],
      ['Who else sees it',
        'Your school or club administrators, the relevant federation or league, and the Ministry of Sports. '
        + 'We use service providers for hosting, media storage, messaging and payments; they process data on our instructions only.'],
      ['How long we keep it',
        'Competition records are kept for the seasons they belong to. Page-view records are deleted after 90 days, '
        + 'administrative audit records after one year, and expired sign-in tokens after 30 days (art. 52).'],
      ['Your rights',
        'You may ask for a copy of your data, correct it, have it erased, object to or restrict its processing, and receive it '
        + 'in a portable format (arts. 18–24). A parent or guardian may exercise these for their child. '
        + 'We answer within 30 days. Signed-in users can download their own record immediately from their account. '
        + 'To make a request, email privacy@rwasport.rw or use the request form on our contact page.'],
      ['Where your data is stored',
        'Personal data is held in Rwanda unless we hold a valid registration certificate from the supervisory authority '
        + 'permitting storage elsewhere (arts. 48 and 50). Where data is transferred outside Rwanda, it is under a written '
        + 'contract with appropriate safeguards.'],
      ['Security and breaches',
        'We use access controls, encrypted connections and audited administrative actions. If a breach puts your rights at '
        + 'serious risk, we notify the supervisory authority within 48 hours and tell you directly (arts. 43–45).'],
      ['Complaints',
        'If you are unhappy with how we handle your data you may appeal to the National Cyber Security Authority, '
        + 'the supervisory authority for data protection in Rwanda.'],
    ],
  },
  terms: {
    title: 'Terms of Service',
    intro: 'By using RwaSport you agree to these terms.',
    sections: [
      ['Accounts', 'You are responsible for the accuracy of information you provide and for keeping your credentials secure.'],
      ['Acceptable use', 'You agree not to misuse the platform, upload unlawful content, or attempt to disrupt the service.'],
      ['Content', 'Team and match data you submit may be displayed publicly as part of league operations. Personal details of players and student athletes are not published — see the Privacy Policy.'],
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
