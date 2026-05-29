import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X, User, LogOut, ChevronRight, Languages, Home, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../../store/authStore';
import ThemeToggle from '../ui/ThemeToggle';
import { useCommandPalette } from '../../context/CommandPaletteContext';

const Navbar = () => {
  const { t, i18n } = useTranslation();
  const { isAuthenticated, user, logout, role } = useAuthStore();
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
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2 group">
          <div className="bg-red p-1.5 rounded-lg transform group-hover:rotate-12 transition-transform">
            <span className="text-xl font-display leading-none text-white uppercase tracking-tighter">RwaSport</span>
          </div>
          <span className="hidden sm:inline text-[10px] border-l border-white/20 pl-2 opacity-50 uppercase tracking-[0.2em] font-medium">
            Rwanda National <br/> Sports Platform
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex space-x-8 items-center font-display text-[13px] uppercase tracking-widest">
          {navLinks.map(link => (
            <NavLink 
              key={link.to} 
              to={link.to} 
              className={({isActive}) => 
                `transition-all hover:text-red flex items-center space-x-1 ${isActive ? 'text-red' : link.highlight ? 'text-rwanda-yellow' : 'text-white/70'}`
              }
            >