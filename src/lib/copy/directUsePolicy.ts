export type DirectUsePolicyVariant = 'create' | 'plan' | 'request';

export const directUsePolicyCore =
  'Activity here is for direct mutual use only. Do not charge fees, sell outputs, gate participation with money, or use this to earn income.';

export const directUsePolicyByVariant: Record<DirectUsePolicyVariant, string> = {
  create:
    'Projects and services on Social Production are for direct community use. Nothing produced or offered may be sold, and pooled costs cover materials only — not profit.',
  plan:
    'Plans must describe work for direct use only. Do not plan to sell outputs, charge for access, or run paid facilitation.',
  request:
    'Help and service activity here is voluntary mutual aid. No payment is expected, accepted, or offered for the work.'
};

export const directUsePolicyEventCreate =
  'Events must stay free to join. Do not plan ticket sales, paid entry, or paid facilitation through this platform.';

export function directUsePolicyText(variant: DirectUsePolicyVariant) {
  return directUsePolicyByVariant[variant];
}
