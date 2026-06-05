import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import cn from './cn';

/**
 * Light/Dark theme switch. Reads from ThemeContext (must be inside ThemeProvider).
 */
const ThemeToggle = ({ className }) => {
  const theme = useTheme();
  if (!theme) return null;
  const { dark, toggle } = theme;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={dark ? 'Light mode' : 'Dark mode'}
      className={cn(
        'relative p-2 rounded-full cursor-pointer transition-colors',
        'text-white/60 hover:text-white hover:bg-white/5',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red',