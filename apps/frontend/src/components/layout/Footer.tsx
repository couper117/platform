import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Facebook, Twitter, Instagram, Youtube, Send, MapPin, Mail, Phone } from 'lucide-react';
import cn from '../ui/cn';

/**
 * Footer, following the Tembera reference.
 *
 * ANATOMY from the reference: a near-black #0F0F0F slab regardless of theme, a
 * wordmark with its second half in green, a four-column grid (brand + description
 * + socials, two link columns, newsletter), a hairline divider, then a bottom bar.
 * Links slide 5px right and turn green on hover; social tiles are 42px squares
 * with an 8px radius that fill green and lift on hover.
 *
 * IT STAYS DARK IN BOTH THEMES. The reference's footer is pitch black under a
 * white page, and that contrast is the point — it closes the page. So this uses
 * literal dark values rather than surface tokens, and is the one component in the
 * system exempt from theming.
 *
 * Link labels are i18n keys rather than literals, reusing the reviewed nav.* and
 * footer.* strings wherever one already said the same thing.
 */

const SOCIALS = [
  { href: 'https://facebook.com', label: 'Facebook', icon: Facebook },
  { href: 'https://twitter.com', label: 'X / Twitter', icon: Twitter },
  { href: 'https://instagram.com', label: 'Instagram', icon: Instagram },
  { href: 'https://youtube.com', label: 'YouTube', icon: Youtube },
];

const EXPLORE = [
  ['footer.choose_sport', '/'],
  ['nav.fixtures', '/fixtures'],
  ['nav.calendar', '/calendar'],
  ['nav.results', '/results'],
  ['nav.leagues', '/leagues'],
  ['nav.news', '/news'],
];

const PROGRAMMES = [
  ['nav.amashuri', '/amashuri'],
  ['footer.championships', '/amashuri/championships'],
  ['footer.school_directory', '/amashuri/schools'],
  ['nav.register_team', '/auth/team/register'],
  ['footer.contact_us', '/contact'],
];

const CONTACT = [
  { icon: MapPin, text: 'Kigali, Rwanda' },
  { icon: Mail, text: 'info@rwasport.rw' },
  { icon: Phone, text: '+250 788 000 000' },
];

const FooterLink = ({ to, children }) => (
  <li>
    <Link
      to={to}
      className="inline-block text-sm text-white/60 transition-all duration-200 ease-standard hover:translate-x-1 hover:text-brand-bright"
    >
      {children}
    </Link>
  </li>
);

const Column = ({ title, links, t }) => (
  <div>
    <h3 className="mb-5 text-base font-bold text-white">{title}</h3>
    <ul className="space-y-3">
      {links.map(([labelKey, to]) => (
        <FooterLink key={to} to={to}>
          {t(labelKey)}
        </FooterLink>
      ))}
    </ul>
  </div>
);

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="mt-16 border-t border-white/10 bg-[#0F0F0F] pb-8 pt-16 text-white/60">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <Link
              to="/"
              className="mb-5 inline-block font-display text-2xl font-extrabold tracking-tight text-white"
            >
              Rwa<span className="text-brand-bright">Sport</span>
            </Link>
            <p className="mb-6 max-w-xs text-sm leading-relaxed">{t('footer.about')}</p>
            <div className="flex gap-2.5">
              {SOCIALS.map(({ href, label, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className={cn(
                    'flex h-tap w-tap items-center justify-center rounded-control border border-white/15 bg-white/5 text-white',
                    'transition-all duration-200 ease-standard hover:-translate-y-0.5 hover:border-brand-bright hover:bg-brand-bright'
                  )}
                >
                  <Icon size={16} aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>

          <Column title={t('nav.explore')} links={EXPLORE} t={t} />
          <Column title={t('footer.programmes')} links={PROGRAMMES} t={t} />

          {/* Newsletter */}
          <div>
            <h3 className="mb-5 text-base font-bold text-white">{t('footer.newsletter_title')}</h3>
            <p className="mb-4 text-sm leading-relaxed">{t('footer.newsletter_body')}</p>
            <form
              className="flex flex-col gap-2.5 lg:flex-row"
              onSubmit={(e) => e.preventDefault()}
            >
              <label htmlFor="footer-email" className="sr-only">
                {t('footer.email_address')}
              </label>
              <input
                id="footer-email"
                type="email"
                required
                placeholder={t('footer.email_placeholder')}
                className={cn(
                  'min-h-tap flex-1 rounded-control border border-white/15 bg-white/5 px-4 text-white',
                  'placeholder:text-white/35 focus:border-brand-bright focus:bg-white/10 focus:outline-none'
                )}
              />
              <button
                type="submit"
                className={cn(
                  'inline-flex min-h-tap items-center justify-center gap-2 rounded-control bg-brand-strong px-5',
                  'text-sm font-bold uppercase tracking-wider text-white',
                  'transition-all duration-200 ease-standard hover:bg-brand-hover hover:shadow-brand'
                )}
              >
                <Send size={14} aria-hidden="true" />
                {t('footer.subscribe')}
              </button>
            </form>

            <ul className="mt-6 space-y-2 text-sm">
              {CONTACT.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-2">
                  <Icon size={13} className="shrink-0 text-brand-bright" aria-hidden="true" /> {text}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <hr className="my-10 border-white/10" />

        <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
          <p>{t('footer.copyright_partnership', { year: new Date().getFullYear() })}</p>
          <div className="flex gap-5">
            <Link to="/privacy" className="transition-colors hover:text-brand-bright">
              {t('footer.privacy')}
            </Link>
            <Link to="/terms" className="transition-colors hover:text-brand-bright">
              {t('footer.terms')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
