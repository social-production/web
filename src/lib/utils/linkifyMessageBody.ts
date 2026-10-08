const LINK_PATTERN =
  /(https?:\/\/[^\s<]+|www\.[^\s<]+|\/(?:projects|events|threads|messages|posts|profile)(?:\/[^\s<]+)?(?:\?[^\s<]+)?)/gi;

const MENTION_PATTERN = /(^|[^\w])@([A-Za-z0-9_-]{1,32})/g;

const TRAILING_PUNCTUATION = new RegExp('[.,;:!?\'"\\)\\]}]+$');

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function splitTrailing(raw: string): { core: string; trailing: string } {
  const trailing = raw.match(TRAILING_PUNCTUATION)?.[0] ?? '';
  const core = trailing ? raw.slice(0, -trailing.length) : raw;
  return { core, trailing };
}

function linkUrls(escaped: string): string {
  return escaped.replace(LINK_PATTERN, (raw) => {
    const { core, trailing } = splitTrailing(raw);
    if (!core) {
      return raw;
    }

    const internal = core.startsWith('/');
    const href = !internal && core.toLowerCase().startsWith('www.') ? `https://${core}` : core;
    const externalAttrs = internal ? '' : ' target="_blank" rel="noopener noreferrer"';
    return `<a href="${href}"${externalAttrs}>${core}</a>${trailing}`;
  });
}

function linkMentions(value: string) {
  return value
    .split(/(<a\b[^>]*>[\s\S]*?<\/a>)/)
    .map((part) => {
      if (part.startsWith('<a')) {
        return part;
      }

      return part.replace(MENTION_PATTERN, (_match, prefix: string, name: string) => {
        return `${prefix}<a class="mention" href="/profile/${name}">@${name}</a>`;
      });
    })
    .join('');
}

export function linkifyMessageBody(body: string): string {
  return linkMentions(linkUrls(escapeHtml(body)));
}
