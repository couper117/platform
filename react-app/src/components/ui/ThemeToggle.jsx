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
        className
      )}
    >
      <Sun
        size={18}
        className={cn(
          'transition-all duration-300',
          dark ? 'opacity-0 rotate-90 scale-0 absolute inset-2' : 'opacity-100 rotate-0 scale-100'
        )}
      />
      <Moon
        size={18}
        className={cn(
          'transition-all duration-300',
          dark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0 absolute inset-2'
        )}
      />
    </button>
  );
};

export default ThemeToggle;
