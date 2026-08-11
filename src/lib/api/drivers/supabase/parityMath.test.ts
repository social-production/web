/**
 * Pure governance math parity (mirrors web-supabase/_shared/{votes,moderation}.ts
 * and web-backend required_votes / moderation thresholds).
 */
import { describe, expect, it } from 'vitest';

function requiredVotes(n: number): number {
  if (n <= 0) return 0;
  let errorMargin: number;
  if (n < 100) errorMargin = 0.1 - (0.03 * (n - 1)) / 99;
  else if (n < 500) errorMargin = 0.07 - (0.02 * (n - 100)) / 400;
  else errorMargin = Math.max(0.02, 0.05 - (0.03 * Math.log10(n / 500)) / Math.log10(2000));
  const baseSampleSize = 0.9604 / errorMargin ** 2;
  const cochran = Math.ceil(baseSampleSize / (1 + (baseSampleSize - 1) / n));
  return Math.min(Math.ceil(0.75 * n), cochran);
}

function summarizeVotes(rows: Array<{ vote?: number | string | null }>) {
  let yesCount = 0;
  let noCount = 0;
  for (const row of rows) {
    const v = row.vote;
    if (v === 1 || v === 'yes' || v === '1') yesCount += 1;
    else if (v === -1 || v === 'no' || v === '-1') noCount += 1;
  }
  const voteCount = yesCount + noCount;
  return {
    yesCount,
    noCount,
    voteCount,
    approvalRatio: voteCount > 0 ? yesCount / voteCount : 0
  };
}

function isPassing(stats: ReturnType<typeof summarizeVotes>, population: number): boolean {
  const quorum = requiredVotes(population);
  return stats.voteCount >= quorum && (stats.voteCount === 0 || stats.approvalRatio >= 0.66);
}

function deleteQuorum(audienceSize: number, reason: string, targetType = ''): number {
  if (targetType === 'message' && audienceSize <= 1) return 1;
  const base = Math.max(0, requiredVotes(Math.max(0, audienceSize)));
  if (reason === 'serious-harm') {
    if (base <= 0) return 5;
    return Math.max(5, Math.ceil(base * 0.66));
  }
  if (base <= 0) return 3;
  return Math.max(3, base);
}

function nextResolution(input: {
  targetType: string;
  reason: string;
  current: string;
  yesCount: number;
  noCount: number;
  eligible: number;
  deleteQuorum: number;
}): string {
  if (input.current === 'open' && input.yesCount >= 1) {
    if (input.targetType === 'message' && input.eligible <= 1) {
      const total = input.yesCount + input.noCount;
      if (total >= input.deleteQuorum && input.yesCount / total >= 0.66) return 'removed';
    }
    return 'under_review';
  }
  return input.current;
}

function computeStandingState(input: {
  dbState: string;
  voteCount: number;
  approvalRatio: number;
  quorum: number;
  graceEndsAt: string | null;
}): string {
  if (input.dbState === 'candidate') {
    return input.voteCount >= input.quorum && input.approvalRatio >= 0.66
      ? 'qualifying'
      : 'below-threshold';
  }
  if (input.voteCount > 0 && input.approvalRatio < 0.66) return 'below-threshold';
  if (input.voteCount >= input.quorum) return 'active';
  if (input.graceEndsAt && new Date(input.graceEndsAt).getTime() >= Date.now()) return 'grace';
  return 'below-threshold';
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const aa =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(aa));
}

describe('supabase governance math parity', () => {
  it('computes requiredVotes for small and large populations', () => {
    expect(requiredVotes(0)).toBe(0);
    expect(requiredVotes(10)).toBeGreaterThan(0);
    expect(requiredVotes(10)).toBeLessThanOrEqual(8);
    expect(requiredVotes(1000)).toBeGreaterThan(0);
  });

  it('passes plan votes at quorum + 66%', () => {
    const stats = summarizeVotes([
      { vote: 'yes' },
      { vote: 'yes' },
      { vote: 'no' }
    ]);
    expect(stats.yesCount).toBe(2);
    expect(stats.approvalRatio).toBeCloseTo(2 / 3, 5);
    // With population 3, quorum is small; 2/3 yes should pass once quorum met.
    expect(isPassing(stats, 3)).toBe(true);
  });

  it('enforces non-DM delete quorum floors', () => {
    expect(deleteQuorum(1, 'spam', 'thread')).toBe(3);
    expect(deleteQuorum(1, 'serious-harm', 'thread')).toBe(5);
    expect(deleteQuorum(1, 'spam', 'message')).toBe(1);
  });

  it('moves reports to under_review on first yes', () => {
    expect(
      nextResolution({
        targetType: 'thread',
        reason: 'spam',
        current: 'open',
        yesCount: 1,
        noCount: 0,
        eligible: 20,
        deleteQuorum: 3
      })
    ).toBe('under_review');
  });

  it('computes board standing states', () => {
    expect(
      computeStandingState({
        dbState: 'candidate',
        voteCount: 10,
        approvalRatio: 0.8,
        quorum: 5,
        graceEndsAt: null
      })
    ).toBe('qualifying');
    expect(
      computeStandingState({
        dbState: 'member',
        voteCount: 10,
        approvalRatio: 0.8,
        quorum: 5,
        graceEndsAt: null
      })
    ).toBe('active');
    expect(
      computeStandingState({
        dbState: 'member',
        voteCount: 2,
        approvalRatio: 1,
        quorum: 5,
        graceEndsAt: new Date(Date.now() + 86400000).toISOString()
      })
    ).toBe('grace');
  });

  it('clips region distance with haversine', () => {
    const near = haversineKm(-37.8, 144.9, -37.81, 144.91);
    const far = haversineKm(-37.8, 144.9, -33.8, 151.2);
    expect(near).toBeLessThan(25);
    expect(far).toBeGreaterThan(25);
  });
});
