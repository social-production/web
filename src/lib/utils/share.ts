import { showToast } from '$lib/stores/toast';

export type ShareInput = { url: string; title?: string; text?: string };

export function canUseNativeShare(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
}

/** Copy a link and say so. Returns false when the browser refuses. */
export async function copyLink(url: string, label = 'Link copied'): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(url);
    showToast(label);
    return true;
  } catch {
    showToast('Could not copy the link', 'error');
    return false;
  }
}

/**
 * Share the way other sites do: the device's own share sheet where there is one
 * (phones, Safari, Edge), otherwise copy the link.
 */
export async function shareLink(input: ShareInput): Promise<void> {
  if (canUseNativeShare()) {
    try {
      await navigator.share({ url: input.url, title: input.title, text: input.text });
      return;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
    }
  }
  await copyLink(input.url);
}

/** Links for the common places people share to, for browsers without a share sheet. */
export function shareTargets(
  input: ShareInput
): Array<{ id: string; label: string; href: string }> {
  const url = encodeURIComponent(input.url);
  const text = encodeURIComponent(input.title ?? input.text ?? '');
  const both = encodeURIComponent(`${input.title ?? ''} ${input.url}`.trim());
  return [
    { id: 'whatsapp', label: 'WhatsApp', href: `https://wa.me/?text=${both}` },
    { id: 'telegram', label: 'Telegram', href: `https://t.me/share/url?url=${url}&text=${text}` },
    { id: 'email', label: 'Email', href: `mailto:?subject=${text}&body=${both}` },
    { id: 'x', label: 'X', href: `https://x.com/intent/post?url=${url}&text=${text}` },
    {
      id: 'facebook',
      label: 'Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
    },
  ];
}
