import { describe, expect, it } from 'vitest';
import { withoutRawPaths } from '$lib/utils/linkifyMessageBody';

describe('withoutRawPaths', () => {
  it('keeps the label of a labelled link line', () => {
    expect(
      withoutRawPaths(
        "Request 'Tune-up' · Pending\nView request: /projects/bike-tune-ups-294d?tab=participation&request=6dc2"
      )
    ).toBe("Request 'Tune-up' · Pending\nView request");
  });

  it('drops a bare "Open /path"', () => {
    expect(withoutRawPaths('You were invited. Open /events/northcote-repair-cafe-555e')).toBe(
      'You were invited.'
    );
  });

  it('leaves ordinary text alone', () => {
    expect(withoutRawPaths('See you at 3/4 past')).toBe('See you at 3/4 past');
  });
});
