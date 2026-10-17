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

/** Instant used by compact clock stamps (updated if newer than created). */
export function activityStampInstant(createdAt: string, lastUpdateAt?: string | null): string {
  if (!lastUpdateAt) return createdAt;
  const createdMs = new Date(createdAt).getTime();
  const lastUpdateMs = new Date(lastUpdateAt).getTime();
  if (!Number.isNaN(createdMs) && !Number.isNaN(lastUpdateMs) && lastUpdateMs > createdMs) {
    return lastUpdateAt;
  }
  return createdAt;
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

const DEFAULT_MARKER_DURATION_MS = 2 * 60 * 60 * 1000;

/** Effective end time for map markers when `ends_at` is missing (+2h default). */
export function effectiveEndsAt(
  scheduledAt: string | null | undefined,
  endsAt: string | null | undefined
): string | null {
  const start = scheduledAt?.trim() ?? '';
  if (!start) {
    return null;
  }

  const end = endsAt?.trim() ?? '';
  if (end) {
    const endDate = new Date(end);
    if (!Number.isNaN(endDate.getTime())) {
      return end;
    }
  }

  const startDate = new Date(start);
  if (Number.isNaN(startDate.getTime())) {
    return null;
  }

  return new Date(startDate.getTime() + DEFAULT_MARKER_DURATION_MS).toISOString();
}

/** Format scheduled range for map pins/cards, inferring +2h end when needed. */
export function formatMarkerScheduleRange(
  scheduledAt: string | null | undefined,
  endsAt: string | null | undefined
): string {
  if (!scheduledAt?.trim()) {
    return '';
  }
  return formatLocalDateTimeRange(scheduledAt, effectiveEndsAt(scheduledAt, endsAt));
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
  return timezone ? `${formatted} ${timezone}` : formatted;
}

function formatWallClockLabel(value: string | null | undefined) {
  const trimmed = value?.trim() ?? '';
  const match = trimmed.match(/^(\d{1,2}):(\d{2})/);
  if (!match) {
    return trimmed;
  }
  const date = new Date(Date.UTC(2000, 0, 1, Number(match[1]), Number(match[2])));
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' });
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
    timeZone?: string | null;
  } | null | undefined
) {
  if (!schedule) {
    return '';
  }

  // Plan times are stored in UTC and converted into the viewer's zone on load
  // (eventPlanScheduleInZone), so show them as given, labelled with that zone.
  const timeZone = schedule.timeZone?.trim() || resolvedTimeZone();
  const startTime = formatWallClockLabel(schedule.startTimeLabel);
  const finishTime = formatWallClockLabel(schedule.finishTimeLabel);
  const timeRange =
    startTime && finishTime ? `${startTime} – ${finishTime}` : startTime || finishTime || '';

  const timezone = formatLocalTimezoneAbbreviation(
    schedule.startDate ? new Date(`${schedule.startDate}T12:00:00Z`) : new Date(),
    timeZone
  );

  if (schedule.mode === 'range' && schedule.startDate && schedule.endDate) {
    const start = formatShortDateLabel(schedule.startDate, timeZone);
    const end = formatShortDateLabel(schedule.endDate, timeZone);
    if (schedule.startDate === schedule.endDate) {
      return [start, timeRange, timezone].filter(Boolean).join(' · ');
    }
    // One continuous span: tie each time to its own day.
    const from = startTime ? `${start}, ${startTime}` : start;
    const to = finishTime ? `${end}, ${finishTime}` : end;
    return [`${from} – ${to}`, timezone].filter(Boolean).join(' · ');
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

export { preserveScrollDuring } from '$lib/utils/scrollAnchors';