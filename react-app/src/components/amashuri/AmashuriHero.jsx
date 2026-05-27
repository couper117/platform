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