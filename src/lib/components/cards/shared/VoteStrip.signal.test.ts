import { cleanup, render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { tick } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { SignalToggleResult } from '$lib/types/feed';
import VoteStrip from './VoteStrip.svelte';

afterEach(() => {
  cleanup();
});

function addedResult(): SignalToggleResult {
  return {
    ok: true,
    slug: 'p1',
    action: 'added',
    signalType: 'demand',
    signals: { demand: 3, opposition: 1, total: 4 }
  };
}

describe('VoteStrip signals mode', () => {
  it('optimistically activates support before the handler resolves', async () => {
    const user = userEvent.setup();
    let resolveHandler: () => void = () => {};
    const onsignal = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveHandler = resolve;
        })
    );

    render(VoteStrip, {
      props: {
        mode: 'signals',
        syncKey: 'p1',
        supportCount: 2,
        opposeCount: 1,
        favorability: 2 / 3,
        viewerSignal: null,
        onsignal
      }
    });

    await tick();

    const supportButton = screen.getByLabelText(/^Support/i);
    expect(supportButton).toHaveAttribute('aria-pressed', 'false');

    await user.click(supportButton);
    await tick();

    expect(supportButton).toHaveAttribute('aria-pressed', 'true');
    expect(onsignal).toHaveBeenCalledWith('demand');

    resolveHandler();
    await waitFor(() => {
      expect(supportButton).toHaveAttribute('aria-pressed', 'true');
    });
  });

  it('returns to neutral when clearing support', async () => {
    const user = userEvent.setup();
    const onsignal = vi.fn(async () => undefined);

    render(VoteStrip, {
      props: {
        mode: 'signals',
        syncKey: 'p1',
        supportCount: 3,
        opposeCount: 1,
        favorability: 0.75,
        viewerSignal: 'demand',
        onsignal
      }
    });

    await tick();

    const supportButton = screen.getByLabelText(/^Support/i);
    expect(supportButton).toHaveAttribute('aria-pressed', 'true');

    await user.click(supportButton);
    await tick();

    await waitFor(() => {
      expect(supportButton).toHaveAttribute('aria-pressed', 'false');
    });
    expect(onsignal).toHaveBeenCalledWith('demand');
  });

  it('reverts optimistic state when the handler throws', async () => {
    const user = userEvent.setup();
    const onsignal = vi.fn(async () => {
      throw new Error('network');
    });

    render(VoteStrip, {
      props: {
        mode: 'signals',
        syncKey: 'p1',
        supportCount: 2,
        opposeCount: 1,
        favorability: 2 / 3,
        viewerSignal: null,
        onsignal
      }
    });

    await tick();

    const supportButton = screen.getByLabelText(/^Support/i);
    await user.click(supportButton);
    await tick();

    await waitFor(() => {
      expect(supportButton).toHaveAttribute('aria-pressed', 'false');
    });
  });

  it('applies confirmed API payload when handler returns SignalToggleResult', async () => {
    const user = userEvent.setup();
    const onsignal = vi.fn(async () => addedResult());

    render(VoteStrip, {
      props: {
        mode: 'signals',
        syncKey: 'p1',
        supportCount: 2,
        opposeCount: 1,
        favorability: 2 / 3,
        viewerSignal: null,
        onsignal
      }
    });

    await tick();

    await user.click(screen.getByLabelText(/^Support/i));
    await waitFor(() => {
      expect(screen.getByLabelText(/^Support/i)).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByLabelText(/^Support/i)).toHaveAttribute('aria-label', 'Support · 3');
    });
  });

  it('keeps confirmed state when handler returns SignalToggleResult before side effects fail', async () => {
    const user = userEvent.setup();
    const onsignal = vi.fn(async () => {
      const result = addedResult();
      void Promise.reject(new Error('invalidate failed')).catch(() => {});
      return result;
    });

    render(VoteStrip, {
      props: {
        mode: 'signals',
        syncKey: 'p1',
        supportCount: 2,
        opposeCount: 1,
        favorability: 2 / 3,
        viewerSignal: null,
        onsignal
      }
    });

    await tick();

    const supportButton = screen.getByLabelText(/^Support/i);
    await user.click(supportButton);
    await tick();

    await waitFor(() => {
      expect(supportButton).toHaveAttribute('aria-pressed', 'true');
      expect(supportButton).toHaveAttribute('aria-label', 'Support · 3');
    });
  });

  it('renders initial props and keeps local state when syncKey is unchanged', async () => {
    render(VoteStrip, {
      props: {
        mode: 'signals',
        syncKey: 'p1',
        supportCount: 5,
        opposeCount: 2,
        favorability: 5 / 7,
        viewerSignal: 'opposition'
      }
    });

    await tick();

    expect(screen.getByLabelText(/^Support/i)).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByLabelText(/^Oppose/i)).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByLabelText(/^Oppose/i)).toHaveAttribute('aria-label', 'Oppose · 2');
  });
});
