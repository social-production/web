export function buildShareUrl(path: string) {
  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://socialproduction.local';
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${origin}${normalizedPath}`;
}

export function buildSharePrefill(title: string, path: string) {
  return `Check this out: ${title}\n${buildShareUrl(path)}`;
}
