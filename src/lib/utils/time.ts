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

export function formatCalendarTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}