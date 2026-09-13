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
