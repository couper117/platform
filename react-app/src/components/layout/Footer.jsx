import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Youtube, Twitter, Mail, Phone, MapPin, ArrowRight } from 'lucide-react';

const socials = [
  { icon: Facebook, label: 'Facebook', href: '#' },
  { icon: Twitter, label: 'X', href: '#' },
  { icon: Instagram, label: 'Instagram', href: '#' },
  { icon: Youtube, label: 'YouTube', href: '#' },
];

const quickLinks = [
  { to: '/leagues', label: 'All Leagues' },
  { to: '/fixtures', label: 'Upcoming Fixtures' },
  { to: '/results', label: 'Match Results' },
  { to: '/news', label: 'Latest News' },
];

const competitions = [
  { to: '/amashuri', label: 'Amashuri Games' },
  { to: '/amashuri/championships', label: 'Championships' },
  { to: '/amashuri/schools', label: 'School Directory' },
  { to: '/amashuri/standings', label: 'Standings' },
];

const contact = [
  { icon: Mail, text: 'info@rwasport.rw' },
  { icon: Phone, text: '+250 123 456 789' },
  { icon: MapPin, text: 'Kigali, Rwanda' },
];

const ColHeading = ({ children }) => (
  <h4 className="flex items-center gap-2 font-display text-sm mb-5 text-rwanda-yellow uppercase tracking-widest">
    <span className="w-1.5 h-1.5 rounded-full bg-rwanda-yellow" />
    {children}
  </h4>
);

const Footer = () => {
  return (
    <footer className="relative bg-surface-dark text-white overflow-hidden">
      {/* Rwanda tri-colour top accent */}
      <div className="h-1 w-full bg-gradient-to-r from-rwanda-green via-rwanda-yellow to-rwanda-blue" />

      {/* Subtle dot texture */}
      <div
        className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)',
          backgroundSize: '26px 26px',
          maskImage: 'radial-gradient(ellipse at top, black 20%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse at top, black 20%, transparent 80%)',
        }}
      />

      <div className="relative container mx-auto px-4 pt-16 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          {/* Brand */}
          <div className="space-y-5">
            <Link to="/" className="inline-flex items-center gap-2 group">
              <div className="bg-red p-1.5 rounded-lg shadow-lg shadow-red/30 group-hover:rotate-6 transition-transform">
                <span className="text-xl font-display leading-none text-white uppercase tracking-tighter">RwaSport</span>
              </div>
            </Link>
            <p className="text-sm text-white/50 leading-relaxed max-w-xs">
              The heartbeat of Rwandan sport — managing leagues, teams, and athletes across the nation.
            </p>
            <div className="flex gap-3">
              {socials.map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 rounded-full border border-white/15 flex items-center justify-center text-white/60 hover:bg-red hover:border-red hover:text-white transition-all"
                >
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <ColHeading>Quick Links</ColHeading>
            <ul className="space-y-3 text-sm">
              {quickLinks.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-white/60 hover:text-red hover:translate-x-1 inline-block transition-all">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Competitions */}
          <div>
            <ColHeading>Competitions</ColHeading>
            <ul className="space-y-3 text-sm">
              {competitions.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-white/60 hover:text-red hover:translate-x-1 inline-block transition-all">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <ColHeading>Contact</ColHeading>
            <ul className="space-y-4 text-sm">
              {contact.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full border border-white/15 flex items-center justify-center text-red shrink-0">
                    <Icon size={14} />
                  </span>
                  <span className="text-white/60">{text}</span>
                </li>
              ))}
              <li className="pt-1">
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 bg-red text-white px-5 py-2.5 rounded-lg hover:bg-red-dark transition-all font-display text-xs uppercase tracking-widest shadow-lg shadow-red/20"
                >
                  Send a Message
                  <ArrowRight size={14} />
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Decorative divider (isengesho-style) */}
        <div className="flex items-center justify-center gap-5 my-12">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/15" />
          <div className="flex items-center gap-2 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-rwanda-green" />
            <span className="w-1.5 h-1.5 rounded-full bg-rwanda-yellow" />
            <span className="w-1.5 h-1.5 rounded-full bg-rwanda-blue" />
            <span className="text-[10px] font-bold uppercase tracking-[0.35em] text-white/40 ml-1">Umurage w'Imikino</span>
          </div>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/15" />
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] uppercase tracking-widest text-white/40">
          <p>&copy; 2026 RwaSport Platform. All rights reserved.</p>
          <div className="flex gap-6">
            <Link to="/privacy" className="hover:text-red transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-red transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
