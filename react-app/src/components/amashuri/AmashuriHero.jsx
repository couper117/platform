import React from 'react';
import { GraduationCap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ResponsiveWrapper from '../shared/ResponsiveWrapper';
import cn from '../ui/cn';

/**
 * Shared hero for the Amashuri Games (Rwanda Inter-School Sports) sub-brand.
 * Self-contained branded backdrop (Rwanda blue + yellow), no external images —
 * the blue/yellow palette is what differentiates it from RwaSport's red.
 * Eyebrow defaults to the translated tagline when not provided.
 */
const AmashuriHero = ({ eyebrow, title, accent, subtitle, children, compact = false }) => {
  const { t } = useTranslation();
  const resolvedEyebrow = eyebrow === undefined ? t('amashuri.tagline') : eyebrow;
  return (
  <section
    className={cn(
      'relative overflow-hidden text-white bg-rwanda-blue',
      compact ? 'py-12 sm:py-16' : 'py-20 sm:py-28'
    )}
  >
    {/* Branded backdrop */}
    <div className="absolute inset-0 bg-gradient-to-br from-rwanda-blue via-rwanda-blue to-[#007bb0]" />
    <div className="absolute -top-32 -right-24 w-[34rem] h-[34rem] rounded-full bg-rwanda-yellow/20 blur-[120px]" />
    <div className="absolute -bottom-40 -left-24 w-[30rem] h-[30rem] rounded-full bg-white/10 blur-[120px]" />
    <div
      className="absolute inset-0 opacity-[0.07]"
      style={{
        backgroundImage:
          'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)',
        backgroundSize: '48px 48px',
        maskImage: 'radial-gradient(ellipse at top left, black 20%, transparent 70%)',
        WebkitMaskImage: 'radial-gradient(ellipse at top left, black 20%, transparent 70%)',
      }}
    />

    <ResponsiveWrapper className="relative z-10">
      <div className="space-y-5">
        {resolvedEyebrow && (
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 px-4 py-1.5 rounded-full backdrop-blur-sm">
            <GraduationCap size={14} className="text-rwanda-yellow" />
            <span className="text-[10px] font-bold uppercase tracking-widest">{resolvedEyebrow}</span>
          </div>
        )}
        {title && (
          <h1 className={cn('font-display uppercase tracking-tighter leading-none', compact ? 'text-4xl sm:text-6xl' : 'text-5xl sm:text-7xl')}>
            {title} {accent && <span className="text-rwanda-yellow">{accent}</span>}
          </h1>
        )}
        {subtitle && <p className="text-base sm:text-lg opacity-80 max-w-xl font-light">{subtitle}</p>}
        {children}
      </div>
    </ResponsiveWrapper>
  </section>
  );
};

export default AmashuriHero;
