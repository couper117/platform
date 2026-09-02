import React from 'react';
import { AlertTriangle } from 'lucide-react';
import Button from './Button';
import cn from './cn';

/**
 * "This failed" placeholder — the sibling of EmptyState.
 *
 * WHY THIS EXISTS AS A PRIMITIVE
 * 35 screens ran queries and 4 handled `isError`. The other 31 rendered an empty
 * list on a failed request, which tells a fan "there are no fixtures" when the
 * truth is "we could not reach the server". Those are opposite meanings, and on a
 * flaky Rwandan mobile connection the second one is common. Empty and failed must
 * never look the same.
 *
 * Always offers a retry: on a dropped connection the fix is usually just asking
 * again, and a fan should not have to reload the whole app to do it.
 */
const ErrorState = ({
  title = 'Could not load this',
  hint = 'Check your connection and try again.',
  onRetry = undefined,
  className = '',
}) => (
  <div
    role="alert"
    className={cn('flex flex-col items-center px-4 py-10 text-center', className)}
  >
    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-control bg-surface-2">
      <AlertTriangle size={20} strokeWidth={1.75} className="text-danger-text" aria-hidden="true" />
    </div>
    <p className="text-base font-semibold text-primary">{title}</p>
    {hint && <p className="mt-1 max-w-[38ch] text-sm text-secondary">{hint}</p>}
    {onRetry && (
      <Button variant="secondary" size="md" onClick={onRetry} className="mt-4">
        Try again
      </Button>
    )}
  </div>
);

export default ErrorState;
