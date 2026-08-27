import React from 'react';
import { useTranslation } from 'react-i18next';
import { Users } from 'lucide-react';
import cn from '../ui/cn';

/**
 * The one place Umuganda becomes a visual.
 *
 * WHY AN ICON AND NOT A FLAG EMOJI
 * The brief sketched these rows with a 🇷🇼. The design system forbids
 * "decoration that doesn't encode information", and the team deliberately
 * stripped decorative emoji from the app (commit 872986e) — an emoji flag also
 * renders differently on every platform and is announced as "flag of Rwanda" by
 * screen readers, which is not what the row means. Rwanda green IS already the
 * brand token, so Umuganda is expressed as brand green plus a community icon:
 * national, on-system, and legible in both themes.
 *
 * `size`:
 *   dot   — inline marker for a dense calendar cell
 *   sm    — chip beside a match row
 *   md    — section label
 */
type Props = {
  size?: 'dot' | 'sm' | 'md';
  label?: React.ReactNode;
  className?: string;
};

const UmugandaMark = ({ size = 'sm', label, className }: Props) => {
  const { t } = useTranslation();
  const text = label ?? t('umuganda.day');

  if (size === 'dot') {
    return (
      <span
        className={cn('inline-block h-1.5 w-1.5 shrink-0 rounded-pill bg-brand', className)}
        title={String(text)}
        aria-label={String(text)}
      />
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-pill border border-brand/30 bg-brand/10',
        'font-semibold uppercase tracking-wide text-brand-text whitespace-nowrap',
        size === 'md' ? 'px-3 py-1 text-xs' : 'px-2 py-0.5 text-[11px]',
        className
      )}
    >
      <Users size={size === 'md' ? 14 : 12} aria-hidden="true" />
      {text}
    </span>
  );
};

export default UmugandaMark;
