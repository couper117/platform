import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import cn from './cn';

/**
 * Standard section header: small red eyebrow label + big display title,
 * with an optional "view all" link. Matches the HomePage pattern.
 */
const SectionHeading = ({
  eyebrow,
  title,
  accent,
  action,
  actionTo,
  className,
}) => (
  <div
    className={cn(
      'flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10',
      className
    )}
  >
    <div className="space-y-2">