import { cleanup, render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { tick } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import VoteStrip from './VoteStrip.svelte';

afterEach(() => {
  cleanup();
});

describe('VoteStrip vote mode', () => {
  it('keeps optimistic vote visible while the handler is pending', async () => {
    const user = userEvent.setup();
    let resolveHandler: () => void = () => {};
    const onvote = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveHandler = resolve;
        })
    );

    render(VoteStrip, {
      props: {
        mode: 'votes',
        syncKey: 't1',
        count: 2,
        activeVote: 0,
        onvote
      }
    });

    await tick();
    expect(screen.getByText('2')).toBeInTheDocument();

    await user.click(screen.getByLabelText('Vote up'));
    await tick();

    expect(screen.getByText('3')).toBeInTheDocument();
    expect(onvote).toHaveBeenCalledWith({ vote: 1 });

    resolveHandler();
    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  it('re-syncs to props that arrived while the optimistic lock was held', async () => {
    const user = userEvent.setup();
    let resolveHandler: (value?: void) => void = () => {};
    const onvote = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveHandler = resolve;
        })
    );

    const view = render(VoteStrip, {
      props: {
        mode: 'votes',
        syncKey: 't1',
        count: 2,
        activeVote: 0,
        onvote
      }
    });

    await tick();
    await user.click(screen.getByLabelText('Vote up'));
    await tick();
    expect(screen.getByText('3')).toBeInTheDocument();

    // Simulate parent invalidate completing with confirmed engagement while locked.
    view.rerender({
      mode: 'votes',
      syncKey: 't1',
      count: 3,
      activeVote: 1,
      onvote
    });
    await tick();

    resolveHandler();
    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByLabelText('Vote up').className).toContain('active-up');
    });
  });

  it('keeps confirmed local vote when stale parent props arrive after success', async () => {
    const user = userEvent.setup();
    const onvote = vi.fn(async () => ({ activeVote: 1 as const, voteCount: 3 }));

    const view = render(VoteStrip, {
      props: {
        mode: 'votes',
        syncKey: 't1',
        count: 2,
        activeVote: 0,
        onvote
      }
    });

    await tick();
    await user.click(screen.getByLabelText('Vote up'));
    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByLabelText('Vote up').className).toContain('active-up');
    });

    // Stale mismatched loader snapshot arrives after unlock.
    view.rerender({
      mode: 'votes',
      syncKey: 't1',
      count: 2,
      activeVote: 0,
      onvote
    });
    await tick();

    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByLabelText('Vote up').className).toContain('active-up');
  });

  it('reverts optimistic state when the handler throws', async () => {
    const user = userEvent.setup();
    const onvote = vi.fn(async () => {
      throw new Error('network');
    });

    render(VoteStrip, {
      props: {
        mode: 'votes',
        syncKey: 't1',
        count: 2,
        activeVote: 0,
        onvote
      }
    });

    await tick();
    await user.click(screen.getByLabelText('Vote up'));
    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });
});
