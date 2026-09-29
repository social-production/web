export type HistoryCardTone = 'good' | 'mixed' | 'poor';

export function participationPhaseLabel(title: string) {
  return title.replace(/^\s*\d+\s*[.)\-:]?\s*/, '').trim();
}

export function historySectionVisible(count: number) {
  return count > 0;
}

export function historyCardTone(input: {
  completion: 'complete' | 'mixed' | 'uncompleted';
  ratingAverage: number | null;
  ratingCount: number;
}): HistoryCardTone {
  const poorRating = input.ratingCount > 0 && input.ratingAverage !== null && input.ratingAverage < 3;
  if (input.completion === 'uncompleted' || poorRating) {
    return 'poor';
  }
  if (input.completion === 'mixed' || input.ratingCount === 0) {
    return 'mixed';
  }
  return 'good';
}
