import type { ProjectPlanVoteSummary } from '$lib/types/detail';

export function minimumAdditionalYesVotesNeeded(
  voteSummary: ProjectPlanVoteSummary,
  approvalThresholdPercent: number
) {
  const quorumVotesRequired = voteSummary.votesRequired;
  const remainingEligibleVotes = Math.max(voteSummary.remainingEligibleVotes, 0);

  if (quorumVotesRequired <= 0) {
    return 0;
  }

  for (let additionalYesVotes = 0; additionalYesVotes <= remainingEligibleVotes; additionalYesVotes += 1) {
    const votesAfterYes = voteSummary.totalVotes + additionalYesVotes;
    const extraVotesNeededForQuorum = Math.max(quorumVotesRequired - votesAfterYes, 0);

    if (additionalYesVotes + extraVotesNeededForQuorum > remainingEligibleVotes) {
      continue;
    }

    const finalTotalVotes = votesAfterYes + extraVotesNeededForQuorum;
    const finalYesVotes = voteSummary.yesCount + additionalYesVotes;

    if (
      finalTotalVotes > 0 &&
      finalYesVotes * 100 >= approvalThresholdPercent * finalTotalVotes
    ) {
      return additionalYesVotes;
    }
  }

  return null;
}

export function canProjectVoteStillPass(
  voteSummary: ProjectPlanVoteSummary,
  approvalThresholdPercent: number
) {
  return minimumAdditionalYesVotesNeeded(voteSummary, approvalThresholdPercent) !== null;
}

export function formatProjectVoteRequirement(
  voteSummary: ProjectPlanVoteSummary,
  approvalThresholdPercent: number
) {
  const additionalYesVotesNeeded =
    minimumAdditionalYesVotesNeeded(voteSummary, approvalThresholdPercent) ?? 0;
  const requiredLabel = additionalYesVotesNeeded === 1 ? 'vote' : 'votes';
  const remainingLabel = voteSummary.remainingEligibleVotes === 1 ? 'vote' : 'votes';

  return `${approvalThresholdPercent}% approval needed - ${additionalYesVotesNeeded} ${requiredLabel} required with ${voteSummary.remainingEligibleVotes} ${remainingLabel} remaining`;
}

export function formatProjectVoteSummary(voteSummary: ProjectPlanVoteSummary) {
  return `${voteSummary.approvalPercent}% approval · ${voteSummary.yesCount} yes · ${voteSummary.noCount} no`;
}