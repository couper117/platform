import React from 'react';
import { Link } from 'react-router-dom';
import cn from './cn';

/**
 * Surface card matching the platform's rounded, bordered, dark-aware style.
 * Pass `to` to make the whole card a link with hover lift.
 */
const Card = ({ as = 'div', to, hover = false, className, children, ...props }) => {
  const classes = cn(
    'bg-white dark:bg-surface-dark2 rounded-2xl border border-surface-3 dark:border-white/5',
    hover &&
      'transition-all duration-200 hover:shadow-2xl hover:shadow-red-glow hover:-translate-y-1',
    to && 'block cursor-pointer',
    className
  );

  if (to) {