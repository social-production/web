import { describe, expect, it } from 'vitest';
import { eventActivityScheduleProblem, eventPlanScheduleInZone } from './eventSchedule';

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

describe('eventActivityScheduleProblem', () => {
  // Plan: Sun Nov 1, 12:30–2:00 AM Melbourne (Sat Oct 31 in UTC), shown to a Melbourne viewer.
  const plan = eventPlanScheduleInZone(
    {
      mode: 'range',
      startDate: '2026-10-31',
      endDate: '2026-10-31',
      startTimeLabel: '13:30',
      finishTimeLabel: '15:00',
      timeZone: 'UTC',
    },
    'Australia/Melbourne'
  );

  it('accepts an activity inside the plan across midnight UTC', () => {
    expect(
      eventActivityScheduleProblem(
        plan,
        '2026-11-01T00:30',
        '2026-11-01T01:30',
        'Australia/Melbourne'
      )
    ).toBeNull();
  });

  it('accepts the same moment typed in another zone', () => {
    expect(
      eventActivityScheduleProblem(
        plan,
        '2026-10-31T23:30',
        '2026-11-01T00:30',
        'Australia/Brisbane'
      )
    ).toBeNull();
  });

  it('explains an activity outside the plan', () => {
    expect(
      eventActivityScheduleProblem(
        plan,
        '2026-11-01T08:00',
        '2026-11-01T09:00',
        'Australia/Melbourne'
      )
    ).toMatch(/leading plan/);
  });
});
