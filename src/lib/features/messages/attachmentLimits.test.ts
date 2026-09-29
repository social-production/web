import { describe, expect, it } from 'vitest';
import { rejectOutgoingAttachment } from './attachmentLimits';

describe('rejectOutgoingAttachment', () => {
  it('refuses an oversize photo before upload', () => {
    expect(
      rejectOutgoingAttachment({ type: 'image/jpeg', size: 10 * 1024 * 1024 + 1 })
    ).toBe('Photos must be 10MB or smaller.');
  });
});
