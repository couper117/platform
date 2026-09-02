import { create } from 'zustand';

export type ToastType = 'error' | 'success' | 'info';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface UiState {
  toasts: Toast[];
  pushToast: (message: string, type?: ToastType) => number;
  dismissToast: (id: number) => void;
}

let nextId = 1;

const useUiStore = create<UiState>((set, get) => ({
  toasts: [],

  pushToast: (message, type = 'error') => {
    const id = nextId++;
    set({ toasts: [...get().toasts, { id, message, type }] });
    setTimeout(() => get().dismissToast(id), 5000);
    return id;
  },

  dismissToast: (id) => {
    set({ toasts: get().toasts.filter((t) => t.id !== id) });
  },
}));

export default useUiStore;
