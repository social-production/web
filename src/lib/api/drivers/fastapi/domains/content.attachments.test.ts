import { describe, expect, it } from 'vitest';
import { mapComment } from '$lib/api/drivers/fastapi/domains/content';

describe('linked comment attachments', () => {
  it('maps governance attachment metadata onto comment urls', () => {
    const comment = mapComment({
      id: 'comment-1',
      author_id: 'user-1',
      author_username: 'ada',
      body: '',
      created_at: '2026-09-29T00:00:00Z',
      vote_count: 0,
      attachments: [
        {
          id: 'file-1',
          kind: 'image',
          filename: 'dot.png',
          content_type: 'image/png',
          byte_size: 12
        }
      ]
    });

    expect(comment.attachments?.[0]).toMatchObject({
      id: 'file-1',
      kind: 'image',
      filename: 'dot.png',
      contentType: 'image/png',
      byteSize: 12
    });
    expect(comment.attachments?.[0].url).toContain('/governance/attachments/file-1');
  });
});
