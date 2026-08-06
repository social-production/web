/**
 * Supabase `bootstrap` domain scaffold.
 * Responsibility: bootstrap + unread summary + onboarding.
 * Replace stubs with real `web-supabase` calls mapped to `$lib/types/*`.
 */
import type { AppAdapter } from '$lib/services/adapters/types';
import { stubMethod } from '../../scaffold';

const provider = 'supabase' as const;
const domain = 'bootstrap' as const;

export const bootstrapDomain: Partial<AppAdapter> = {
  getBootstrap: stubMethod(provider, domain, 'getBootstrap') as AppAdapter['getBootstrap'],
  getBootstrapSummary: stubMethod(provider, domain, 'getBootstrapSummary') as AppAdapter['getBootstrapSummary'],
  getOnboarding: stubMethod(provider, domain, 'getOnboarding') as AppAdapter['getOnboarding'],
};

