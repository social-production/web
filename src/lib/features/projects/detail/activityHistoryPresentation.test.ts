import { describe, expect, it } from 'vitest';
import {
  historyCardTone,
  historySectionVisible,
  participationPhaseLabel
} from './activityHistoryPresentation';

describe('participation and activity presentation', () => {
  it('removes a leading phase number from participation labels', () => {
    expect(participationPhaseLabel('1. Proposal')).toBe('Proposal');
    expect(participationPhaseLabel('2 Production Plan')).toBe('Production Plan');
    expect(participationPhaseLabel('Activity')).toBe('Activity');
  });

  it('hides activity history until there is something to show', () => {
    expect(historySectionVisible(0)).toBe(false);
    expect(historySectionVisible(2)).toBe(true);
  });

  it('colors history by completion and rating', () => {
    expect(historyCardTone({ completion: 'complete', ratingAverage: 5, ratingCount: 2 })).toBe('good');
    expect(historyCardTone({ completion: 'complete', ratingAverage: null, ratingCount: 0 })).toBe('mixed');
    expect(historyCardTone({ completion: 'mixed', ratingAverage: 4, ratingCount: 1 })).toBe('mixed');
    expect(historyCardTone({ completion: 'uncompleted', ratingAverage: 5, ratingCount: 1 })).toBe('poor');
    expect(historyCardTone({ completion: 'complete', ratingAverage: 2, ratingCount: 1 })).toBe('poor');
  });
});
