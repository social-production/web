import { get } from 'svelte/store';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { requireFields, showToast, toasts } from './toast';

describe('toast store', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    toasts.set([]);
  });

  it('shows a toast and clears it after a few seconds', () => {
    showToast('Vote recorded');
    expect(get(toasts).map((item) => item.message)).toEqual(['Vote recorded']);
    vi.advanceTimersByTime(4000);
    expect(get(toasts)).toEqual([]);
  });

  it('names each empty required field', () => {
    expect(requireFields({ Title: '  ', Description: 'ok' })).toBe(false);
    expect(get(toasts)[0]).toMatchObject({ message: 'Title is required.', tone: 'error' });
    expect(requireFields({ Title: 'Beach clean' })).toBe(true);
  });
});
