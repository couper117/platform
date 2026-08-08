import React from 'react';
import { ChevronDown } from 'lucide-react';
import cn from './cn';

/**
 * Select — a real <select>, styled.
 *
 * NOT A CUSTOM LISTBOX. A native select gets keyboard support, type-ahead, screen
 * reader semantics and the platform's own picker sheet on Android for free, and it
 * cannot be scrolled off-screen the way a bespoke popup can. The only thing worth
 * customising is the trigger's appearance, which `appearance-none` plus an overlaid
 * chevron handles.
 *
 * Font size is 16px from the base layer, above the 15px body scale, because iOS
 * zooms the viewport on focus for anything smaller.
 */
const Select = ({ label, value, onChange, options = [], placeholder, className, id, ...props }) => {
  const selectId = id || `select-${label?.toLowerCase().replace(/\s+/g, '-') || 'field'}`;

  return (
    <div className={cn('relative inline-flex items-center', className)}>
      {/* Visually hidden rather than absent: the control still needs a name. */}
      {label && (
        <label htmlFor={selectId} className="sr-only">
          {label}
        </label>
      )}
      <select
        id={selectId}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className={cn(
          'h-9 max-w-[14rem] appearance-none truncate rounded-control border border-hairline bg-surface',
          'pl-3 pr-8 text-sm text-primary',
          'transition-colors duration-150 ease-standard hover:bg-surface-2'
        )}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        aria-hidden="true"
        className="pointer-events-none absolute right-2.5 text-tertiary"
      />
    </div>
  );
};

export default Select;
