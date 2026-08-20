import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import useUiStore from './uiStore';

describe('uiStore toasts', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useUiStore.setState({ toasts: [] });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('pushToast adds a toast and returns its id', () => {
    const id = useUiStore.getState().pushToast('Saved', 'success');
    const { toasts } = useUiStore.getState();
    expect(toasts).toHaveLength(1);
    expect(toasts[0]).toMatchObject({ id, message: 'Saved', type: 'success' });
  });

  it('defaults the toast type to error', () => {
    useUiStore.getState().pushToast('Oops');
    expect(useUiStore.getState().toasts[0].type).toBe('error');
  });

  it('dismissToast removes only the matching toast', () => {
    const a = useUiStore.getState().pushToast('A');
    const b = useUiStore.getState().pushToast('B');
    useUiStore.getState().dismissToast(a);
    const { toasts } = useUiStore.getState();
    expect(toasts).toHaveLength(1);
    expect(toasts[0].id).toBe(b);
  });

  it('auto-dismisses a toast after 5 seconds', () => {
    useUiStore.getState().pushToast('temporary');
    expect(useUiStore.getState().toasts).toHaveLength(1);
    vi.advanceTimersByTime(5000);
    expect(useUiStore.getState().toasts).toHaveLength(0);
  });
});
