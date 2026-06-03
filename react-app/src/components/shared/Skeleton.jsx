import React from 'react';
import { twMerge } from 'tailwind-merge';

const Skeleton = ({ type = 'card', count = 1, className = "" }) => {
  const items = Array.from({ length: count });

  const CardSkeleton = () => (
    <div className={twMerge("animate-pulse bg-white dark:bg-surface-dark2 rounded-2xl border border-surface-3 dark:border-white/5 overflow-hidden", className)}>
      <div className="h-10 bg-surface-2 dark:bg-white/5" />
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between space-x-4">
          <div className="flex-1 flex flex-col items-center space-y-2">
            <div className="w-16 h-16 rounded-full bg-surface-3 dark:bg-white/10" />
            <div className="h-3 w-16 bg-surface-3 dark:bg-white/10 rounded" />
          </div>
          <div className="w-24 h-12 bg-surface-2 dark:bg-white/5 rounded-xl" />
          <div className="flex-1 flex flex-col items-center space-y-2">
            <div className="w-16 h-16 rounded-full bg-surface-3 dark:bg-white/10" />
            <div className="h-3 w-16 bg-surface-3 dark:bg-white/10 rounded" />
          </div>
        </div>
        <div className="h-8 w-full bg-surface-2 dark:bg-white/5 rounded-lg" />
      </div>
    </div>
  );

  const TableRowSkeleton = () => (
    <div className="animate-pulse flex items-center space-x-4 py-4 px-4 border-b border-surface-3 dark:border-white/5">
      <div className="w-8 h-4 bg-surface-3 dark:bg-white/10 rounded" />
      <div className="w-8 h-8 rounded-full bg-surface-3 dark:bg-white/10" />
      <div className="flex-grow h-4 bg-surface-3 dark:bg-white/10 rounded" />