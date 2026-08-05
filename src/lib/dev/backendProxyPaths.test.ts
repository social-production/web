import { describe, expect, it } from 'vitest';

import { backendProxyPaths } from './backendProxyPaths';

describe('backendProxyPaths', () => {
  it('proxies location API routes to the backend in dev', () => {
    expect(backendProxyPaths).toContain('/locations');
  });
});
