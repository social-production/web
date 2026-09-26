import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('session keepalive', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-24T00:00:00Z'));
    document.cookie = 'sp_csrf=token';
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    document.cookie = 'sp_csrf=; Max-Age=0';
  });

  it('refreshes before a later read once the access cookie is close to expiry', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith('/auth/refresh')) {
        return new Response(JSON.stringify({ token_type: 'bearer' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      return new Response(JSON.stringify({ ok: true, method: init?.method }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    const { apiClient } = await import('./client');

    const paths = () => fetchMock.mock.calls.map((call) => new URL(String(call[0])).pathname);

    await apiClient.get('/projects/demo');
    expect(paths()).toEqual(['/auth/refresh', '/projects/demo']);

    fetchMock.mockClear();
    vi.setSystemTime(new Date('2026-09-24T00:09:00Z'));
    await apiClient.get('/projects/demo');
    expect(paths()).toEqual(['/projects/demo']);

    fetchMock.mockClear();
    vi.setSystemTime(new Date('2026-09-24T00:10:01Z'));
    await apiClient.get('/projects/demo');
    expect(paths()).toEqual(['/auth/refresh', '/projects/demo']);
  });
});
