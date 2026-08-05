import { describe, expect, it } from 'vitest';
import type { SignalToggleResult } from '$lib/types/feed';
import {
  applyOptimisticSignalToggle,
  applySignalToggleToEngagement,
  isProposalAdvancementUnlocked,
  signalEngagementFromItem,
  viewerSignalFromToggle
} from '$lib/utils/feedSignals';

const neutral = signalEngagementFromItem({
  supportCount: 2,
  opposeCount: 1,
  favorability: 2 / 3,
  viewerSignal: null
});

describe('applyOptimisticSignalToggle', () => {
  it('adds support from neutral', () => {
    const next = applyOptimisticSignalToggle(neutral, 'demand');
    expect(next.viewerSignal).toBe('demand');
    expect(next.supportCount).toBe(3);
    expect(next.opposeCount).toBe(1);
  });

  it('removes support when already supporting', () => {
    const current = signalEngagementFromItem({
      supportCount: 3,
      opposeCount: 1,
      viewerSignal: 'demand'
    });
    const next = applyOptimisticSignalToggle(current, 'demand');
    expect(next.viewerSignal).toBeNull();
    expect(next.supportCount).toBe(2);
  });

  it('switches from support to opposition', () => {
    const current = signalEngagementFromItem({
      supportCount: 3,
      opposeCount: 1,
      viewerSignal: 'demand'
    });
    const next = applyOptimisticSignalToggle(current, 'opposition');
    expect(next.viewerSignal).toBe('opposition');
    expect(next.supportCount).toBe(2);
    expect(next.opposeCount).toBe(2);
  });
});

describe('viewerSignalFromToggle', () => {
  it('returns demand when added', () => {
    const result: SignalToggleResult = {
      ok: true,
      slug: 'p1',
      action: 'added',
      signalType: 'demand',
      signals: { demand: 1, opposition: 0, total: 1 }
    };
    expect(viewerSignalFromToggle(result)).toBe('demand');
  });

  it('returns null when removed even if signalType is still present', () => {
    const result: SignalToggleResult = {
      ok: true,
      slug: 'p1',
      action: 'removed',
      signalType: 'demand',
      signals: { demand: 0, opposition: 0, total: 0 }
    };
    expect(viewerSignalFromToggle(result)).toBeNull();
  });
});

describe('applySignalToggleToEngagement', () => {
  it('maps API added result to engagement', () => {
    const result: SignalToggleResult = {
      ok: true,
      slug: 'p1',
      action: 'added',
      signalType: 'demand',
      signals: { demand: 4, opposition: 2, total: 6 }
    };
    expect(applySignalToggleToEngagement(result)).toEqual({
      supportCount: 4,
      opposeCount: 2,
      favorability: 4 / 6,
      viewerSignal: 'demand'
    });
  });

  it('maps API removed result to neutral viewer signal', () => {
    const result: SignalToggleResult = {
      ok: true,
      slug: 'p1',
      action: 'removed',
      signalType: 'demand',
      signals: { demand: 3, opposition: 2, total: 5 }
    };
    expect(applySignalToggleToEngagement(result).viewerSignal).toBeNull();
  });
});

describe('isProposalAdvancementUnlocked', () => {
  it('requires 66% demand ratio for non-platform projects', () => {
    expect(
      isProposalAdvancementUnlocked(
        { demand: 1, opposition: 1, total: 2 },
        { requiredDemandCount: 1, usesPlatformVoteContext: false }
      )
    ).toBe(false);

    expect(
      isProposalAdvancementUnlocked(
        { demand: 2, opposition: 1, total: 3 },
        { requiredDemandCount: 1, usesPlatformVoteContext: false }
      )
    ).toBe(true);
  });

  it('requires both ratio and demand count for platform projects', () => {
    expect(
      isProposalAdvancementUnlocked(
        { demand: 2, opposition: 1, total: 3 },
        { requiredDemandCount: 3, usesPlatformVoteContext: true }
      )
    ).toBe(false);
  });
});
