import { describe, expect, it, vi } from 'vitest';
import type { SignalToggleResult } from '$lib/types/feed';
import { runSignalToggle, notifySignalChange } from '$lib/utils/signalEngagement';
import { signalEngagementFromItem } from '$lib/utils/feedSignals';

const neutral = signalEngagementFromItem({
  supportCount: 2,
  opposeCount: 1,
  favorability: 2 / 3,
  viewerSignal: null
});

const addedResult: SignalToggleResult = {
  ok: true,
  slug: 'p1',
  action: 'added',
  signalType: 'demand',
  signals: { demand: 3, opposition: 1, total: 4 }
};

describe('runSignalToggle', () => {
  it('applies optimistic state before the API resolves', async () => {
    let resolveApi: (value: SignalToggleResult) => void = () => {};
    const onOptimistic = vi.fn();
    const onConfirmed = vi.fn();
    const onRevert = vi.fn();

    const pending = runSignalToggle(
      neutral,
      'demand',
      () =>
        new Promise<SignalToggleResult>((resolve) => {
          resolveApi = resolve;
        }),
      { onOptimistic, onConfirmed, onRevert }
    );

    expect(onOptimistic).toHaveBeenCalledWith(
      expect.objectContaining({ viewerSignal: 'demand', supportCount: 3 })
    );
    expect(onConfirmed).not.toHaveBeenCalled();

    resolveApi(addedResult);
    const outcome = await pending;

    expect(onConfirmed).toHaveBeenCalledWith(
      expect.objectContaining({ viewerSignal: 'demand', supportCount: 3 })
    );
    expect(onRevert).not.toHaveBeenCalled();
    expect(outcome.apiResult).toEqual(addedResult);
    expect(outcome.engagement.viewerSignal).toBe('demand');
  });

  it('reverts when the API throws', async () => {
    const onOptimistic = vi.fn();
    const onConfirmed = vi.fn();
    const onRevert = vi.fn();

    const outcome = await runSignalToggle(
      neutral,
      'demand',
      async () => {
        throw new Error('network');
      },
      { onOptimistic, onConfirmed, onRevert }
    );

    expect(onOptimistic).toHaveBeenCalled();
    expect(onConfirmed).not.toHaveBeenCalled();
    expect(onRevert).toHaveBeenCalledWith(neutral);
    expect(outcome.apiResult).toBeNull();
  });

  it('keeps optimistic state when the API returns void (vote contract)', async () => {
    const onOptimistic = vi.fn();
    const onConfirmed = vi.fn();
    const onRevert = vi.fn();

    const outcome = await runSignalToggle(neutral, 'demand', async () => undefined, {
      onOptimistic,
      onConfirmed,
      onRevert
    });

    expect(onOptimistic).toHaveBeenCalledWith(
      expect.objectContaining({ viewerSignal: 'demand', supportCount: 3 })
    );
    expect(onConfirmed).not.toHaveBeenCalled();
    expect(onRevert).not.toHaveBeenCalled();
    expect(outcome.engagement.viewerSignal).toBe('demand');
    expect(outcome.apiResult).toBeNull();
  });
});

describe('notifySignalChange', () => {
  it('swallows errors from the parent callback', () => {
    const signalChange = vi.fn(() => {
      throw new Error('summary update failed');
    });

    expect(() => notifySignalChange(signalChange, addedResult)).not.toThrow();
    expect(signalChange).toHaveBeenCalledWith(addedResult);
  });
});
