export function parseInviteToken(raw: string): string {
  const value = raw.trim();
  if (!value) {
    return '';
  }

  for (const param of ['invite', 'token']) {
    const match = value.match(new RegExp(`[?&]${param}=([^&#]+)`));
    if (match?.[1]) {
      return decodeURIComponent(match[1].trim());
    }
  }

  return value;
}

export function toAbsoluteInviteLink(pathOrUrl: string): string {
  if (!pathOrUrl) {
    return '';
  }

  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    return pathOrUrl;
  }

  if (typeof window === 'undefined') {
    return pathOrUrl;
  }

  return `${window.location.origin}${pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`}`;
}
