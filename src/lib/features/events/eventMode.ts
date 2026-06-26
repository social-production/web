export type EventPhaseId = 'proposal' | 'event-plan' | 'activity' | 'closed';

export function eventFeedPhaseLabel(phaseId: string | null | undefined): string {
  switch (phaseId) {
    case 'proposal':
      return 'Proposal';
    case 'event-plan':
      return 'Event Plan';
    case 'activity':
      return 'Activity';
    case 'closed':
      return 'Closed';
    default:
      return 'Proposal';
  }
}
