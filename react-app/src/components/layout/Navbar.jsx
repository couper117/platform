import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Menu, X, LogOut, ChevronRight, ChevronDown, Languages, Search, UserPlus, LayoutGrid } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../../store/authStore';
import ThemeToggle from '../ui/ThemeToggle';
import { useCommandPalette } from '../../context/CommandPaletteContext';
import { roleHome } from '../../utils/roleHome';
import { getSports } from '../../api/endpoints/sports';
import SportIcon from '../shared/SportIcon';

const Navbar = () => {
  const { t, i18n } = useTranslation();
  const { isAuthenticated, user, logout, role } = useAuthStore();
  const displayName = user?.fullName || user?.username || 'User';
  const dashboardPath = roleHome(role);
  const { openPalette } = useCommandPalette();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);

  const { data: sportsRes } = useQuery({ queryKey: ['nav-sports'], queryFn: getSports, staleTime: 300000 });
  const sports = sportsRes?.data || [];
  const topSports = sports.slice(0, 6);

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('rnsp-lang', lng);
    setIsLangOpen(false);
  };
  const closeDrawer = () => setIsMenuOpen(false);

  const browseLinks = [
    { to: '/', label: t('nav.home', 'Home') },
    { to: '/fixtures', label: t('nav.fixtures', 'Fixtures') },
    { to: '/results', label: t('nav.results', 'Results') },
    { to: '/news', label: t('nav.news', 'News') },
    { to: '/amashuri', label: t('nav.amashuri', 'Amashuri Games'), highlight: true },
    { to: '/contact', label: t('nav.contact', 'Contact') },
  ];

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'fr', label: 'Français' },
    { code: 'rw', label: 'Kinyarwanda' },
    { code: 'sw', label: 'Kiswahili' },
  ];

  return (
    <nav className="bg-white text-surface-dark dark:bg-surface-dark dark:text-white sticky top-0 z-[100] shadow-lg dark:shadow-xl border-b border-surface-3 dark:border-white/5">
      <div className="relative container mx-auto px-4 py-3 flex items-center justify-between gap-4 lg:grid lg:grid-cols-[1fr_auto_1fr]">
        {/* LEFT: Sports nav */}
        <div className="hidden lg:flex items-center gap-3 xl:gap-5 font-display text-[12px] uppercase tracking-widest lg:justify-self-start">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `relative whitespace-nowrap transition-all hover:text-red ${isActive ? 'text-red' : 'text-surface-dark/70 dark:text-white/70'}`}
          >
            Explore
          </NavLink>
          {topSports.map((s, i) => (
            <NavLink
              key={s.id}
              to={`/sports/${s.slug}`}
              className={({ isActive }) =>
                `relative whitespace-nowrap transition-all hover:text-red ${isActive ? 'text-red' : 'text-surface-dark/70 dark:text-white/70'} ${i >= 4 ? 'hidden xl:block' : ''}`
              }
            >
              {s.name}
            </NavLink>
          ))}
          <button
            onClick={() => setIsMenuOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-surface-3 dark:border-white/15 text-surface-dark/60 dark:text-white/60 hover:text-red hover:border-red/40 dark:hover:text-white dark:hover:border-white/30 transition-all"
          >
            <LayoutGrid size={13} />
            <span className="text-[10px] tracking-wider">All Sports</span>
          </button>
        </div>

        {/* CENTER: Logo */}
        <Link to="/" className="flex items-center gap-2 group lg:justify-self-center">
          <div className="bg-red p-1.5 rounded-lg transform group-hover:rotate-6 transition-transform shadow-lg shadow-red/30">
            <span className="text-xl font-display leading-none text-white uppercase tracking-tighter">RwaSport</span>
          </div>
        </Link>

        {/* RIGHT: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 lg:justify-self-end">
          <button onClick={openPalette} className="p-2 rounded-full text-surface-dark/50 dark:text-white/50 hover:text-red dark:hover:text-white hover:bg-surface-2 dark:hover:bg-white/5 transition-colors cursor-pointer" aria-label="Search">
            <Search size={18} />
          </button>
          <ThemeToggle />

          <div className="relative">
            <button
              onClick={() => setIsLangOpen(!isLangOpen)}
              aria-label={t('nav.language', 'Language')}
              aria-haspopup="menu"
              aria-expanded={isLangOpen}
              className="flex items-center gap-1 px-2 py-1.5 sm:gap-1.5 sm:px-2.5 rounded-lg border border-surface-3 dark:border-white/15 text-surface-dark/70 dark:text-white/70 hover:text-red hover:border-red/40 dark:hover:text-white dark:hover:border-white/30 transition-all"
            >
              <Languages size={15} />
              <span className="text-[10px] font-bold uppercase tracking-wider">{i18n.language}</span>
              <ChevronDown size={12} className="opacity-60 hidden sm:block" />
            </button>
            {isLangOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-surface-dark border border-surface-3 dark:border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => changeLanguage(lang.code)}
                    aria-current={i18n.language === lang.code ? 'true' : undefined}
                    className={`w-full text-left px-4 py-3 text-xs font-bold uppercase tracking-widest hover:bg-surface-2 dark:hover:bg-white/5 transition-colors ${i18n.language === lang.code ? 'text-red' : 'text-surface-dark/70 dark:text-white/60'}`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="hidden md:flex items-center gap-2">
            {isAuthenticated ? (
              <div className="flex items-center gap-2 bg-surface-2 dark:bg-white/5 pl-1 pr-1 py-1 rounded-full border border-surface-3 dark:border-white/10">
                <Link to={dashboardPath} className="flex items-center gap-2 px-3 py-1 hover:bg-surface-3 dark:hover:bg-white/10 rounded-full transition-colors">
                  <div className="w-6 h-6 bg-red rounded-full flex items-center justify-center text-[10px] font-bold uppercase text-white">{displayName.charAt(0)}</div>
                  <span className="text-[10px] uppercase font-bold tracking-tighter">{displayName.split(' ')[0]}</span>
                </Link>
                <button onClick={logout} className="p-1.5 text-surface-dark/40 dark:text-white/40 hover:text-red transition-colors" title={t('nav.logout')}><LogOut size={14} /></button>
              </div>
            ) : (
              <>
                <Link to="/auth/login" className="text-[11px] font-bold uppercase tracking-widest text-surface-dark/70 dark:text-white/70 hover:text-red dark:hover:text-white transition-colors px-2">{t('nav.login')}</Link>
                <Link to="/auth/team/register" className="flex items-center gap-2 bg-red text-white font-display text-sm uppercase tracking-widest px-5 py-2 rounded-lg hover:bg-red-dark transition-all hover:scale-105 active:scale-95 shadow-lg shadow-red/20">
                  <UserPlus size={16} /><span>Register Team</span>
                </Link>
              </>
            )}
          </div>

          <button
            className="lg:hidden p-2 text-surface-dark/80 dark:text-white/80 hover:text-red dark:hover:text-white transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* ALL-SPORTS DRAWER */}
      {isMenuOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-[110] animate-in fade-in duration-200" onClick={closeDrawer} />
          <aside className="fixed top-0 right-0 h-full w-[88%] max-w-md bg-white text-surface-dark dark:bg-surface-dark dark:text-white z-[120] shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between px-6 py-5 border-b border-surface-3 dark:border-white/10 sticky top-0 bg-white dark:bg-surface-dark z-10">
              <span className="font-display text-2xl uppercase tracking-tight flex items-center gap-2"><Menu size={20} className="text-red" /> Menu</span>
              <button onClick={closeDrawer} aria-label="Close" className="p-2 text-surface-dark/60 dark:text-white/60 hover:text-red"><X size={24} /></button>
            </div>

            <div className="p-5 space-y-7">
              {/* Account — top priority */}
              {isAuthenticated ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-4 p-4 bg-surface-2 dark:bg-white/5 rounded-xl border border-surface-3 dark:border-white/10">
                    <div className="w-12 h-12 bg-red rounded-full flex items-center justify-center text-xl font-bold uppercase text-white">{displayName.charAt(0)}</div>
                    <div className="min-w-0">
                      <p className="font-display text-xl leading-none truncate">{displayName}</p>
                      <p className="text-[10px] uppercase tracking-widest text-surface-dark/40 dark:text-white/40 mt-1">{(role || '').replace('_', ' ')}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Link to={dashboardPath} onClick={closeDrawer} className="flex items-center justify-center bg-red text-white py-4 rounded-xl font-display uppercase tracking-widest shadow-lg shadow-red/20">{t('nav.dashboard')}</Link>
                    <button onClick={() => { logout(); closeDrawer(); }} className="flex items-center justify-center gap-2 bg-surface-2 dark:bg-white/5 border border-surface-3 dark:border-white/10 py-4 rounded-xl font-display uppercase tracking-widest text-red"><LogOut size={16} /> {t('nav.logout')}</button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Link to="/auth/login" onClick={closeDrawer} className="flex items-center justify-center gap-2 bg-surface-2 dark:bg-white/5 border border-surface-3 dark:border-white/10 py-4 rounded-xl font-display uppercase tracking-widest">
                    <ChevronRight size={16} className="text-red" /> {t('nav.login', 'Login')}
                  </Link>
                  <Link to="/auth/team/register" onClick={closeDrawer} className="flex items-center justify-center gap-2 bg-red text-white py-4 rounded-xl font-display uppercase tracking-widest shadow-lg shadow-red/20">
                    <UserPlus size={16} /> Register
                  </Link>
                </div>
              )}

              {/* Browse */}
              <div className="space-y-1">
                <h3 className="text-[10px] uppercase font-bold tracking-[0.3em] text-surface-dark/30 dark:text-white/30 mb-2">Browse</h3>
                {browseLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={closeDrawer}
                    className={`flex justify-between items-center py-3 border-b border-surface-3 dark:border-white/5 font-display uppercase tracking-tight text-lg ${link.highlight ? 'text-rwanda-yellow' : 'text-surface-dark/80 dark:text-white/80'} hover:text-red transition-colors`}
                  >
                    <span>{link.label}</span>
                    <ChevronRight size={18} className="text-surface-dark/20 dark:text-white/20" />
                  </Link>
                ))}
              </div>

              {/* All sports */}
              <div className="space-y-3">
                <h3 className="text-[10px] uppercase font-bold tracking-[0.3em] text-surface-dark/30 dark:text-white/30">All Sports</h3>
                <div className="grid grid-cols-2 gap-3">
                  {sports.map((s) => (
                    <Link
                      key={s.id}
                      to={`/sports/${s.slug}`}
                      onClick={closeDrawer}
                      className="flex items-center gap-3 p-3.5 rounded-2xl bg-surface-2 dark:bg-white/5 border border-surface-3 dark:border-white/10 hover:border-red/40 transition-all group"
                    >
                      <SportIcon slug={s.slug} size={20} className="text-red shrink-0" />
                      <div className="min-w-0">
                        <div className="font-display uppercase tracking-tight text-sm leading-tight truncate group-hover:text-red transition-colors">{s.name}</div>
                        <div className="text-[9px] uppercase font-bold tracking-widest text-surface-dark/30 dark:text-white/30 mt-0.5">{s._count?.leagues ?? 0} leagues</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Settings */}
              <div className="flex items-center justify-between p-4 bg-surface-2 dark:bg-white/5 rounded-xl border border-surface-3 dark:border-white/10">
                <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-surface-dark/40 dark:text-white/40">Appearance</span>
                <ThemeToggle />
              </div>
              <div className="space-y-3">
                <h3 className="text-[10px] uppercase font-bold tracking-[0.3em] text-surface-dark/30 dark:text-white/30">Language</h3>
                <div className="grid grid-cols-2 gap-2">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => changeLanguage(lang.code)}
                      className={`py-3 rounded-lg border text-[10px] font-bold uppercase tracking-widest transition-all ${i18n.language === lang.code ? 'border-red text-red bg-red/5' : 'border-surface-3 dark:border-white/10 text-surface-dark/40 dark:text-white/40 bg-surface-2 dark:bg-white/5'}`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </>
      )}
    </nav>
  );
};

export default Navbar;
