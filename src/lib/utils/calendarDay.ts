export function isoDayFromValue(value: string | Date | null | undefined) {
  if (!value) {
    return '';
  }

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return '';
    }

    const year = value.getFullYear();
    const month = `${value.getMonth() + 1}`.padStart(2, '0');
    const day = `${value.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  const parts = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (parts) {
    return `${parts[1]}-${parts[2]}-${parts[3]}`;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function activityOverlapsIsoDay(
  activity: { startAt?: string; endAt?: string; scheduledAt?: string },
  isoDay: string
) {
  if (!isoDay) {
    return false;
  }

  const dayStart = new Date(`${isoDay}T00:00:00`);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const startValue = activity.startAt || activity.scheduledAt || '';
  const endValue = activity.endAt || activity.startAt || activity.scheduledAt || '';
  const start = new Date(startValue);
  const end = new Date(endValue);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return isoDayFromValue(startValue) === isoDay;
  }

  return start.getTime() < dayEnd.getTime() && end.getTime() > dayStart.getTime();
}

export function formatIsoDayLabel(isoDay: string) {
  const date = new Date(`${isoDay}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return isoDay;
  }

  return date.toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
}

/** Calendar day (YYYY-MM-DD) of an instant as seen in `timeZone`. */
export function isoDayInZone(value: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(value);
  const bag: Record<string, string> = {};
  for (const part of parts) bag[part.type] = part.value;
  return `${bag.year}-${bag.month}-${bag.day}`;
}

function zoneOffsetMs(instant: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).formatToParts(new Date(instant));
  const bag: Record<string, number> = {};
  for (const part of parts) bag[part.type] = Number(part.value);
  const asUtc = Date.UTC(bag.year, bag.month - 1, bag.day, bag.hour, bag.minute, bag.second);
  return asUtc - Math.floor(instant / 1000) * 1000;
}

/** The instant a calendar day starts (midnight) in `timeZone`. */
export function zonedDayStart(isoDay: string, timeZone: string): Date {
  const [year, month, day] = isoDay.split('-').map(Number);
  const guess = Date.UTC(year, month - 1, day);
  // Two passes settle days where the offset changes (daylight saving).
  const first = guess - zoneOffsetMs(guess, timeZone);
  return new Date(guess - zoneOffsetMs(first, timeZone));
}
