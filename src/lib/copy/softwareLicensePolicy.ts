export const SOFTWARE_LICENSE_DEFAULT_LABEL = 'AGPL v3';

export const softwareLicenseGuidanceTitle = 'AGPL v3 by default — keep the commons open';

export const softwareLicenseGuidanceBody =
  'Software plans on Social Production use the GNU Affero General Public License v3. That keeps source open, requires improvements to flow back when the software is offered as a service, and blocks private capture of collectively produced code.';

export const softwareLicenseGuidanceWhy = [
  'Derivative work stays open source instead of becoming proprietary.',
  'Network/service use still requires publishing modifications (closes the GPL service loophole).',
  'The output stays in the commons for direct use — not private commercial enclosure.'
];

export function softwareLicenseLabelForSubtype(subtype: string | null | undefined) {
  return subtype === 'software' ? SOFTWARE_LICENSE_DEFAULT_LABEL : undefined;
}
