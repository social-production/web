import type { EventPlanSchedule, EventPlanScheduleInput } from '$lib/types/detail';

type EventScheduleLike = Pick<
  EventPlanScheduleInput | EventPlanSchedule,
  'mode' | 'startDate' | 'endDate' | 'startTimeLabel' | 'finishTimeLabel'
>;

const DAY_START_TIME = '00:00';
const DAY_END_TIME = '23:59';

function normalizeDateInput(value: string | null | undefined) {
  const trimmed = value?.trim() ?? '';

  return /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? trimmed : '';
}

function normalizeTimeInput(value: string | null | undefined, fallback: string) {
  const trimmed = value?.trim() ?? '';

  return /^\d{2}:\d{2}$/.test(trimmed) ? trimmed : fallback;
}

export function buildLocalDateTimeValue(
  date: string | null | undefined,
  time: string | null | undefined,
  fallbackTime = DAY_START_TIME
) {
  const normalizedDate = normalizeDateInput(date);

  if (!normalizedDate) {
    return null;
  }

  return `${normalizedDate}T${normalizeTimeInput(time, fallbackTime)}`;
}

export function parseLocalDateTimeValue(value: string | null | undefined) {
  const trimmed = value?.trim() ?? '';

  if (!trimmed) {
    return null;
  }

  const date = new Date(trimmed);

  return Number.isNaN(date.getTime()) ? null : date;
}

/** Convert a datetime-local input value to UTC ISO for API submission. */
export function localDateTimeInputToIso(value: string, timeZone?: string | null): string {
  const zone = timeZone?.trim();
  if (zone) {
    const zoned = zonedDateTimeInputToIso(value, zone);
    if (zoned) return zoned;
  }
  const parsed = parseLocalDateTimeValue(value);
  if (!parsed) {
    throw new Error('Invalid datetime-local value');
  }
  return parsed.toISOString();
}

/** Interpret a datetime-local value as wall time in `timeZone` and return a UTC instant. */
export function zonedDateTimeInputToIso(value: string, timeZone: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute);
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(new Date(utcGuess));
  const bag: Record<string, string> = {};
  for (const part of parts) bag[part.type] = part.value;
  const asUtc = Date.UTC(
    Number(bag.year),
    Number(bag.month) - 1,
    Number(bag.day),
    Number(bag.hour),
    Number(bag.minute)
  );
  return new Date(utcGuess - (asUtc - utcGuess)).toISOString();
}

/** UTC ISO for the plan schedule start, when date + start time are known. */
export function eventPlanScheduleStartIso(
  schedule: Pick<EventPlanScheduleInput, 'startDate' | 'startTimeLabel' | 'timeZone'>
): string | null {
  const localValue = buildLocalDateTimeValue(schedule.startDate, schedule.startTimeLabel);

  if (!localValue) {
    return null;
  }

  try {
    return localDateTimeInputToIso(localValue, schedule.timeZone);
  } catch {
    return null;
  }
}

/** UTC ISO for the plan schedule end, when end date + finish time are known. */
export function eventPlanScheduleEndIso(
  schedule: Pick<
    EventPlanScheduleInput,
    'mode' | 'startDate' | 'endDate' | 'finishTimeLabel' | 'timeZone'
  >
): string | null {
  const endDate =
    schedule.mode === 'range'
      ? normalizeDateInput(schedule.endDate) || normalizeDateInput(schedule.startDate)
      : normalizeDateInput(schedule.startDate);
  const localValue = buildLocalDateTimeValue(endDate, schedule.finishTimeLabel);

  if (!localValue) {
    return null;
  }

  try {
    return localDateTimeInputToIso(localValue, schedule.timeZone);
  } catch {
    return null;
  }
}

export function formatLocalDateTimeValue(date: Date) {
  const year = `${date.getFullYear()}`;
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  const hours = `${date.getHours()}`.padStart(2, '0');
  const minutes = `${date.getMinutes()}`.padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function eventScheduleBounds(schedule: EventScheduleLike | null | undefined) {
  const startDate = normalizeDateInput(schedule?.startDate);
  const fallbackEndDate = schedule?.mode === 'range'
    ? normalizeDateInput(schedule?.endDate) || startDate
    : startDate;
  const startLocal = buildLocalDateTimeValue(startDate, schedule?.startTimeLabel, DAY_START_TIME);
  const endLocal = buildLocalDateTimeValue(fallbackEndDate, schedule?.finishTimeLabel, DAY_END_TIME);

  return {
    startDate: startDate || null,
    endDate: fallbackEndDate || null,
    startLocal,
    endLocal,
    start: parseLocalDateTimeValue(startLocal),
    end: parseLocalDateTimeValue(endLocal)
  };
}

export function eventScheduleDayBounds(
  schedule: EventScheduleLike | null | undefined,
  isoDay: string | null | undefined
) {
  const normalizedDay = normalizeDateInput(isoDay);
  const scheduleBounds = eventScheduleBounds(schedule);

  if (
    !normalizedDay ||
    !scheduleBounds.startDate ||
    !scheduleBounds.endDate ||
    normalizedDay < scheduleBounds.startDate ||
    normalizedDay > scheduleBounds.endDate
  ) {
    return null;
  }

  const startLocal = buildLocalDateTimeValue(
    normalizedDay,
    normalizedDay === scheduleBounds.startDate ? schedule?.startTimeLabel : DAY_START_TIME,
    DAY_START_TIME
  );
  const endLocal = buildLocalDateTimeValue(
    normalizedDay,
    normalizedDay === scheduleBounds.endDate ? schedule?.finishTimeLabel : DAY_END_TIME,
    DAY_END_TIME
  );

  return {
    startLocal,
    endLocal,
    start: parseLocalDateTimeValue(startLocal),
    end: parseLocalDateTimeValue(endLocal)
  };
}

export function eventScheduleIsValid(schedule: EventScheduleLike | null | undefined) {
  const bounds = eventScheduleBounds(schedule);

  return !!bounds.start && !!bounds.end && bounds.end.getTime() > bounds.start.getTime();
}

export function eventScheduleStartsInFuture(
  schedule: EventScheduleLike | null | undefined,
  now = new Date()
) {
  const bounds = eventScheduleBounds(schedule);

  return !!bounds.start && bounds.start.getTime() >= now.getTime();
}

export function eventActivityFitsSchedule(
  schedule: EventScheduleLike | null | undefined,
  scheduledAt: string,
  endsAt: string
) {
  const bounds = eventScheduleBounds(schedule);
  const scheduledStart = parseLocalDateTimeValue(scheduledAt);
  const scheduledEnd = parseLocalDateTimeValue(endsAt);

  if (!bounds.start || !bounds.end || !scheduledStart || !scheduledEnd) {
    return false;
  }

  return (
    scheduledEnd.getTime() > scheduledStart.getTime() &&
    scheduledStart.getTime() >= bounds.start.getTime() &&
    scheduledEnd.getTime() <= bounds.end.getTime()
  );
}

export function suggestedEventActivityWindow(
  schedule: EventScheduleLike | null | undefined,
  isoDay: string | null | undefined
) {
  const dayBounds = eventScheduleDayBounds(schedule, isoDay);

  if (!dayBounds?.startLocal || !dayBounds?.endLocal || !dayBounds.start || !dayBounds.end) {
    return {
      scheduledAt: '',
      endsAt: ''
    };
  }

  const suggestedEnd = new Date(
    Math.min(dayBounds.start.getTime() + 60 * 60 * 1000, dayBounds.end.getTime())
  );

  return {
    scheduledAt: dayBounds.startLocal,
    endsAt:
      suggestedEnd.getTime() > dayBounds.start.getTime()
        ? formatLocalDateTimeValue(suggestedEnd)
        : dayBounds.endLocal
  };
}

export function localTodayIsoDay(now = new Date()) {
  return formatLocalDateTimeValue(now).slice(0, 10);
}

export function isFutureSelectablePlanDay(
  schedule: EventScheduleLike | null | undefined,
  isoDay: string,
  now = new Date()
) {
  const today = localTodayIsoDay(now);

  if (isoDay > today) {
    return true;
  }

  if (isoDay < today) {
    return false;
  }

  const bounds = eventScheduleBounds(schedule);
  return !!bounds.end && bounds.end.getTime() > now.getTime();
}

export function eventPlanFutureDayIsos(
  plan: { schedule: EventScheduleLike } | null | undefined,
  now = new Date()
) {
  if (!plan) {
    return [];
  }

  const scheduledDays =
    plan.schedule.mode === 'date' || plan.schedule.mode === 'range'
      ? expandPlanDayIsos(plan.schedule)
      : [];

  return scheduledDays.filter((isoDay) => isFutureSelectablePlanDay(plan.schedule, isoDay, now));
}

function expandPlanDayIsos(schedule: EventScheduleLike) {
  const startDate = normalizeDateInput(schedule.startDate);

  if (!startDate) {
    return [];
  }

  const start = new Date(`${startDate}T00:00:00`);

  if (Number.isNaN(start.getTime())) {
    return [];
  }

  const endDate =
    schedule.mode === 'range' && schedule.endDate
      ? normalizeDateInput(schedule.endDate)
      : startDate;
  const end = new Date(`${endDate}T00:00:00`);

  if (Number.isNaN(end.getTime()) || end.getTime() < start.getTime()) {
    return [startDate];
  }

  const days: string[] = [];
  const cursor = new Date(start);

  while (cursor.getTime() <= end.getTime()) {
    const year = `${cursor.getFullYear()}`;
    const month = `${cursor.getMonth() + 1}`.padStart(2, '0');
    const day = `${cursor.getDate()}`.padStart(2, '0');
    days.push(`${year}-${month}-${day}`);
    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
}

export function canProposeEventActivity(
  plan: { schedule: EventScheduleLike } | null | undefined,
  now = new Date()
) {
  if (!plan) {
    return false;
  }

  const bounds = eventScheduleBounds(plan.schedule);

  if (!bounds.end || bounds.end.getTime() <= now.getTime()) {
    return false;
  }

  return eventPlanFutureDayIsos(plan, now).length > 0;
}