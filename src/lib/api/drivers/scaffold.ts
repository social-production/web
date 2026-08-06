/**
 * Shared helpers for beginner provider driver scaffolds.
 * Domains throw until real SDK/backend wiring replaces them.
 */

import type { AppAdapter } from '$lib/services/adapters/types';
import { PROVIDER_REQUIRED_DOMAINS } from './registry';

export function domainNotImplemented(
  provider: string,
  domain: string,
  method: string
): never {
  throw new Error(
    [
      `${provider} driver: ${method} is not implemented.`,
      `Implement src/lib/api/drivers/${provider}/domains/${domain}.ts`,
      `and wire it in src/lib/api/drivers/${provider}/index.ts.`,
      `Required domains: ${PROVIDER_REQUIRED_DOMAINS.join(', ')}.`
    ].join(' ')
  );
}

export type ScaffoldMethod = (...args: never[]) => Promise<never> | never;

/** Build an AppAdapter method that fails with a domain-scoped message. */
export function stubMethod(
  provider: string,
  domain: string,
  method: string
): ScaffoldMethod {
  return (async () => domainNotImplemented(provider, domain, method)) as ScaffoldMethod;
}

/**
 * Assemble a navigable AppAdapter from per-domain method maps.
 * Any AppAdapter key missing from domains still fails loudly via a catch-all Proxy layer.
 */
export function assembleScaffoldDriver(
  provider: string,
  domainMethods: Record<string, Partial<AppAdapter>>
): AppAdapter {
  const assembled = Object.assign({}, ...Object.values(domainMethods)) as AppAdapter;

  return new Proxy(assembled, {
    get(target, prop: string | symbol) {
      if (typeof prop !== 'string') {
        return undefined;
      }
      const value = Reflect.get(target, prop);
      if (typeof value === 'function') {
        return value;
      }
      return async (..._args: unknown[]) =>
        domainNotImplemented(provider, 'index', prop);
    }
  });
}
