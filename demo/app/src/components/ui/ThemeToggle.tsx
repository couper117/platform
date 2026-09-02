import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import cn from './cn';

/**
 * Light / dark switch. Reads ThemeContext, so it must sit inside ThemeProvider.
 *
 * Styled to match IconButton's ghost variant exactly — same 36px box, same radius,
 * same hover wash — because it sits in a row with the search and menu buttons and
 * a differently-shaped control there reads as a mistake. It is not an IconButton
 * itself only because it cross-fades two glyphs rather than showing one.
 *
 * The sun and moon are stacked and swapped by opacity/rotate/scale, so the icon
 * morphs instead of popping. Pure CSS transitions, which means the global
 * prefers-reduced-motion rule in index.css neutralises them without a JS gate.
 */
const ThemeToggle = ({ className }: { className?: string }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  if (!theme) return null;
  const { dark, toggle } = theme;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? t('theme.switch_to_light') : t('theme.switch_to_dark')}
      aria-pressed={dark}
      title={dark ? t('theme.light_mode') : t('theme.dark_mode')}
      className={cn(
        'relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-control',
        'text-secondary transition-colors duration-150 ease-standard',
        'hover:bg-brand-tint hover:text-brand-text',
        className
      )}
    >
      <Sun
        size={18}
        aria-hidden="true"
        className={cn(
          'absolute transition-all duration-300 ease-standard',
          dark ? 'scale-0 rotate-90 opacity-0' : 'scale-100 rotate-0 opacity-100'
        )}
      />
      <Moon
        size={18}
        aria-hidden="true"
        className={cn(
          'absolute transition-all duration-300 ease-standard',
          dark ? 'scale-100 rotate-0 opacity-100' : 'scale-0 -rotate-90 opacity-0'
        )}
      />
    </button>
  );
};

export default ThemeToggle;
