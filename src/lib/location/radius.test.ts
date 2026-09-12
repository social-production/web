import { describe, expect, it } from 'vitest';
import { GLOBAL_RADIUS_KM, shouldAdoptViewportRadius } from './radius';

describe('shouldAdoptViewportRadius', () => {
  it('keeps a picked radius after programmatic camera moves', () => {
    expect(shouldAdoptViewportRadius(50, 72, false)).toBe(false);
    expect(shouldAdoptViewportRadius(50, 38, false)).toBe(false);
  });

  it('adopts the viewport when the user zooms in past the picked radius', () => {
    expect(shouldAdoptViewportRadius(50, 22, true)).toBe(true);
  });

  it('adopts the viewport when the user zooms out past the picked radius', () => {
    expect(shouldAdoptViewportRadius(50, 80, true)).toBe(true);
  });

  it('ignores small viewport jitter after a 50 km snap', () => {
    expect(shouldAdoptViewportRadius(50, 51, true)).toBe(false);
    expect(shouldAdoptViewportRadius(50, 49, true)).toBe(false);
  });

  it('does not grow Global from viewport measurements', () => {
    expect(shouldAdoptViewportRadius(GLOBAL_RADIUS_KM, 25000, true)).toBe(false);
  });

  it('shrinks Global when the user zooms in', () => {
    expect(shouldAdoptViewportRadius(GLOBAL_RADIUS_KM, 400, true)).toBe(true);
  });
});
