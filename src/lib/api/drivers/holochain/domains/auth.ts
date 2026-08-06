/**
 * Holochain `auth` domain scaffold.
 * Responsibility: signIn / signUp / signOut.
 * Replace stubs with real `web-holochain` calls mapped to `$lib/types/*`.
 */
import type { AppAdapter } from '$lib/services/adapters/types';
import { stubMethod } from '../../scaffold';

const provider = 'holochain' as const;
const domain = 'auth' as const;

export const authDomain: Partial<AppAdapter> = {
  signIn: stubMethod(provider, domain, 'signIn') as AppAdapter['signIn'],
  signOut: stubMethod(provider, domain, 'signOut') as AppAdapter['signOut'],
  signUp: stubMethod(provider, domain, 'signUp') as AppAdapter['signUp'],
};

