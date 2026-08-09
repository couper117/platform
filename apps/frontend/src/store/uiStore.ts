import { create } from 'zustand';

let nextId = 1;

const useUiStore = create((set, get) => ({
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
