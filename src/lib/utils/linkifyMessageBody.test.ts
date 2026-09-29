import { describe, expect, it } from 'vitest';
import { linkifyMessageBody } from './linkifyMessageBody';

describe('linkifyMessageBody', () => {
  it('links an external url and leaves trailing punctuation outside', () => {
    expect(linkifyMessageBody('See https://example.com/docs.')).toBe(
      'See <a href="https://example.com/docs" target="_blank" rel="noopener noreferrer">https://example.com/docs</a>.'
    );
  });

  it('prefixes a bare www host with https', () => {
    expect(linkifyMessageBody('www.example.com')).toBe(
      '<a href="https://www.example.com" target="_blank" rel="noopener noreferrer">www.example.com</a>'
    );
  });

  it('keeps an internal path in the same tab', () => {
    expect(linkifyMessageBody('Look at /projects/garden')).toBe(
      'Look at <a href="/projects/garden">/projects/garden</a>'
    );
  });

  it('escapes markup instead of rendering it', () => {
    const html = linkifyMessageBody('<img src=x onerror=alert(1)>');
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;img');
  });
});
