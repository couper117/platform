import React from 'react';
import cn from './cn';

/**
 * Text input. 12px radius and a green focus border, per the reference's form
 * styling (`border: 1.5px solid #eee` → `border-color: green` on focus).
 *
 * Font size is 16px from the base layer in index.css, deliberately above the 15px
 * body scale: iOS zooms the whole viewport when a focused input is smaller.
 *
 * `invalid` draws the danger border. It is a prop rather than a `:invalid`
 * selector because the real validation lives in Zod, and the browser's own idea of
 * validity does not match it.
 */
/**
 * Forwards every native input attribute. Annotated because this is a .jsx file:
 * without it TypeScript infers the props from the destructure alone and rejects
 * `type`, `value`, `placeholder` and friends at .tsx call sites.
 * @type {any}
 */
const Input = React.forwardRef(
  /**
   * On the INNER function — `forwardRef` takes its prop type from the render
   * function, so a type on the const is ignored and `.tsx` callers see nothing.
   *
   * @param {{ invalid?: boolean, className?: string } & Record<string, any>} props
   */
  ({ invalid = false, className, ...props }, ref) => (
  <input
    ref={ref}
    aria-invalid={invalid || undefined}
    className={cn(
      'min-h-tap w-full rounded-input border bg-surface px-4 text-primary',
      'placeholder:text-tertiary',
      'transition-colors duration-150 ease-standard',
      // The focus ring is global (:focus-visible in index.css); the border colour
      // is what changes here, so the two do not fight.
      'focus:border-brand focus:outline-none',
      invalid ? 'border-danger' : 'border-hairline hover:border-brand/40',
      'disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-disabled',
      className
    )}
    {...props}
  />
));

Input.displayName = 'Input';

export default Input;
