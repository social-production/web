const INTERNAL_PATH_PATTERN =
  /(\/(?:projects|events|threads|messages|posts|profile)(?:\/[^\s<]+)?(?:\?[^\s<]+)?)/g;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function linkifyMessageBody(body: string): string {
  const escaped = escapeHtml(body);

  return escaped.replace(INTERNAL_PATH_PATTERN, (match) => `<a href="${match}">${match}</a>`);
}
