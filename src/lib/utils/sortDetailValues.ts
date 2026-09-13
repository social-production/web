import type { ProjectValueItem } from '$lib/types/detail';

export function sortValuesForRating(values: ProjectValueItem[]): ProjectValueItem[] {
  return [...values].sort((left, right) => {
    const leftNeedsVote = left.activeImportanceVote <= 0;
    const rightNeedsVote = right.activeImportanceVote <= 0;

    if (leftNeedsVote !== rightNeedsVote) {
      return leftNeedsVote ? 1 : -1;
    }

    if (right.importanceScore !== left.importanceScore) {
      return right.importanceScore - left.importanceScore;
    }

    return left.label.localeCompare(right.label);
  });
}
