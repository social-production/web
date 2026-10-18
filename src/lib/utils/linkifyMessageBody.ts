import { formatLocalDateTime } from '$lib/utils/time';

const ISO_INSTANT = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})/g;

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

// "View request: /projects/x?…" on its own line reads as a "View request" link, not a raw path.
const LABELLED_INTERNAL_LINE =
  /^([A-Za-z][A-Za-z ]{1,40}): (\/(?:projects|events|threads|messages|posts|profile|help-requests)\S*)$/gm;

function linkLabelledLines(escaped: string): string {
  return escaped.replace(LABELLED_INTERNAL_LINE, (_line, label: string, path: string) => {
    return `<a href="${path}">${label}</a>`;
  });
}

function linkUrls(escaped: string): string {
  // Leave links made by linkLabelledLines alone.
  return escaped
    .split(/(<a\b[^>]*>[\s\S]*?<\/a>)/)
    .map((part) => (part.startsWith('<a') ? part : linkBareUrls(part)))
    .join('');
}

function linkBareUrls(escaped: string): string {
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

const INTERNAL_PATH = /\/(?:projects|events|threads|messages|posts|profile|help-requests|communities|channels|invites)\/?\S*/;

/**
 * Plain text for previews and notices: "View request: /projects/x?…" becomes "View request",
 * and a stray "Open /events/x" loses the path. Links stay clickable where the full message shows.
 */
export function withoutRawPaths(text: string): string {
  return localizeInstants(text)
    .replace(LABELLED_INTERNAL_LINE, (_line, label: string) => label)
    .replace(new RegExp(`\\s*\\bOpen ${INTERNAL_PATH.source}`, 'g'), '')
    .replace(new RegExp(`\\s*${INTERNAL_PATH.source}`, 'g'), '')
    .trim();
}

/** Request messages carry times as ISO instants; show them in the viewer's own zone. */
export function localizeInstants(text: string): string {
  return text.replace(ISO_INSTANT, (instant) => formatLocalDateTime(instant) || instant);
}

export function linkifyMessageBody(body: string): string {
  const withTimes = localizeInstants(body);
  return linkMentions(linkUrls(linkLabelledLines(escapeHtml(withTimes))));
}
