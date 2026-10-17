import { describe, expect, it } from 'vitest';
import { eventPlanScheduleInZone } from './eventSchedule';

describe('eventPlanScheduleInZone', () => {
  it('shows a UTC plan in Melbourne time', () => {
    const shown = eventPlanScheduleInZone(
      {
        mode: 'date',
        startDate: '2026-10-20',
        startTimeLabel: '07:00',
        finishTimeLabel: '10:00',
        timeZone: 'UTC',
      },
      'Australia/Melbourne'
    );
    expect(shown).toMatchObject({
      mode: 'date',
      startDate: '2026-10-20',
      startTimeLabel: '18:00',
      finishTimeLabel: '21:00',
      timeZone: 'Australia/Melbourne',
    });
  });

  it('moves the date when the zone crosses midnight', () => {
    const shown = eventPlanScheduleInZone(
      {
        mode: 'date',
        startDate: '2026-10-19',
        endDate: '2026-10-19',
        startTimeLabel: '22:00',
        finishTimeLabel: '23:00',
      },
      'Australia/Brisbane'
    );
    expect(shown).toMatchObject({
      startDate: '2026-10-20',
      startTimeLabel: '08:00',
      finishTimeLabel: '09:00',
    });
  });

  it('leaves dates without times alone', () => {
    const plan = { mode: 'date' as const, startDate: '2026-10-20', timeZone: 'UTC' };
    expect(eventPlanScheduleInZone(plan, 'America/New_York')).toMatchObject({
      startDate: '2026-10-20',
    });
  });
});
