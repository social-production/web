import { describe, expect, it } from 'vitest';
import { parseFlag } from './env';

describe('parseFlag', () => {
  it('treats true and false as explicit', () => {
    expect(parseFlag('true', false)).toBe(true);
    expect(parseFlag('FALSE', true)).toBe(false);
  });

  it('keeps the default when the variable is empty', () => {
    expect(parseFlag(undefined, true)).toBe(true);
    expect(parseFlag('  ', false)).toBe(false);
  });
});
