export const GOVERNANCE_APPROVAL_THRESHOLD_PERCENT = 66;

export interface GovernanceQuorum {
  votesRequired: number;
  quorumThresholdPercent: number;
}

function normalizePopulation(population: number) {
  if (!Number.isFinite(population)) {
    return 0;
  }

  return Math.max(Math.floor(population), 0);
}

function calculateMarginOfError(population: number) {
  if (population < 100) {
    return 0.1 - (0.03 * (population - 1)) / 99;
  }

  if (population < 500) {
    return 0.07 - (0.02 * (population - 100)) / 400;
  }

  return Math.max(0.02, 0.05 - (0.03 * Math.log10(population / 500)) / Math.log10(2000));
}

export function calculateRequiredVotes(population: number) {
  const normalizedPopulation = normalizePopulation(population);

  if (normalizedPopulation <= 0) {
    return 0;
  }

  const marginOfError = calculateMarginOfError(normalizedPopulation);
  const baseSampleSize = 0.9604 / marginOfError ** 2;
  const cochran = Math.ceil(
    baseSampleSize / (1 + (baseSampleSize - 1) / normalizedPopulation)
  );

  return Math.min(Math.ceil(0.75 * normalizedPopulation), cochran);
}

export function calculateGovernanceQuorum(population: number): GovernanceQuorum {
  const normalizedPopulation = normalizePopulation(population);
  const votesRequired = calculateRequiredVotes(normalizedPopulation);

  return {
    votesRequired,
    quorumThresholdPercent:
      normalizedPopulation <= 0 ? 0 : Math.round((votesRequired / normalizedPopulation) * 100)
  };
}