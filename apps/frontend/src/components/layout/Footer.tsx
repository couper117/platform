import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Facebook, Instagram, Youtube, Twitter, Mail, Phone, MapPin, ArrowRight } from 'lucide-react';

const socials = [
  { icon: Facebook, label: 'Facebook', href: '#' },
  { icon: Twitter, label: 'X', href: '#' },
  { icon: Instagram, label: 'Instagram', href: '#' },
  { icon: Youtube, label: 'YouTube', href: '#' },
];

const quickLinks = [
  { to: '/leagues', key: 'footer.all_leagues' },
  { to: '/fixtures', key: 'footer.upcoming_fixtures' },
  { to: '/results', key: 'footer.match_results' },
  { to: '/news', key: 'footer.latest_news' },
];

const competitions = [
  { to: '/amashuri', key: 'nav.amashuri' },
  { to: '/amashuri/championships', key: 'footer.championships' },
  { to: '/amashuri/schools', key: 'footer.school_directory' },
  { to: '/amashuri/standings', key: 'footer.standings' },
];

const contact = [
  { icon: Mail, text: 'info@rwasport.rw' },
  { icon: Phone, text: '+250 123 456 789' },
  { icon: MapPin, text: 'Kigali, Rwanda' },
];

const ColHeading = ({ children }) => (
  <h4 className="flex items-center gap-2 font-display text-sm mb-5 text-red dark:text-rwanda-yellow uppercase tracking-widest">
    <span className="w-1.5 h-1.5 rounded-full bg-red dark:bg-rwanda-yellow" />
    {children}
  </h4>
);

const Footer = () => {
  const { t } = useTranslation();
  return (
    <footer className="relative bg-white text-surface-dark dark:bg-surface-dark dark:text-white overflow-hidden border-t border-surface-3 dark:border-transparent">
      {/* Rwanda tri-colour top accent */}
      <div className="h-1 w-full bg-gradient-to-r from-rwanda-green via-rwanda-yellow to-rwanda-blue" />

      {/* Subtle dot texture (neutral so it reads on light & dark) */}
      <div
        className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#9ca3af 1px, transparent 1px)',
          backgroundSize: '26px 26px',
          maskImage: 'radial-gradient(ellipse at top, black 20%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse at top, black 20%, transparent 80%)',
        }}
      />

      <div className="relative container mx-auto px-4 pt-12 sm:pt-16 pb-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 lg:gap-8">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-1 space-y-5">
            <Link to="/" className="inline-flex items-center gap-2 group">
              <div className="bg-red p-1.5 rounded-lg shadow-lg shadow-red/30 group-hover:rotate-6 transition-transform">
                <span className="text-xl font-display leading-none text-white uppercase tracking-tighter">RwaSport</span>
              </div>
            </Link>
            <p className="text-sm text-surface-dark/50 dark:text-white/50 leading-relaxed max-w-xs">
              {t('footer.about')}
            </p>
            <div className="flex gap-3">
              {socials.map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 rounded-full border border-surface-3 dark:border-white/15 flex items-center justify-center text-surface-dark/60 dark:text-white/60 hover:bg-red hover:border-red hover:text-white transition-all"
                >
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <ColHeading>{t('footer.quick_links')}</ColHeading>
            <ul className="space-y-3 text-sm">
              {quickLinks.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-surface-dark/60 dark:text-white/60 hover:text-red hover:translate-x-1 inline-block transition-all">{t(l.key)}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Competitions */}
          <div>
            <ColHeading>{t('footer.competitions')}</ColHeading>
            <ul className="space-y-3 text-sm">
              {competitions.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-surface-dark/60 dark:text-white/60 hover:text-red hover:translate-x-1 inline-block transition-all">{t(l.key)}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="col-span-2 lg:col-span-1">
            <ColHeading>{t('footer.contact_us')}</ColHeading>
            <ul className="space-y-4 text-sm">
              {contact.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full border border-surface-3 dark:border-white/15 flex items-center justify-center text-red shrink-0">
                    <Icon size={14} />
                  </span>
                  <span className="text-surface-dark/60 dark:text-white/60">{text}</span>
                </li>
              ))}
              <li className="pt-1">
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 bg-red text-white px-5 py-2.5 rounded-lg hover:bg-red-dark transition-all font-display text-xs uppercase tracking-widest shadow-lg shadow-red/20"
                >
                  {t('footer.send_message')}
                  <ArrowRight size={14} />
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Decorative divider */}
        <div className="flex items-center justify-center gap-3 sm:gap-5 my-8 sm:my-12">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-surface-3 dark:to-white/15" />
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-rwanda-green" />
            <span className="w-1.5 h-1.5 rounded-full bg-rwanda-yellow" />
            <span className="w-1.5 h-1.5 rounded-full bg-rwanda-blue" />
            <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-[0.2em] sm:tracking-[0.35em] text-surface-dark/40 dark:text-white/40 ml-1 whitespace-nowrap">Umurage w'Imikino</span>
          </div>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-surface-3 dark:to-white/15" />
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-3 sm:gap-4 text-center text-[10px] uppercase tracking-widest text-surface-dark/40 dark:text-white/40">
          <p>{t('footer.copyright', { year: 2026 })}</p>
          <div className="flex gap-5 sm:gap-6">
            <Link to="/privacy" className="hover:text-red transition-colors">{t('footer.privacy')}</Link>
            <Link to="/terms" className="hover:text-red transition-colors">{t('footer.terms')}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
