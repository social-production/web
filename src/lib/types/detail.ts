import type { ProjectMode, TagRef, VoteDirection } from '$lib/types/feed';

export interface DetailUpdate {
  id: string;
  title: string;
  body: string;
  authorUsername: string;
  createdAt: string;
}

export interface DetailMember {
  id: string;
  username: string;
  bio?: string;
}

export interface RoleMember extends DetailMember {
  confidenceTargetId?: string;
  confidenceVoteCount?: number;
  confidenceActiveVote?: VoteDirection;
  confidenceRatio?: number;
  confidenceReviewCount?: number;
  isManagerCandidate?: boolean;
}

export type ProjectRoleMember = RoleMember;
export type EventRoleMember = RoleMember;

export interface DetailComment {
  id: string;
  authorUsername: string;
  body: string;
  createdAt: string;
  voteCount: number;
  activeVote: VoteDirection;
  replies: DetailComment[];
}

export type ProjectLifecyclePhaseId =
  | 'phase-1'
  | 'phase-2'
  | 'phase-3'
  | 'phase-4'
  | 'phase-5'
  | 'phase-6';

export type ProjectLifecycleProgressState = 'complete' | 'current' | 'upcoming' | 'locked';

export type ProjectImportanceVoteValue = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
export type ProjectApprovalVote = 'yes' | 'no';
export type ProjectServiceRequestStatus = 'open' | 'accepted' | 'declined';

export interface ProjectPlanPhaseInput {
  title: string;
  details: string;
  materialsLabel: string;
  costLabel: string;
}

export interface ProjectPlanPhaseItem extends ProjectPlanPhaseInput {
  id: string;
}

export interface ProjectValueItem {
  id: string;
  label: string;
  authorUsername: string;
  voteCount: number;
  importanceScore: number;
  importanceLabel: string;
  activeImportanceVote: ProjectImportanceVoteValue | 0;
}

export interface ProjectPlanVoteSummary {
  yesCount: number;
  noCount: number;
  totalVotes: number;
  approvalPercent: number;
  activeVote: ProjectApprovalVote | null;
  meetsQuorum: boolean;
}

export interface ProjectPlanValueAssessment extends ProjectPlanVoteSummary {
  valueId: string;
  valueLabel: string;
}

export interface ProjectProductionPlanInput {
  title: string;
  description: string;
  totalCostLabel: string;
  planPhases: ProjectPlanPhaseInput[];
  outputSummary?: string;
  materialsSummary?: string;
  acquisitionsSummary?: string;
}

export interface ProjectDistributionPlanInput {
  title: string;
  description: string;
  totalCostLabel: string;
  planPhases: ProjectPlanPhaseInput[];
  distributionSummary?: string;
  accessSummary?: string;
  reserveSummary?: string;
  requestSystemEnabled?: boolean;
}

export interface ProjectActivityRoleInput {
  label: string;
  requiredCount: number;
}

export interface ProjectProductionPlan {
  id: string;
  title: string;
  authorUsername: string;
  createdAt: string;
  description: string;
  planPhases: ProjectPlanPhaseItem[];
  outputSummary: string;
  materialsSummary: string;
  totalCostLabel: string;
  acquisitionsSummary: string;
  valueAssessments: ProjectPlanValueAssessment[];
  overallApproval: ProjectPlanVoteSummary;
  isLeading: boolean;
}

export interface ProjectDistributionPlan {
  id: string;
  title: string;
  authorUsername: string;
  createdAt: string;
  description: string;
  totalCostLabel: string;
  planPhases: ProjectPlanPhaseItem[];
  distributionSummary: string;
  accessSummary: string;
  reserveSummary: string;
  requestSystemEnabled: boolean;
  valueAssessments: ProjectPlanValueAssessment[];
  overallApproval: ProjectPlanVoteSummary;
  isLeading: boolean;
}

export interface ProjectActivityInput {
  title: string;
  scheduledAt: string;
  endsAt: string;
  locationLabel: string;
  roleRequirements: ProjectActivityRoleInput[];
  maximumParticipants: number;
  linkedPlanPhaseId?: string | null;
  note: string;
}

export interface ProjectActivityRole {
  label: string;
  filledCount: number;
  requiredCount: number;
  isViewerAssigned: boolean;
  isExtraSlot: boolean;
}

export interface ProjectActivityItem {
  id: string;
  title: string;
  authorUsername: string;
  scheduledAt: string;
  startAt: string;
  endAt: string;
  locationLabel: string;
  minimumParticipants: number;
  maximumParticipants: number;
  committedCount: number;
  viewerAssignedRoleLabel: string | null;
  linkedPlanPhaseLabel: string | null;
  statusTone: 'red' | 'yellow' | 'green';
  roles: ProjectActivityRole[];
  note: string;
  isActive: boolean;
}

export interface ProjectActivityPlanPhaseOption {
  id: string;
  label: string;
}

export interface ProjectServiceRequestItem {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  status: ProjectServiceRequestStatus;
}

export interface ProjectLifecycleRevertEntry {
  id: string;
  targetPhaseId: Extract<ProjectLifecyclePhaseId, 'phase-2' | 'phase-3'>;
  reason: string;
  authorUsername: string;
  createdAt: string;
}

export interface ProjectPhaseOneData {
  values: ProjectValueItem[];
  viewerCanSignalDemand: boolean;
  viewerHasDemandSignal: boolean;
  viewerCanAddValue: boolean;
  viewerCanVoteOnValues: boolean;
  availabilitySummary?: string;
  travelRadiusLabel?: string;
}

export interface ProjectPhaseTwoData {
  plans: ProjectProductionPlan[];
  winningPlanId: string | null;
  viewerCanSubmitPlans: boolean;
  viewerCanVoteOnPlans: boolean;
}

export interface ProjectPhaseThreeData {
  plans: ProjectDistributionPlan[];
  winningPlanId: string | null;
  viewerCanSubmitPlans: boolean;
  viewerCanVoteOnPlans: boolean;
  requestSystemEnabled: boolean;
}

export interface ProjectPhaseFiveData {
  activities: ProjectActivityItem[];
  viewerCanCreateActivities: boolean;
  selectablePlanPhases: ProjectActivityPlanPhaseOption[];
}

export interface ProjectServiceRequestState {
  enabled: boolean;
  requestCount: number;
  requests: ProjectServiceRequestItem[];
  viewerCanSubmitRequests: boolean;
  viewerCanReviewRequests: boolean;
}

export interface PersonalServiceLifecycleData {
  availabilitySummary: string;
  travelRadiusLabel?: string;
}

export interface ProjectLifecyclePhase {
  id: ProjectLifecyclePhaseId;
  order: number;
  shortLabel: string;
  title: string;
  summary: string;
  progressState: ProjectLifecycleProgressState;
  betaLocked?: boolean;
  projectStatus: string;
  mechanics: string[];
  note?: string;
}

export interface ProjectLifecycleNote {
  title: string;
  body: string;
}

export interface ProjectLifecycleData {
  projectMode: ProjectMode;
  supportsDemandSignals: boolean;
  supportsPlanning: boolean;
  currentPhaseId: ProjectLifecyclePhaseId;
  quorumThresholdPercent: number;
  notes: ProjectLifecycleNote[];
  phases: ProjectLifecyclePhase[];
  viewerCanAdvancePhase: boolean;
  nextPhaseId: ProjectLifecyclePhaseId | null;
  nextPhaseLabel: string | null;
  viewerCanRevertPhase: boolean;
  revertablePhaseIds: Array<Extract<ProjectLifecyclePhaseId, 'phase-2' | 'phase-3'>>;
  revertHistory: ProjectLifecycleRevertEntry[];
  requestSystem: ProjectServiceRequestState | null;
  personalService: PersonalServiceLifecycleData | null;
  phaseOne: ProjectPhaseOneData;
  phaseTwo: ProjectPhaseTwoData;
  phaseThree: ProjectPhaseThreeData;
  phaseFive: ProjectPhaseFiveData;
}

export interface ProjectPageData {
  id: string;
  slug: string;
  createdAt: string;
  title: string;
  authorUsername: string;
  projectMode: ProjectMode;
  summary: string;
  channelTags: TagRef[];
  communityTags: TagRef[];
  stage: string;
  locationLabel: string;
  voteCount: number;
  activeVote: VoteDirection;
  signalCount: number;
  commentCount: number;
  memberCount: number;
  lastActivityAt: string;
  overview: string;
  lifecycle: ProjectLifecycleData;
  updates: DetailUpdate[];
  projectManagers: ProjectRoleMember[];
  members: ProjectRoleMember[];
  viewerIsMember: boolean;
  viewerCanToggleMembership: boolean;
  viewerCanToggleManagerNomination: boolean;
  viewerIsManagerCandidate: boolean;
  viewerIsProjectManager: boolean;
  discussionNote: string;
  discussion: DetailComment[];
}

export interface ThreadPageData {
  id: string;
  slug: string;
  title: string;
  body: string;
  authorUsername: string;
  channelTags: TagRef[];
  communityTags: TagRef[];
  voteCount: number;
  activeVote: VoteDirection;
  commentCount: number;
  lastActivityAt: string;
  discussionNote: string;
  discussion: DetailComment[];
}

export interface PostPageData {
  id: string;
  authorUsername: string;
  body: string;
  audience: 'followers' | 'public';
  voteCount: number;
  activeVote: VoteDirection;
  commentCount: number;
  createdAt: string;
  discussionNote: string;
  discussion: DetailComment[];
}

export interface EventPageData {
  id: string;
  slug: string;
  createdAt: string;
  title: string;
  description: string;
  isPrivate: boolean;
  scheduledAt?: string;
  channelTags: TagRef[];
  communityTags: TagRef[];
  createdByUsername: string;
  timeLabel: string;
  locationLabel: string;
  voteCount: number;
  activeVote: VoteDirection;
  commentCount: number;
  goingCount: number;
  memberCount: number;
  lastActivityAt: string;
  attendanceNote: string;
  agenda: string[];
  updates: DetailUpdate[];
  attendees: string[];
  invitedUsernames: string[];
  eventManagers: EventRoleMember[];
  members: EventRoleMember[];
  viewerIsGoing: boolean;
  viewerCanToggleGoing: boolean;
  viewerCanToggleManagerNomination: boolean;
  viewerIsManagerCandidate: boolean;
  viewerIsEventManager: boolean;
  viewerCanInviteEventManagers: boolean;
  availableManagerInvitees: DetailMember[];
  discussionNote: string;
  discussion: DetailComment[];
}