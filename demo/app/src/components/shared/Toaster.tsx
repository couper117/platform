import React from 'react';
import { X } from 'lucide-react';
import useUiStore from '../../store/uiStore';

const TYPE_STYLES = {
  error: 'bg-red text-white',
  success: 'bg-green text-white',
  info: 'bg-surface-dark2 text-white',
};

const Toaster = () => {
  const { toasts, dismissToast } = useUiStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 w-[min(90vw,360px)]">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-start justify-between gap-3 rounded-lg px-4 py-3 shadow-lg text-sm ${TYPE_STYLES[toast.type] || TYPE_STYLES.info}`}
        >
          <span className="flex-grow">{toast.message}</span>
          <button
            onClick={() => dismissToast(toast.id)}
            className="opacity-70 hover:opacity-100 transition-opacity"
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default Toaster;
