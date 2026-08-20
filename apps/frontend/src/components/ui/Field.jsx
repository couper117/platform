import React, { useId } from 'react';
import cn from './cn';

/**
 * Label + control + error, wired together.
 *
 * WHY THIS EXISTS AS A PRIMITIVE
 * Every form in the app hand-rolled this — a label div, an input, and an error
 * paragraph sitting near each other but not actually associated. That leaves a
 * screen reader announcing an unlabelled text box, and an error message it never
 * reads at all. Doing it once here means `htmlFor`, `aria-describedby` and
 * `aria-invalid` are always correct.
 *
 * Renders via a function child so it can wire ids into any control — Input,
 * Select, textarea — without needing to know which:
 *
 *   <Field label="Email" error={errors.email?.message}>
 *     {(p) => <Input {...p} {...register('email')} />}
 *   </Field>
 */
/** @param {{ label?: React.ReactNode, hint?: React.ReactNode, error?: React.ReactNode, required?: boolean, className?: string, children?: any }} props */
const Field = ({ label, hint, error, required = false, className, children }) => {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ');

  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={id} className="block text-sm font-bold text-primary">
        {label}
        {required && (
          <span className="ml-0.5 text-danger" aria-hidden="true">
            *
          </span>
        )}
      </label>

      {children({
        id,
        invalid: !!error,
        'aria-describedby': describedBy || undefined,
        required,
      })}

      {hint && !error && (
        <p id={hintId} className="text-xs text-tertiary">
          {hint}
        </p>
      )}
      {/* role="alert" so the message is announced when it appears, not just when
          the field is next focused. */}
      {error && (
        <p id={errorId} role="alert" className="text-xs font-semibold text-danger-text">
          {error}
        </p>
      )}
    </div>
  );
};

export default Field;
