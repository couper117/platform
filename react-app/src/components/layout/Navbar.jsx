import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X, LogOut, ChevronRight, ChevronDown, Languages, Home, Search, UserPlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../../store/authStore';
import ThemeToggle from '../ui/ThemeToggle';
import { useCommandPalette } from '../../context/CommandPaletteContext';
import { roleHome } from '../../utils/roleHome';
import LiveScoreTicker from '../home/LiveScoreTicker';

const Navbar = () => {
  const { t, i18n } = useTranslation();
  const { isAuthenticated, user, logout, role } = useAuthStore();
  const displayName = user?.fullName || user?.username || 'User';
  const dashboardPath = roleHome(role);
  const { openPalette } = useCommandPalette();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('rnsp-lang', lng);
    setIsLangOpen(false);
  };

  const navLinks = [
    { to: '/', label: t('nav.home'), icon: <Home size={16} /> },
    { to: '/leagues', label: t('nav.leagues') },
    { to: '/fixtures', label: t('nav.fixtures') },
    { to: '/results', label: t('nav.results') },
    { to: '/news', label: t('nav.news') },
    { to: '/amashuri', label: t('nav.amashuri'), highlight: true },
  ];

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'fr', label: 'Français' },
    { code: 'rw', label: 'Kinyarwanda' },
    { code: 'sw', label: 'Kiswahili' },
  ];

  return (
    <nav className="bg-surface-dark text-white sticky top-0 z-[100] shadow-xl border-b border-white/5">
      {/* Top ribbon — live scores (isengesho-style scrolling strip) */}
      <LiveScoreTicker />

      <div className="relative container mx-auto px-4 py-3 flex items-center justify-between gap-4 lg:grid lg:grid-cols-[1fr_auto_1fr]">
        {/* LEFT: Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-4 xl:gap-6 font-display text-[13px] uppercase tracking-widest lg:justify-self-start">
          {navLinks.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({isActive}) =>
                `relative whitespace-nowrap transition-all hover:text-red ${isActive ? 'text-red' : link.highlight ? 'text-rwanda-yellow' : 'text-white/70'}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>

        {/* CENTER: Logo (compact centered mark on desktop like isengesho) */}
        <Link to="/" className="flex items-center gap-2 group lg:justify-self-center">
          <div className="bg-red p-1.5 rounded-lg transform group-hover:rotate-6 transition-transform shadow-lg shadow-red/30">
            <span className="text-xl font-display leading-none text-white uppercase tracking-tighter">RwaSport</span>
          </div>
        </Link>

        {/* RIGHT: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 lg:justify-self-end">
          {/* Search trigger */}
          <button
            onClick={openPalette}
            className="p-2 rounded-full text-white/50 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            aria-label="Search"
          >
            <Search size={18} />
          </button>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Language Switcher (isengesho-style pill) */}
          <div className="relative hidden sm:block">
            <button
              onClick={() => setIsLangOpen(!isLangOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/15 text-white/70 hover:text-white hover:border-white/30 transition-all"
            >
              <Languages size={15} />
              <span className="text-[10px] font-bold uppercase tracking-wider">{i18n.language}</span>
              <ChevronDown size={12} className="opacity-60" />
            </button>
            {isLangOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-surface-dark border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50">
                {languages.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => changeLanguage(lang.code)}
                    className={`w-full text-left px-4 py-3 text-xs font-bold uppercase tracking-widest hover:bg-white/5 transition-colors ${i18n.language === lang.code ? 'text-red' : 'text-white/60'}`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Auth + primary CTA */}
          <div className="hidden md:flex items-center gap-2">
            {isAuthenticated ? (
              <div className="flex items-center gap-2 bg-white/5 pl-1 pr-1 py-1 rounded-full border border-white/10">
                <Link
                  to={dashboardPath}
                  className="flex items-center gap-2 px-3 py-1 hover:bg-white/10 rounded-full transition-colors"
                >
                  <div className="w-6 h-6 bg-red rounded-full flex items-center justify-center text-[10px] font-bold uppercase">
                    {displayName.charAt(0)}
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-tighter">{displayName.split(' ')[0]}</span>
                </Link>
                <button
                  onClick={logout}
                  className="p-1.5 text-white/40 hover:text-red transition-colors"
                  title={t('nav.logout')}
                >
                  <LogOut size={14} />
                </button>
              </div>
            ) : (
              <>
                <Link to="/auth/login" className="text-[11px] font-bold uppercase tracking-widest text-white/70 hover:text-white transition-colors px-2">
                  {t('nav.login')}
                </Link>
                <Link
                  to="/auth/team/register"
                  className="flex items-center gap-2 bg-red text-white font-display text-sm uppercase tracking-widest px-5 py-2 rounded-lg hover:bg-red-dark transition-all hover:scale-105 active:scale-95 shadow-lg shadow-red/20"
                >
                  <UserPlus size={16} />
                  <span>Register Team</span>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 text-white/80 hover:text-white transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-[60px] bg-surface-dark z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="p-6 space-y-8 overflow-y-auto max-h-screen">
            <div className="flex flex-col space-y-4">
              {navLinks.map(link => (
                <Link 
                  key={link.to} 
                  to={link.to} 
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex justify-between items-center text-2xl font-display uppercase tracking-tight py-2 border-b border-white/5 ${link.highlight ? 'text-rwanda-yellow' : 'text-white'}`}
                >
                  <div className="flex items-center space-x-3">
                    {link.icon}
                    <span>{link.label}</span>
                  </div>
                  <ChevronRight className="text-white/20" />
                </Link>
              ))}
            </div>

            {/* Mobile Appearance */}
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
              <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-white/40">Appearance</span>
              <ThemeToggle />
            </div>

            {/* Mobile Language Switcher */}
            <div className="space-y-4">
              <h3 className="text-[10px] uppercase font-bold tracking-[0.3em] text-white/30">Language</h3>
              <div className="grid grid-cols-2 gap-2">
                {languages.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => changeLanguage(lang.code)}
                    className={`py-3 rounded-lg border text-[10px] font-bold uppercase tracking-widest transition-all ${i18n.language === lang.code ? 'border-red text-red bg-red/5' : 'border-white/10 text-white/40 bg-white/5'}`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-8">
              {isAuthenticated ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-4 p-4 bg-white/5 rounded-xl border border-white/10">
                    <div className="w-12 h-12 bg-red rounded-full flex items-center justify-center text-xl font-bold uppercase">
                      {displayName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-display text-xl leading-none">{displayName}</p>
                      <p className="text-[10px] uppercase tracking-widest text-white/40">{(role || '').replace('_', ' ')}</p>
                    </div>
                  </div>
                  <Link
                    to={dashboardPath}
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center justify-center w-full bg-white/5 py-4 rounded-xl font-display text-lg uppercase tracking-widest border border-white/10"
                  >
                    {t('nav.dashboard')}
                  </Link>
                  <button 
                    onClick={() => { logout(); setIsMenuOpen(false); }}
                    className="w-full text-red font-display text-lg uppercase py-4"
                  >
                    {t('nav.logout')}
                  </button>
                </div>
              ) : (
                <Link 
                  to="/auth/login" 
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center justify-center w-full bg-red py-4 rounded-xl font-display text-xl uppercase tracking-widest shadow-xl shadow-red/20"
                >
                  {t('nav.login')}
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
