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
const Select = React.forwardRef(
  /**
   * The JSDoc sits on the INNER function, not the outer const: `forwardRef` infers
   * its prop type from the render function it is handed, so a type on the const is
   * ignored and a `.tsx` caller still sees bare `RefAttributes<any>` — which is why
   * passing `id`/`options` explicitly failed to compile while a spread object went
   * through. Same fix as IconButton.
   *
   * @param {{
   *   label?: string,
   *   value?: any,
   *   onChange?: (e: any) => void,
   *   options?: Array<{ value: any, label: React.ReactNode }>,
   *   placeholder?: string,
   *   size?: 'sm' | 'md',
   *   invalid?: boolean,
   *   className?: string,
   *   id?: string,
   * } & Record<string, any>} props
   */
  (
    {
      label,
      value,
      onChange,
      options = [],
      placeholder,
      size = 'sm',
      invalid = false,
      className,
      id,
      ...props
    },
    ref
  ) => {
    const selectId = id || `select-${label?.toLowerCase().replace(/\s+/g, '-') || 'field'}`;
    // `sm` is the dense inline control (a filter bar); `md` matches Input's height
    // so it can sit inside a Field alongside text inputs without looking wrong.
    const dense = size === 'sm';

    return (
      <div className={cn('relative flex items-center', dense ? 'inline-flex' : 'w-full', className)}>
        {/* Only render a hidden label when this is a standalone control. Inside a
            Field the visible <label htmlFor> already names it, and a second label
            would have a screen reader announce the name twice. */}
        {label && (
          <label htmlFor={selectId} className="sr-only">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          value={value}
          /* Forwards the EVENT, not the value. It used to pass `e.target.value` as a
             convenience, which silently broke react-hook-form: `register()` returns an
             onChange expecting an event, so a <Select> inside a form never registered
             its value and validation failed with no visible cause. A primitive
             wrapping a native element should behave like one. */
          onChange={onChange}
          aria-invalid={invalid || undefined}
          className={cn(
            'appearance-none truncate rounded-input border bg-surface text-primary',
            'transition-colors duration-150 ease-standard',
            'focus:border-brand focus:outline-none',
            dense ? 'h-9 max-w-[14rem] rounded-control pl-3 pr-8 text-sm' : 'min-h-tap w-full pl-4 pr-10',
            invalid ? 'border-danger' : 'border-hairline hover:border-brand/40',
            'disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-disabled'
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
          size={dense ? 14 : 16}
          aria-hidden="true"
          className={cn('pointer-events-none absolute text-tertiary', dense ? 'right-2.5' : 'right-3.5')}
        />
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;
