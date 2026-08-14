import { describe, expect, it } from 'vitest';
import { restPath } from '$lib/server/supabaseProxy';

describe('supabase same-origin proxy', () => {
  it('joins rest path segments', () => {
    expect(restPath('gateway/bootstrap')).toBe('gateway/bootstrap');
    expect(restPath(['gateway', 'bootstrap'])).toBe('gateway/bootstrap');
    expect(restPath(undefined)).toBe('');
  });
});
