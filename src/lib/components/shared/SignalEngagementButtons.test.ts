import { cleanup, render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { tick } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import SignalEngagementButtons from '$lib/components/shared/SignalEngagementButtons.svelte';
import type { SignalToggleResult } from '$lib/types/feed';

const setProjectSignal = vi.fn();
const setEventSignal = vi.fn();

vi.mock('$lib/services/commands/projects', () => ({
  setProjectSignal: (...args: unknown[]) => setProjectSignal(...args)
}));

vi.mock('$lib/services/commands/events', () => ({
  setEventSignal: (...args: unknown[]) => setEventSignal(...args)
}));

vi.mock('$app/stores', () => ({
  page: {
    subscribe(run: (value: { data: { bootstrap?: { viewer?: { id: string } } } }) => void) {
      run({ data: { bootstrap: { viewer: { id: 'viewer-1' } } } });
      return () => {};
    }
  }
}));

afterEach(() => {
  cleanup();
  setProjectSignal.mockReset();
  setEventSignal.mockReset();
});

describe('SignalEngagementButtons', () => {
  it('shows Support/Oppose labels and optimistically updates before API resolves', async () => {
    const user = userEvent.setup();
    let resolveApi: (value: SignalToggleResult) => void = () => {};
    const signalChange = vi.fn();

    setProjectSignal.mockImplementation(
      () =>
        new Promise<SignalToggleResult>((resolve) => {
          resolveApi = resolve;
        })
    );

    render(SignalEngagementButtons, {
      props: {
        entityKind: 'project',
        slug: 'demo-project',
        syncKey: 'p1',
        supportCount: 2,
        opposeCount: 1,
        viewerSignal: null,
        signalChange
      }
    });

    await tick();

    const supportButton = screen.getByRole('button', { name: /^Support 2$/i });
    expect(supportButton).toHaveAttribute('aria-pressed', 'false');

    await user.click(supportButton);
    await tick();

    expect(screen.getByRole('button', { name: /^Support 3$/i })).toHaveAttribute('aria-pressed', 'true');

    resolveApi({
      ok: true,
      slug: 'demo-project',
      action: 'added',
      signalType: 'demand',
      signals: { demand: 3, opposition: 1, total: 4 }
    });

    await waitFor(() => {
      expect(signalChange).toHaveBeenCalled();
    });
  });

  it('does not break button state when signalChange throws', async () => {
    const user = userEvent.setup();
    const signalChange = vi.fn(() => {
      throw new Error('summary failed');
    });

    setProjectSignal.mockResolvedValue({
      ok: true,
      slug: 'demo-project',
      action: 'added',
      signalType: 'demand',
      signals: { demand: 3, opposition: 1, total: 4 }
    });

    render(SignalEngagementButtons, {
      props: {
        entityKind: 'project',
        slug: 'demo-project',
        syncKey: 'p1',
        supportCount: 2,
        opposeCount: 1,
        viewerSignal: null,
        signalChange
      }
    });

    await tick();

    const supportButton = screen.getByRole('button', { name: /^Support 2$/i });
    await user.click(supportButton);
    await tick();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^Support 3$/i })).toHaveAttribute('aria-pressed', 'true');
    });
  });
});
