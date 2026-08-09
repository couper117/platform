import React from 'react';
import { Link } from 'react-router-dom';
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
 */

const SOCIALS = [
  { href: 'https://facebook.com', label: 'Facebook', icon: Facebook },
  { href: 'https://twitter.com', label: 'X / Twitter', icon: Twitter },
  { href: 'https://instagram.com', label: 'Instagram', icon: Instagram },
  { href: 'https://youtube.com', label: 'YouTube', icon: Youtube },
];

const EXPLORE = [
  ['Choose a sport', '/'],
  ['Matches', '/fixtures'],
  ['Results', '/results'],
  ['Leagues', '/leagues'],
  ['News', '/news'],
];

const PROGRAMMES = [
  ['Amashuri Games', '/amashuri'],
  ['Championships', '/amashuri/championships'],
  ['Schools', '/amashuri/schools'],
  ['Register a team', '/auth/team/register'],
  ['Contact', '/contact'],
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

const Column = ({ title, links }) => (
  <div>
    <h3 className="mb-5 text-base font-bold text-white">{title}</h3>
    <ul className="space-y-3">
      {links.map(([label, to]) => (
        <FooterLink key={to} to={to}>
          {label}
        </FooterLink>
      ))}
    </ul>
  </div>
);

const Footer = () => (
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
          <p className="mb-6 max-w-xs text-sm leading-relaxed">
            The digital home of Rwandan sport — every league, every match, every athlete, from the
            national leagues to the Amashuri Games.
          </p>
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

        <Column title="Explore" links={EXPLORE} />
        <Column title="Programmes" links={PROGRAMMES} />

        {/* Newsletter */}
        <div>
          <h3 className="mb-5 text-base font-bold text-white">Stay in the game</h3>
          <p className="mb-4 text-sm leading-relaxed">
            Fixtures, results and transfer news — a short digest, once a week.
          </p>
          <form
            className="flex flex-col gap-2.5 lg:flex-row"
            onSubmit={(e) => e.preventDefault()}
          >
            <label htmlFor="footer-email" className="sr-only">
              Email address
            </label>
            <input
              id="footer-email"
              type="email"
              required
              placeholder="you@example.com"
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
              Subscribe
            </button>
          </form>

          <ul className="mt-6 space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <MapPin size={13} className="shrink-0 text-brand-bright" aria-hidden="true" /> Kigali, Rwanda
            </li>
            <li className="flex items-center gap-2">
              <Mail size={13} className="shrink-0 text-brand-bright" aria-hidden="true" /> info@rwasport.rw
            </li>
            <li className="flex items-center gap-2">
              <Phone size={13} className="shrink-0 text-brand-bright" aria-hidden="true" /> +250 788 000 000
            </li>
          </ul>
        </div>
      </div>

      <hr className="my-10 border-white/10" />

      <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
        <p>© {new Date().getFullYear()} RwaSport. In partnership with MINISPORTS Rwanda.</p>
        <div className="flex gap-5">
          <Link to="/privacy" className="transition-colors hover:text-brand-bright">
            Privacy
          </Link>
          <Link to="/terms" className="transition-colors hover:text-brand-bright">
            Terms
          </Link>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
