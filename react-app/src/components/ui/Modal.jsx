import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import IconButton from './IconButton';
import cn from './cn';

/**
 * Modal dialog, following the reference's overlay: a `rgba(0,0,0,.6)` scrim with
 * `backdrop-filter: blur(5px)`, and a white card at 16px radius under a deep
 * `0 20px 50px rgba(0,0,0,.3)` shadow.
 *
 * WHAT A DIALOG HAS TO DO BEYOND LOOKING RIGHT — all of it handled here, once, so
 * no caller has to remember:
 *   · Escape closes it (when dismissible)
 *   · a click on the scrim closes it, but a click inside never does
 *   · the page behind cannot scroll while it is open
 *   · focus moves into the dialog on open and returns to the trigger on close
 *   · role/aria-modal/aria-labelledby so it is announced as a dialog
 *
 * `dismissible={false}` makes it a decision the visitor has to answer, with no
 * close button, no Escape and no scrim click. Use that sparingly — it is the right
 * shape for a first-run choice and the wrong shape for almost everything else.
 */
const Modal = ({
  open,
  onClose,
  title,
  description,
  dismissible = true,
  size = 'md',
  children,
  footer,
  className,
}) => {
  const panelRef = useRef(null);
  const restoreTo = useRef(null);

  // Remember what had focus, move focus in, and give it back on close.
  useEffect(() => {
    if (!open) return undefined;
    restoreTo.current = document.activeElement;
    const t = requestAnimationFrame(() => {
      const target =
        panelRef.current?.querySelector('[data-autofocus]') ??
        panelRef.current?.querySelector('button, [href], input, select, textarea') ??
        panelRef.current;
      target?.focus?.();
    });
    return () => {
      cancelAnimationFrame(t);
      restoreTo.current?.focus?.();
    };
  }, [open]);

  // Escape to close, and keep Tab inside the dialog while it is open.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape' && dismissible) {
        onClose?.();
        return;
      }
      if (e.key !== 'Tab') return;
      const items = panelRef.current?.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!items?.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, dismissible, onClose]);

  // Lock the page behind the dialog.
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const width = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl' }[size] ?? 'max-w-xl';
  const titleId = title ? 'modal-title' : undefined;
  const descId = description ? 'modal-desc' : undefined;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-5"
      onClick={dismissible ? onClose : undefined}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        tabIndex={-1}
        // Stop a click inside from reaching the scrim's close handler.
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'max-h-[92vh] w-full overflow-y-auto bg-surface shadow-lg',
          // A sheet on a phone, a centred card from sm up — a 16px-radius card
          // floating mid-screen wastes height on a 360px viewport.
          'rounded-t-modal sm:rounded-modal',
          width,
          className
        )}
      >
        {(title || dismissible) && (
          <div className="flex items-start justify-between gap-4 border-b border-hairline p-5 sm:p-6">
            <div className="min-w-0">
              {title && (
                <h2 id={titleId} className="text-xl font-extrabold text-primary">
                  {title}
                </h2>
              )}
              {description && (
                <p id={descId} className="mt-1 text-sm text-secondary">
                  {description}
                </p>
              )}
            </div>
            {dismissible && (
              <IconButton icon={X} label="Close" size="sm" onClick={onClose} className="-mr-2 -mt-1" />
            )}
          </div>
        )}

        <div className="p-5 sm:p-6">{children}</div>

        {footer && (
          <div className="sticky bottom-0 border-t border-hairline bg-surface p-5 sm:p-6">{footer}</div>
        )}
      </div>
    </div>
  );
};

export default Modal;
