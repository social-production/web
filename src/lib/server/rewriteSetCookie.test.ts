import { describe, expect, it } from 'vitest';
import { rewriteProxiedSetCookie } from './rewriteSetCookie';

describe('rewriteProxiedSetCookie', () => {
  it('moves the refresh cookie onto the proxied auth path', () => {
    const cookie =
      'sp_refresh=abc; HttpOnly; Max-Age=2592000; Path=/auth; SameSite=lax; Secure';

    expect(rewriteProxiedSetCookie(cookie)).toBe(
      'sp_refresh=abc; HttpOnly; Max-Age=2592000; Path=/api/auth; SameSite=lax; Secure'
    );
  });

  it('leaves the site-wide cookies on /', () => {
    const cookie = 'sp_csrf=abc; Max-Age=2592000; Path=/; SameSite=lax; Secure';

    expect(rewriteProxiedSetCookie(cookie)).toBe(cookie);
  });
});
