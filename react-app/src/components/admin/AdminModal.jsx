import React from 'react';
import { X } from 'lucide-react';

const AdminModal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-surface-dark/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-surface-dark2 w-full max-w-2xl rounded-3xl border border-surface-3 dark:border-white/10 shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
        <div className="p-6 border-b border-surface-3 dark:border-white/5 flex justify-between items-center bg-surface-2 dark:bg-white/5">
          <h2 className="text-2xl font-display uppercase tracking-tight">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors opacity-40 hover:opacity-100">