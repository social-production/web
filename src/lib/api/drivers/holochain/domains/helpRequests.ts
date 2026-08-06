/**
 * Holochain `helpRequests` domain scaffold.
 * Responsibility: help request detail + role commits.
 * Replace stubs with real `web-holochain` calls mapped to `$lib/types/*`.
 */
import type { AppAdapter } from '$lib/services/adapters/types';
import { stubMethod } from '../../scaffold';

const provider = 'holochain' as const;
const domain = 'helpRequests' as const;

export const helpRequestsDomain: Partial<AppAdapter> = {
  getHelpRequest: stubMethod(provider, domain, 'getHelpRequest') as AppAdapter['getHelpRequest'],
  createHelpRequest: stubMethod(provider, domain, 'createHelpRequest') as AppAdapter['createHelpRequest'],
  commitHelpRequestRole: stubMethod(provider, domain, 'commitHelpRequestRole') as AppAdapter['commitHelpRequestRole'],
  uncommitHelpRequestRole: stubMethod(provider, domain, 'uncommitHelpRequestRole') as AppAdapter['uncommitHelpRequestRole'],
};

