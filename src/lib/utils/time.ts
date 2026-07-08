export function formatRelativeTime(value: string): string {
  const date = new Date(value);
  const deltaMs = Date.now() - date.getTime();

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const minutes = Math.round(deltaMs / 60000);
  if (minutes < 60) {
    return `${Math.max(minutes, 1)}m ago`;
  }

  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.round(hours / 24);
  if (days < 7) {
    return `${days}d ago`;
  }

  return date.toLocaleDateString();
}

export function formatRelativeTimeCompact(value: string): string {
  const date = new Date(value);
  const deltaMs = Math.abs(Date.now() - date.getTime());

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const minutes = Math.max(Math.round(deltaMs / 60000), 1);
  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    return `${hours}h`;
  }

  const days = Math.round(hours / 24);
  if (days < 7) {
    return `${days}d`;
  }

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric'
  });
}

export function describeActivityTime(createdAt: string, lastActivityAt: string): string {
  const createdMs = new Date(createdAt).getTime();
  const lastActivityMs = new Date(lastActivityAt).getTime();
  const isUpdated = !Number.isNaN(createdMs) && !Number.isNaN(lastActivityMs) && lastActivityMs > createdMs;

  return `${isUpdated ? 'updated' : 'created'} ${formatRelativeTimeCompact(
    isUpdated ? lastActivityAt : createdAt
  )}`;
}

export function describeUpdateTime(createdAt: string, lastUpdateAt?: string | null): string {
  if (!lastUpdateAt) {
    return `created ${formatRelativeTimeCompact(createdAt)}`;
  }

  const createdMs = new Date(createdAt).getTime();
  const lastUpdateMs = new Date(lastUpdateAt).getTime();
  const isUpdated = !Number.isNaN(createdMs) && !Number.isNaN(lastUpdateMs) && lastUpdateMs > createdMs;

  return `${isUpdated ? 'updated' : 'created'} ${formatRelativeTimeCompact(
    isUpdated ? lastUpdateAt : createdAt
  )}`;
}

import { getDisplayTimezone } from '$lib/stores/timezoneStore';

function resolvedTimeZone() {
  return getDisplayTimezone();
}

export function formatLocalTimezoneAbbreviation(date: Date, timeZone = resolvedTimeZone()): string {
  const abbreviationLocale = timeZone.startsWith('Australia/') ? 'en-AU' : undefined;

  const abbreviation =
    new Intl.DateTimeFormat(abbreviationLocale, {
      timeZone,
      timeZoneName: 'short'
    })
      .formatToParts(date)
      .find((part) => part.type === 'timeZoneName')?.value ?? '';

  if (/^GMT[+-]/i.test(abbreviation)) {
    return '';
  }

  return abbreviation;
}

export function formatLocalDateTime(value: string | null | undefined): string {
  const trimmed = value?.trim() ?? '';

  if (!trimmed) {
    return '';
  }

  const date = new Date(trimmed);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const formatted = date.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: resolvedTimeZone()
  });

  const timezone = formatLocalTimezoneAbbreviation(date, resolvedTimeZone());

  return timezone ? `${formatted} ${timezone}` : formatted;
}

export function formatLocalDateTimeRange(startValue: string | null | undefined, endValue: string | null | undefined): string {
  const start = startValue?.trim() ?? '';
  const end = endValue?.trim() ?? '';

  if (!start) {
    return '';
  }

  const startDate = new Date(start);
  const endDate = end ? new Date(end) : null;

  if (Number.isNaN(startDate.getTime())) {
    return '';
  }

  if (!endDate || Number.isNaN(endDate.getTime())) {
    return formatLocalDateTime(start);
  }

  const sameDay =
    startDate.getFullYear() === endDate.getFullYear() &&
    startDate.getMonth() === endDate.getMonth() &&
    startDate.getDate() === endDate.getDate();

  if (sameDay) {
    const timeZone = resolvedTimeZone();
    const datePart = startDate.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone
    });
    const startTime = startDate.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
      timeZone
    });
    const endTime = endDate.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
      timeZone
    });
    const timezone = formatLocalTimezoneAbbreviation(endDate, timeZone);

    return timezone
      ? `${datePart}, ${startTime} – ${endTime} ${timezone}`
      : `${datePart}, ${startTime} – ${endTime}`;
  }

  return `${formatLocalDateTime(start)} – ${formatLocalDateTime(end)}`;
}

export function formatCalendarTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: resolvedTimeZone()
  });
}

export function formatScheduleLabel(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const timeZone = resolvedTimeZone();
  const formatted = date.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone
  });

  const timezone = formatLocalTimezoneAbbreviation(date, timeZone);
  const withAt = formatted.replace(',', ' at').replace(' at ', ' at ');

  return timezone ? `${withAt} ${timezone}` : withAt;
}

function formatClockLabel(value: string | null | undefined, timeZone = resolvedTimeZone()) {
  const trimmed = value?.trim() ?? '';

  if (!trimmed) {
    return '';
  }

  const match = trimmed.match(/^(\d{1,2}):(\d{2})/);

  if (!match) {
    return trimmed;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);

  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    timeZone
  });
}

function formatShortDateLabel(value: string | null | undefined, timeZone = resolvedTimeZone()) {
  const trimmed = value?.trim() ?? '';

  if (!trimmed) {
    return '';
  }

  const date = new Date(`${trimmed}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return trimmed;
  }

  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone
  });
}

export function formatEventPlanSchedule(
  schedule: {
    mode: string;
    startDate?: string | null;
    endDate?: string | null;
    startTimeLabel?: string | null;
    finishTimeLabel?: string | null;
  } | null | undefined
) {
  if (!schedule) {
    return '';
  }

  const timeZone = resolvedTimeZone();
  const startTime = formatClockLabel(schedule.startTimeLabel, timeZone);
  const finishTime = formatClockLabel(schedule.finishTimeLabel, timeZone);
  const timeRange =
    startTime && finishTime ? `${startTime} – ${finishTime}` : startTime || finishTime || '';

  const timezone = formatLocalTimezoneAbbreviation(new Date(), timeZone);

  if (schedule.mode === 'range' && schedule.startDate && schedule.endDate) {
    const start = formatShortDateLabel(schedule.startDate, timeZone);
    const end = formatShortDateLabel(schedule.endDate, timeZone);
    const dateLabel =
      schedule.startDate === schedule.endDate ? start : `${start} – ${end}`;
    return [dateLabel, timeRange, timezone].filter(Boolean).join(' · ');
  }

  if (schedule.startDate) {
    return [formatShortDateLabel(schedule.startDate), timeRange, timezone].filter(Boolean).join(' · ');
  }

  return [timeRange, timezone].filter(Boolean).join(' · ');
}

export function scrollComposerIntoView(element: HTMLElement | null, topOffset = 104) {
  if (!element || typeof window === 'undefined') {
    return;
  }

  const topbarHeight = document.querySelector<HTMLElement>('.topbar')?.getBoundingClientRect().height ?? 0;
  const offset = topbarHeight + 12 || topOffset;
  const targetTop = Math.max(window.scrollY + element.getBoundingClientRect().top - offset, 0);

  window.scrollTo({
    top: targetTop,
    behavior: 'auto'
  });
}

export async function preserveScrollDuring(action: () => Promise<void>) {
  if (typeof window === 'undefined') {
    await action();
    return;
  }

  const scrollY = window.scrollY;

  await action();

  requestAnimationFrame(() => {
    window.scrollTo({ top: scrollY, behavior: 'instant' as ScrollBehavior });
  });
}