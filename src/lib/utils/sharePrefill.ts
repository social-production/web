export function buildSharePrefill(title: string, path: string) {
  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://socialproduction.local';
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `Check this out: ${title}\n${origin}${normalizedPath}`;
}
