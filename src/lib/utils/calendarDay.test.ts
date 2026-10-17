import { describe, expect, it } from 'vitest';
import { isoDayInZone, zonedDayStart } from './calendarDay';

describe('zoned calendar days', () => {
  it('finds midnight in a zone ahead of UTC', () => {
    expect(zonedDayStart('2026-10-17', 'Australia/Melbourne').toISOString()).toBe(
      '2026-10-16T13:00:00.000Z'
    );
  });

  it('handles the daylight-saving start day', () => {
    // Melbourne moves to +11 on 2026-10-04; midnight that day is still +10.
    expect(zonedDayStart('2026-10-04', 'Australia/Melbourne').toISOString()).toBe(
      '2026-10-03T14:00:00.000Z'
    );
  });

  it('reads the day of an instant in a zone', () => {
    expect(isoDayInZone(new Date('2026-10-16T14:30:00Z'), 'Australia/Melbourne')).toBe(
      '2026-10-17'
    );
    expect(isoDayInZone(new Date('2026-10-16T14:30:00Z'), 'America/New_York')).toBe('2026-10-16');
  });
});
