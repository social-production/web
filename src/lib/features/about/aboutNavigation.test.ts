import { describe, expect, it } from 'vitest';
import { ABOUT_SECTIONS, ABOUT_TABS } from './aboutContent';

const sectionIds = [
  'purpose',
  'strategy',
  'roadmap',
  'costs',
  'governance',
  'moderation',
  'join'
];

describe('about navigation', () => {
  it('keeps purpose, strategy, and roadmap first, then the rest of the essay', () => {
    expect(ABOUT_SECTIONS.map((section) => section.id)).toEqual(sectionIds);
    expect(ABOUT_TABS.map((tab) => tab.id)).toEqual(sectionIds);
  });
});
