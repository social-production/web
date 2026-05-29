import type { PostBodyLink, ProjectMode, ProjectSubtype, PublicProjectItem, TagRef, VoteDirection } from '$lib/types/feed';

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

export type ContentReportReason = 'spam' | 'serious-harm';
export type ContentReportVote = 'yes' | 'no';

export interface ContentReportVoteSummary {
  yesCount: number;
  noCount: number;
  activeVote: ContentReportVote | null;
  eligibleVoterCount: number;
  votesRequired: number;
}

export interface ContentReportSummary {
  id: string;
  subjectId: string;
  targetId: string;
  reason: ContentReportReason;
  description: string;
  createdAt: string;
  authorUsername: string;
  resolution: 'open' | 'hidden' | 'removed';
  voteSummary: ContentReportVoteSummary;
}

export interface RoleMember extends DetailMember {
  confidenceTargetId?: string;
  confidenceVoteCount?: number;
  confidenceActiveVote?: VoteDirection;
  confidenceUpVotes?: number;
  confidenceDownVotes?: number;
  confidenceRatio?: number;
  confidenceReviewCount?: number;
}

export type ProjectRoleMember = RoleMember;
export type EventRoleMember = RoleMember;

export type GovernanceSignalType = 'demand' | 'opposition';

export interface GovernanceSignalSummary {
  demandCount: number;
  oppositionCount: number;
  totalCount: number;
  viewerSignal: GovernanceSignalType | null;
  signalRatioPercent: number;
  ratioRequirementMet: boolean;
  requiredDemandCount: number;
  demandRequirementMet: boolean;
  advancementUnlocked: boolean;
  usesPlatformVoteContext: boolean;
  voteContextLabel: string;
  voteContextPopulation: number;
}

export interface DetailComment {
  id: string;
  authorUsername: string;
  body: string;
  createdAt: string;
  voteCount: number;
  activeVote: VoteDirection;
  report?: ContentReportSummary | null;
  replies: DetailComment[];
}

export type ProjectLifecyclePhaseId =
  | 'phase-1'
  | 'phase-2'
  | 'phase-3'
  | 'phase-4'
  | 'phase-5'
  | 'phase-6'
  | 'phase-7';

export type EventLifecyclePhaseId = 'proposal' | 'event-plan' | 'activity' | 'closed';
export type GovernancePhaseId = ProjectLifecyclePhaseId | EventLifecyclePhaseId;

export type ProjectLifecycleProgressState = 'complete' | 'current' | 'upcoming' | 'locked';

export type ProjectImportanceVoteValue = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
export type ProjectApprovalVote = 'yes' | 'no';
export type ProjectServiceRequestStatus = 'open' | 'planned' | 'accepted' | 'declined';
export type ProjectServiceRequestMode = 'calendar' | 'direct' | 'both';
export type ProjectServiceHistorySource = 'request' | 'self-planned';
export type ProjectServiceHistoryCompletionRole = 'requester' | 'participants';
export type ProjectServiceHistoryCompletionChoice = 'completed' | 'uncompleted';
export type ProjectServiceHistoryState =
  | 'unanswered-request'
  | 'request-only'
  | 'planned-activity'
  | 'committed-activity'
  | 'self-planned';
export type ProjectServiceHistoryAggregateState = 'completed' | 'uncompleted' | 'mixed';

export interface ShareTargetResult {
  ok: boolean;
  error?: string;
}

export interface ProjectPlanPhaseInput {
  title: string;
  details: string;
  materialsLabel: string;
  costLabel: string;
}

export interface ProjectPlanPhaseItem extends ProjectPlanPhaseInput {
  id: string;
}

export interface EventPlanPhaseInput {
  title: string;
  details: string;
}

export interface EventPlanPhaseItem extends EventPlanPhaseInput {
  id: string;
}

export type EventPlanScheduleMode = 'any-day' | 'date' | 'range';

export interface EventPlanScheduleInput {
  mode: EventPlanScheduleMode;
  startDate?: string | null;
  endDate?: string | null;
  startTimeLabel?: string | null;
  finishTimeLabel?: string | null;
}

export interface EventPlanSchedule extends EventPlanScheduleInput {
  startDate: string | null;
  endDate: string | null;
  startTimeLabel: string | null;
  finishTimeLabel: string | null;
  label: string;
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
  eligibleVoterCount: number;
  quorumThresholdPercent: number;
  votesRequired: number;
  votesRemaining: number;
  remainingEligibleVotes: number;
}

export interface ProjectPlanValueAssessment extends ProjectPlanVoteSummary {
  valueId: string;
  valueLabel: string;
}

export interface ProjectProductionPlanInput {
  title: string;
  description: string;
  projectSubtype: ProjectSubtype;
  repositoryUrl?: string;
  demandConsiderationNote: string;
  totalCostLabel: string;
  planPhases: ProjectPlanPhaseInput[];
  outputSummary?: string;
  materialsSummary?: string;
  acquisitionsSummary?: string;
  acquisitionBundles?: ProjectAcquisitionPlanBundleInput[];
  purchaseRows?: ProjectAcquisitionPurchaseRowInput[];
}

export type ProjectAcquisitionServiceDestinationType = 'existing-service' | 'new-service';

export interface ProjectAcquisitionPlanBundleInput {
  id?: string;
  title: string;
  destinationType: ProjectAcquisitionServiceDestinationType;
  existingServiceProjectSlug?: string;
  newServiceTitle?: string;
  note?: string;
}

export interface ProjectAcquisitionPurchaseRowInput {
  id?: string;
  title: string;
  costLabel: string;
  purchaseHref: string;
  destinationBundleId: string;
  note?: string;
}

export interface ProjectAcquisitionExecutionInput {
  proofLabel: string;
  note?: string;
}

export interface ProjectDistributionPlanInput {
  title: string;
  description: string;
  demandConsiderationNote: string;
  totalCostLabel: string;
  planPhases: ProjectPlanPhaseInput[];
  distributionSummary?: string;
  accessSummary?: string;
  reserveSummary?: string;
  requestSystemEnabled?: boolean;
  requestMode?: ProjectServiceRequestMode;
  allowOffScheduleRequests?: boolean;
}

export interface EventPlanInput {
  title: string;
  description: string;
  demandConsiderationNote: string;
  locationLabel: string;
  schedule?: EventPlanScheduleInput;
  planPhases: EventPlanPhaseInput[];
}

export interface ProjectActivityRoleInput {
  label: string;
  requiredCount: number;
  maximumCount?: number;
}

export interface ProjectProductionPlan {
  id: string;
  title: string;
  authorUsername: string;
  createdAt: string;
  description: string;
  projectSubtype: ProjectSubtype;
  projectSubtypeLabel: string;
  repositoryUrl?: string | null;
  demandSignalSnapshot: number | null;
  demandConsiderationNote: string;
  planPhases: ProjectPlanPhaseItem[];
  outputSummary: string;
  materialsSummary: string;
  totalCostLabel: string;
  acquisitionsSummary: string;
  acquisitionBundles: ProjectAcquisitionPlanBundle[];
  purchaseRows: ProjectAcquisitionPurchaseRow[];
  valueAssessments: ProjectPlanValueAssessment[];
  overallApproval: ProjectPlanVoteSummary;
  isLeading: boolean;
  viewerCanEdit: boolean;
}

export interface ProjectAcquisitionPlanBundle {
  id: string;
  title: string;
  destinationType: ProjectAcquisitionServiceDestinationType;
  destinationLabel: string;
  existingServiceProjectSlug?: string | null;
  newServiceTitle?: string | null;
  note: string;
}

export interface ProjectAcquisitionPurchaseRow {
  id: string;
  title: string;
  costLabel: string;
  purchaseHref: string;
  destinationBundleId: string;
  destinationLabel: string;
  note: string;
}

export interface ProjectDistributionPlan {
  id: string;
  title: string;
  authorUsername: string;
  createdAt: string;
  description: string;
  repositoryUrl?: string | null;
  demandSignalSnapshot: number | null;
  demandConsiderationNote: string;
  totalCostLabel: string;
  planPhases: ProjectPlanPhaseItem[];
  distributionSummary: string;
  accessSummary: string;
  reserveSummary: string;
  requestSystemEnabled: boolean;
  requestMode?: ProjectServiceRequestMode;
  allowOffScheduleRequests?: boolean;
  valueAssessments: ProjectPlanValueAssessment[];
  overallApproval: ProjectPlanVoteSummary;
  isLeading: boolean;
}

export interface EventPlan {
  id: string;
  title: string;
  authorUsername: string;
  createdAt: string;
  description: string;
  demandSignalSnapshot: number | null;
  demandConsiderationNote: string;
  locationLabel: string;
  schedule: EventPlanSchedule;
  planPhases: EventPlanPhaseItem[];
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
  linkedPlanPhaseId?: string | null;
  note: string;
}

export interface ProjectActivityRole {
  label: string;
  filledCount: number;
  requiredCount: number;
  maximumCount?: number;
  isViewerAssigned: boolean;
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
  maximumParticipants?: number;
  committedCount: number;
  viewerAssignedRoleLabel: string | null;
  linkedPlanPhaseLabel: string | null;
  statusTone: 'red' | 'yellow' | 'green';
  roles: ProjectActivityRole[];
  note: string;
  isActive: boolean;
}

export interface ProjectSoftwareMergeCapabilityMember extends DetailMember {
  sourceLabel: string;
}

export interface ProjectSoftwareMergeCapabilityChangeInput {
  targetUserId: string;
  action: 'grant' | 'revoke';
}

export interface ProjectSoftwareMergeCapabilityChangeRequest {
  id: string;
  decisionId: string;
  action: 'grant' | 'revoke';
  actionLabel: string;
  targetMember: DetailMember;
  authorUsername: string;
  createdAt: string;
  approvalThresholdPercent: number;
  voteSummary: ProjectPlanVoteSummary | null;
  passesApprovalThreshold: boolean;
  canStillPass: boolean;
}

export interface ProjectSoftwareRepositoryReplacementInput {
  repositoryUrl: string;
  reason: string;
  relatedPullRequestId: string;
}

export interface ProjectSoftwareRepositoryReplacementRequest {
  id: string;
  decisionId: string;
  repositoryUrl: string;
  previousRepositoryUrl: string;
  reason: string;
  relatedPullRequestId: string;
  authorUsername: string;
  createdAt: string;
  approvalThresholdPercent: number;
  voteSummary: ProjectPlanVoteSummary | null;
  passesApprovalThreshold: boolean;
  canStillPass: boolean;
}

export interface ProjectSoftwareBlockedPullRequest {
  id: string;
  title: string;
  pullRequestId: string;
  stage: 'awaiting-merge' | 'rejected';
  stageLabel: string;
}

export interface ProjectSoftwareRepositoryRecord {
  id: string;
  repositoryUrl: string;
  previousRepositoryUrl: string;
  reason: string;
  relatedPullRequestId: string;
  replacedAt: string;
  replacedByUsername: string;
}

export interface ProjectSoftwarePullRequestInput {
  title: string;
  summary: string;
  pullRequestId: string;
  pullRequestUrl: string;
}

export interface ProjectSoftwarePullRequest {
  id: string;
  decisionId: string | null;
  title: string;
  summary: string;
  pullRequestId: string;
  pullRequestUrl: string;
  authorUsername: string;
  createdAt: string;
  stage: 'approval' | 'awaiting-merge' | 'confirmation' | 'confirmed' | 'rejected' | 'replaced';
  stageLabel: string;
  mergeId: string | null;
  mergedByUsername: string | null;
  approvalThresholdPercent: number;
  voteSummary: ProjectPlanVoteSummary | null;
  passesApprovalThreshold: boolean;
  canStillPass: boolean;
  viewerCanRecordMerge: boolean;
}

export interface ProjectSoftwareGovernanceData {
  repositoryUrl: string;
  licenseLabel: string;
  mergeCapabilityMembers: ProjectSoftwareMergeCapabilityMember[];
  availableMergeCapabilityCandidates: DetailMember[];
  mergeCapabilityChangeRequests: ProjectSoftwareMergeCapabilityChangeRequest[];
  repositoryReplacementRequests: ProjectSoftwareRepositoryReplacementRequest[];
  replaceablePullRequests: ProjectSoftwareBlockedPullRequest[];
  repositoryHistory: ProjectSoftwareRepositoryRecord[];
  pullRequests: ProjectSoftwarePullRequest[];
  viewerCanCreatePullRequests: boolean;
  viewerCanRequestMergeCapabilityChanges: boolean;
  viewerCanRequestRepositoryReplacement: boolean;
}

export interface ProjectServiceHistoryCompletionState {
  label: string;
  totalEligible: number;
  completedCount: number;
  uncompletedCount: number;
  pendingCount: number;
  viewerCanSet: boolean;
  viewerSelection: ProjectServiceHistoryCompletionChoice | null;
  doneCount: number;
  viewerCanToggle: boolean;
  viewerHasMarkedDone: boolean;
}

export interface ProjectServiceHistoryItem {
  id: string;
  source: ProjectServiceHistorySource;
  requestId: string | null;
  requesterUsername: string | null;
  activity: ProjectActivityItem;
  historyState: ProjectServiceHistoryState;
  historyStateLabel: string;
  historyStateDescription: string;
  aggregateCompletionState: ProjectServiceHistoryAggregateState;
  aggregateCompletionLabel: string;
  aggregateCompletionTone: 'complete' | 'mixed' | 'uncompleted';
  requesterCompletion: ProjectServiceHistoryCompletionState | null;
  participantCompletion: ProjectServiceHistoryCompletionState;
}

export interface ProjectActivityPlanPhaseOption {
  id: string;
  label: string;
}

export interface ProjectServiceRequestInput {
  title: string;
  body: string;
  scheduledAt?: string;
  endsAt?: string;
}

export interface ProjectServiceRequestPlanInput {
  title: string;
  locationLabel: string;
  roleRequirements: ProjectActivityRoleInput[];
  linkedPlanPhaseId?: string | null;
  note: string;
}

export interface ProjectServiceRequestSettings {
  enabled: boolean;
  requestMode: ProjectServiceRequestMode;
  allowOffScheduleRequests: boolean;
  summary: string;
}

export interface ProjectServiceRequestSettingsChangeInput {
  reason: string;
  enabled: boolean;
  requestMode: ProjectServiceRequestMode;
  allowOffScheduleRequests: boolean;
}

export interface ProjectServiceRequestItem {
  id: string;
  title: string;
  body: string;
  requesterUsername: string;
  createdAt: string;
  status: ProjectServiceRequestStatus;
  scheduledAt?: string;
  endsAt?: string;
  linkedActivityId?: string | null;
}

export interface ProjectServiceRequestSettingsChangeRequest {
  id: string;
  reason: string;
  authorUsername: string;
  createdAt: string;
  proposedSettings: ProjectServiceRequestSettings;
  approvalThresholdPercent: number;
  voteSummary: ProjectPlanVoteSummary;
  passesApprovalThreshold: boolean;
  canStillPass: boolean;
}

export interface ProjectLifecycleRevertEntry {
  id: string;
  targetPhaseId: Extract<ProjectLifecyclePhaseId, 'phase-1' | 'phase-2' | 'phase-3'>;
  reason: string;
  authorUsername: string;
  createdAt: string;
}

export interface ProjectConversionTargetInput {
  projectMode: ProjectMode;
  projectSubtype: ProjectSubtype;
}

export interface ProjectConversionTarget extends ProjectConversionTargetInput {
  projectModeLabel: string;
  projectSubtypeLabel: string;
  entryPhaseId: ProjectLifecyclePhaseId;
  entryPhaseLabel: string;
}

export interface ProjectPhaseChangeRequestOptions {
  closeOutcome?: 'close' | 'convert';
  conversionTarget?: ProjectConversionTargetInput | null;
}

export interface ProjectLifecyclePhaseChangeRequest {
  id: string;
  targetPhaseId: ProjectLifecyclePhaseId;
  targetPhaseLabel: string;
  reason: string;
  authorUsername: string;
  createdAt: string;
  kind: 'advance' | 'return' | 'close';
  closeOutcome?: 'close' | 'convert';
  conversionTarget?: ProjectConversionTarget | null;
  approvalThresholdPercent: number;
  voteSummary: ProjectPlanVoteSummary;
  passesApprovalThreshold: boolean;
  canStillPass: boolean;
}

export interface ProjectUpdateRequest {
  id: string;
  body: string;
  authorUsername: string;
  createdAt: string;
  approvalThresholdPercent: number;
  voteSummary: ProjectPlanVoteSummary;
  passesApprovalThreshold: boolean;
  canStillPass: boolean;
}

export interface ProjectEditRequest {
  id: string;
  title: string;
  description: string;
  authorUsername: string;
  createdAt: string;
  approvalThresholdPercent: number;
  voteSummary: ProjectPlanVoteSummary;
  passesApprovalThreshold: boolean;
  canStillPass: boolean;
}

export interface EventUpdateRequest {
  id: string;
  body: string;
  authorUsername: string;
  createdAt: string;
  approvalThresholdPercent: number;
  voteSummary: ProjectPlanVoteSummary;
  passesApprovalThreshold: boolean;
  canStillPass: boolean;
}

export interface EventEditRequest {
  id: string;
  title: string;
  description: string;
  authorUsername: string;
  createdAt: string;
  approvalThresholdPercent: number;
  voteSummary: ProjectPlanVoteSummary;
  passesApprovalThreshold: boolean;
  canStillPass: boolean;
}

export interface EventLifecyclePhaseChangeRequest {
  id: string;
  targetPhaseId: EventLifecyclePhaseId;
  targetPhaseLabel: string;
  reason: string;
  authorUsername: string;
  createdAt: string;
  kind: 'advance' | 'return' | 'close';
  approvalThresholdPercent: number;
  voteSummary: ProjectPlanVoteSummary;
  passesApprovalThreshold: boolean;
  canStillPass: boolean;
}

export interface EventLifecyclePhase {
  id: EventLifecyclePhaseId;
  order: number;
  shortLabel: string;
  title: string;
  summary: string;
  progressState: ProjectLifecycleProgressState;
  betaLocked?: boolean;
  eventStatus: string;
  mechanics: string[];
  note?: string;
}

export interface EventPhaseOneData {
  values: ProjectValueItem[];
  viewerCanSignalDemand: boolean;
  viewerHasDemandSignal: boolean;
  viewerCanSignalOpposition: boolean;
  viewerHasOppositionSignal: boolean;
  signalSummary: GovernanceSignalSummary | null;
  viewerCanAddValue: boolean;
  viewerCanVoteOnValues: boolean;
}

export interface EventPhaseTwoData {
  plans: EventPlan[];
  winningPlanId: string | null;
  viewerCanSubmitPlans: boolean;
  viewerCanVoteOnPlans: boolean;
}

export interface EventPhaseActivityData {
  activities: ProjectActivityItem[];
  viewerCanCreateActivities: boolean;
  selectablePlanPhases: ProjectActivityPlanPhaseOption[];
}

export interface EventLifecycleData {
  currentPhaseId: EventLifecyclePhaseId;
  quorumThresholdPercent: number;
  quorumVotesRequired: number;
  voteContextLabel: string;
  voteContextPopulation: number;
  phases: EventLifecyclePhase[];
  phaseOne: EventPhaseOneData;
  phaseTwo: EventPhaseTwoData;
  activity: EventPhaseActivityData;
  viewerCanRequestPhaseChanges: boolean;
  viewerCanVoteOnPhaseChanges: boolean;
  phaseChangeRequests: EventLifecyclePhaseChangeRequest[];
  revertablePhaseIds: EventLifecyclePhaseId[];
  previousPhaseId: EventLifecyclePhaseId | null;
  previousPhaseLabel: string | null;
  nextPhaseId: EventLifecyclePhaseId | null;
  nextPhaseLabel: string | null;
}

export interface ProjectPlaceholderSection {
  id: string;
  title: string;
  body: string;
  statusLabel?: string;
}

export interface ProjectRequestFrame {
  id: 'borrowing' | 'delivery' | 'asset-use';
  title: string;
  body: string;
  statusLabel?: string;
}

export interface ProjectAcquisitionPreviewFund {
  title: string;
  progressPercent: number;
  raisedLabel: string;
  targetLabel: string;
  statusLabel: string;
  note: string;
}

export interface ProjectAcquisitionPreviewItem {
  id: string;
  title: string;
  sourceLabel: string;
  costLabel: string;
  statusLabel: string;
  note: string;
  href?: string | null;
  purchaseHref?: string | null;
  destinationBundleId?: string | null;
  destinationLabel?: string | null;
}

export interface ProjectAcquisitionBundle {
  id: string;
  title: string;
  destinationType: 'existing-service' | 'new-service';
  destinationLabel: string;
  statusLabel: string;
  note: string;
}

export interface ProjectAcquisitionExecutionFrame {
  statusLabel: string;
  boardActionLabel: string;
  proofLabel: string;
  note: string;
  recordedByUsername: string;
  recordedAt: string;
}

export interface ProjectAcquisitionConfirmationFrame {
  statusLabel: string;
  note: string;
  voteSummary: ProjectPlanVoteSummary;
  viewerCanVote: boolean;
}

export interface ProjectAcquisitionPendingAsset {
  id: string;
  title: string;
  statusLabel: string;
  destinationLabel: string;
  note: string;
}

export interface ProjectPhaseFourData {
  intro: string;
  previewNote: string;
  phaseLabel: string;
  fund: ProjectAcquisitionPreviewFund | null;
  existingAssets: ProjectAcquisitionPreviewItem[];
  purchaseTargets: ProjectAcquisitionPreviewItem[];
  bundles: ProjectAcquisitionBundle[];
  execution: ProjectAcquisitionExecutionFrame | null;
  confirmation: ProjectAcquisitionConfirmationFrame | null;
  pendingAssets: ProjectAcquisitionPendingAsset[];
  viewerCanRecordExecution: boolean;
  placeholderSections: ProjectPlaceholderSection[];
}

export interface ProjectLinksFrameItem {
  id: string;
  title: string;
  relationshipLabel: string;
  summary: string;
  href?: string | null;
  publicItem?: PublicProjectItem | null;
}

export interface ProjectConversionLineageFrame {
  title: string;
  statusLabel: string;
  summary: string;
  permanenceNote: string;
  inventoryNote: string;
  predecessor: ProjectLinksFrameItem | null;
  successor: ProjectLinksFrameItem | null;
}

export interface ProjectConversionWorkflowItem {
  id: string;
  title: string;
  statusLabel: string;
  requestedByUsername: string;
  createdAtLabel: string;
  outcomeLabel: string;
  summary: string;
  inventoryNote: string;
  canVote: boolean;
  voteSummary: ProjectPlanVoteSummary;
  approvalThresholdPercent: number;
  target: ProjectConversionTarget;
  predecessor: ProjectLinksFrameItem | null;
  successor: ProjectLinksFrameItem | null;
}

export interface ProjectManualLinkVoteState {
  projectTitle: string;
  yesCount: number;
  noCount: number;
  memberCount: number;
  approvalsRequired: number;
  approvalsRemaining: number;
  approvalPercent: number;
  statusLabel: string;
  resultNote: string;
  viewerCanVote?: boolean;
  viewerVote?: ProjectApprovalVote | null;
}

export interface ProjectManualLinkRequest {
  id: string;
  title: string;
  relationshipLabel: string;
  summary: string;
  statusLabel: string;
  proposedByUsername: string;
  createdAtLabel: string;
  targetProjectHref?: string | null;
  thisProjectVote: ProjectManualLinkVoteState;
  otherProjectVote: ProjectManualLinkVoteState;
}

export interface ProjectLinkCandidate {
  slug: string;
  title: string;
  href: string;
}

export interface ProjectLinksFrameData {
  projectSlug: string;
  intro: string;
  autoLinks: ProjectLinksFrameItem[];
  manualLinks: ProjectLinksFrameItem[];
  manualLinkRequests: ProjectManualLinkRequest[];
  linkableProjects: ProjectLinkCandidate[];
  viewerCanProposeLinks: boolean;
  conversionNote: string;
  conversionWorkflow: ProjectConversionWorkflowItem[];
  conversionLineage: ProjectConversionLineageFrame | null;
  requestFrames: ProjectRequestFrame[];
  placeholderSections: ProjectPlaceholderSection[];
}

export interface ProjectInventoryAssetFrameItem {
  id: string;
  title: string;
  statusLabel: string;
  custodyLabel: string;
  summary: string;
  locationLabel?: string;
  quantity?: number;
  availableQuantity?: number;
  quantityLabel?: string;
  borrowingPolicyLabel?: string;
  availabilityLabel?: string;
  governanceNote?: string;
  historyLabel?: string;
  href?: string | null;
}

export interface ProjectInventoryAssetGroup {
  id: string;
  kind: 'land-asset' | 'asset';
  title: string;
  assets: ProjectInventoryAssetFrameItem[];
}

export interface ProjectInventoryFrameData {
  projectSlug: string;
  intro: string;
  statusLabel: string;
  assetGroups: ProjectInventoryAssetGroup[];
  canRequestAssets: boolean;
  requestFrames: ProjectRequestFrame[];
  acquisitionPreview: ProjectPhaseFourData | null;
  placeholderSections: ProjectPlaceholderSection[];
}

export type DecisionHistoryStatus = 'open' | 'approved' | 'rejected';
export type DecisionHistoryEntryKind =
  | 'project-phase-change'
  | 'project-update'
  | 'project-edit'
  | 'project-request-settings-change'
  | 'project-pull-request-approval'
  | 'project-pull-request-confirmation'
  | 'project-merge-capability-change'
  | 'project-repository-replacement'
  | 'event-phase-change'
  | 'event-update'
  | 'event-edit';

export interface DecisionHistoryFieldChange {
  label: string;
  before: string;
  after: string;
}

export interface DecisionHistoryPhaseChangePayload {
  type: 'phase-change';
  changeKind: 'advance' | 'return' | 'close';
  fromPhaseId: GovernancePhaseId;
  fromPhaseLabel: string;
  toPhaseId: GovernancePhaseId;
  toPhaseLabel: string;
  reason: string;
  closeOutcome?: 'close' | 'convert';
  conversionTarget?: ProjectConversionTarget | null;
}

export interface DecisionHistoryUpdatePayload {
  type: 'update';
  body: string;
  appliedUpdateId: string | null;
}

export interface DecisionHistoryEditPayload {
  type: 'edit';
  changes: DecisionHistoryFieldChange[];
}

export interface DecisionHistorySettingsChangePayload {
  type: 'settings-change';
  reason: string;
  previousSettings: ProjectServiceRequestSettings;
  proposedSettings: ProjectServiceRequestSettings;
}

export interface DecisionHistoryPullRequestPayload {
  type: 'pull-request';
  title: string;
  summary: string;
  pullRequestId: string;
  pullRequestUrl: string;
  mergeId: string | null;
  repositoryUrl: string | null;
}

export interface DecisionHistoryMergeCapabilityPayload {
  type: 'merge-capability';
  action: 'grant' | 'revoke';
  actionLabel: string;
  targetUsername: string;
}

export interface DecisionHistoryRepositoryReplacementPayload {
  type: 'repository-replacement';
  repositoryUrl: string;
  previousRepositoryUrl: string | null;
  reason: string;
  relatedPullRequestId: string | null;
}

export type DecisionHistoryPayload =
  | DecisionHistoryPhaseChangePayload
  | DecisionHistoryUpdatePayload
  | DecisionHistoryEditPayload
  | DecisionHistorySettingsChangePayload
  | DecisionHistoryPullRequestPayload
  | DecisionHistoryMergeCapabilityPayload
  | DecisionHistoryRepositoryReplacementPayload;

export interface DecisionHistoryEntry {
  id: string;
  entityKind: 'project' | 'event';
  kind: DecisionHistoryEntryKind;
  kindLabel: string;
  createdAt: string;
  authorUsername: string;
  status: DecisionHistoryStatus;
  approvalThresholdPercent: number;
  voteSummary: ProjectPlanVoteSummary;
  passesApprovalThreshold: boolean;
  canStillPass: boolean;
  canVote: boolean;
  payload: DecisionHistoryPayload;
}

export interface ProjectPhaseOneData {
  values: ProjectValueItem[];
  viewerCanSignalDemand: boolean;
  viewerHasDemandSignal: boolean;
  viewerCanSignalOpposition: boolean;
  viewerHasOppositionSignal: boolean;
  signalSummary: GovernanceSignalSummary | null;
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
  availableAssetManagementServices: ProjectLinkCandidate[];
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
  history: ProjectServiceHistoryItem[];
  viewerCanCreateActivities: boolean;
  selectablePlanPhases: ProjectActivityPlanPhaseOption[];
  softwareGovernance: ProjectSoftwareGovernanceData | null;
}

export interface ProjectServiceRequestState {
  enabled: boolean;
  requestCount: number;
  requests: ProjectServiceRequestItem[];
  viewerCanSubmitRequests: boolean;
  viewerCanReviewRequests: boolean;
  viewerCanRequestSettingsChanges: boolean;
  viewerCanVoteOnSettingsChanges: boolean;
  requiresSchedule: boolean;
  settings: ProjectServiceRequestSettings;
  settingsChangeRequests: ProjectServiceRequestSettingsChangeRequest[];
}

export interface PersonalServiceLifecycleData {
  availabilitySummary: string;
  travelRadiusLabel?: string;
  usesCalendar: boolean;
  requestMode?: 'calendar' | 'direct' | 'both';
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
  currentSubtype: ProjectSubtype | null;
  currentSubtypeLabel: string | null;
  usesPlatformLifecycle: boolean;
  supportsDemandSignals: boolean;
  supportsPlanning: boolean;
  currentPhaseId: ProjectLifecyclePhaseId;
  quorumThresholdPercent: number;
  quorumVotesRequired: number;
  voteContextLabel: string;
  voteContextPopulation: number;
  notes: ProjectLifecycleNote[];
  phases: ProjectLifecyclePhase[];
  viewerCanRequestPhaseChanges: boolean;
  viewerCanVoteOnPhaseChanges: boolean;
  phaseChangeRequests: ProjectLifecyclePhaseChangeRequest[];
  viewerCanAdvancePhase: boolean;
  nextPhaseId: ProjectLifecyclePhaseId | null;
  nextPhaseLabel: string | null;
  viewerCanRevertPhase: boolean;
  revertablePhaseIds: Array<Extract<ProjectLifecyclePhaseId, 'phase-1' | 'phase-2' | 'phase-3'>>;
  revertHistory: ProjectLifecycleRevertEntry[];
  requestSystem: ProjectServiceRequestState | null;
  personalService: PersonalServiceLifecycleData | null;
  phaseOne: ProjectPhaseOneData;
  phaseTwo: ProjectPhaseTwoData;
  phaseThree: ProjectPhaseThreeData;
  phaseFour: ProjectPhaseFourData | null;
  phaseFive: ProjectPhaseFiveData;
}

export interface ProjectPageData {
  id: string;
  slug: string;
  createdAt: string;
  title: string;
  authorUsername: string;
  projectMode: ProjectMode;
  projectSubtype?: ProjectSubtype | null;
  description: string;
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
  lifecycle: ProjectLifecycleData;
  updates: DetailUpdate[];
  updateRequests: ProjectUpdateRequest[];
  viewerCanRequestUpdate: boolean;
  viewerCanVoteOnUpdateRequests: boolean;
  editRequests: ProjectEditRequest[];
  viewerCanRequestEdit: boolean;
  viewerCanVoteOnEditRequests: boolean;
  linksFrame: ProjectLinksFrameData;
  inventoryFrame: ProjectInventoryFrameData | null;
  history: DecisionHistoryEntry[];
  members: ProjectRoleMember[];
  viewerIsMember: boolean;
  viewerCanToggleMembership: boolean;
  viewerCanShare: boolean;
  shareContacts: DetailMember[];
  report: ContentReportSummary | null;
  isRemovedByReport: boolean;
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
  report: ContentReportSummary | null;
  isRemovedByReport: boolean;
  discussionNote: string;
  discussion: DetailComment[];
}

export interface PostPageData {
  id: string;
  authorUsername: string;
  authorProfileImageUrl?: string | null;
  body: string;
  linkedSubjects?: PostBodyLink[];
  audience: 'followers' | 'public';
  voteCount: number;
  activeVote: VoteDirection;
  commentCount: number;
  createdAt: string;
  report: ContentReportSummary | null;
  isRemovedByReport: boolean;
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
  memberCount: number;
  lastActivityAt: string;
  signalSummary: GovernanceSignalSummary | null;
  lifecycle: EventLifecycleData;
  attendanceNote: string;
  agenda: string[];
  updates: DetailUpdate[];
  updateRequests: EventUpdateRequest[];
  viewerCanRequestUpdate: boolean;
  viewerCanVoteOnUpdateRequests: boolean;
  editRequests: EventEditRequest[];
  viewerCanRequestEdit: boolean;
  viewerCanVoteOnEditRequests: boolean;
  history: DecisionHistoryEntry[];
  attendees: string[];
  invitedUsernames: string[];
  eventEditors: EventRoleMember[];
  members: EventRoleMember[];
  viewerIsMember: boolean;
  viewerCanToggleMembership: boolean;
  viewerHasEventEditAccess: boolean;
  viewerCanManageEditors: boolean;
  viewerCanShare: boolean;
  availableEditorInvitees: DetailMember[];
  shareContacts: DetailMember[];
  report: ContentReportSummary | null;
  isRemovedByReport: boolean;
  discussionNote: string;
  discussion: DetailComment[];
}