import type { BootstrapPayload, ScopeDirectoryItem, ViewerSummary } from '$lib/types/bootstrap';
import type {
  AuthResult,
  OnboardingPageData,
  ProfilePageData,
  SignInInput,
  SignUpInput,
  SettingsPageData,
  SettingsUpdateInput
} from '$lib/types/account';
import type {
  EventPageData,
  EventPlanInput,
  GovernanceSignalType,
  PostPageData,
  ContentReportVote,
  ProjectActivityInput,
  ProjectServiceHistoryCompletionChoice,
  ProjectServiceHistoryCompletionRole,
  ProjectApprovalVote,
  ProjectDistributionPlanInput,
  ProjectImportanceVoteValue,
  ProjectPhaseChangeRequestOptions,
  ProjectLifecyclePhaseId,
  ProjectPageData,
  ProjectProductionPlanInput,
  ProjectServiceRequestInput,
  ProjectServiceRequestPlanInput,
  ProjectServiceRequestSettingsChangeInput,
  ProjectSoftwareMergeCapabilityChangeInput,
  ProjectSoftwarePullRequestInput,
  ProjectSoftwareRepositoryReplacementInput,
  ShareTargetResult,
  ProjectServiceRequestStatus,
  ThreadPageData,
  HelpRequestPageData
} from '$lib/types/detail';
import type { PlatformAssetsPageData } from '$lib/types/assets';
import type {
  CreateGroupMessageInput,
  DirectMessage,
  MessageConversationResult,
  MessagesPageData,
  NotificationsPageData
} from '$lib/types/inbox';
import type {
  CreateChannelInput,
  CreateCommunityInput,
  CreateEventInput,
  CreateHelpRequestInput,
  CreatePostInput,
  CreateProjectInput,
  CreateResult,
  CreateThreadInput,
  PersonalFeedItem,
  PublicFeedItem,
  VoteDirection
} from '$lib/types/feed';
import type { SearchPageData } from '$lib/types/search';
import type { ScopeKind, ScopePageData } from '$lib/types/scope';

export interface AppAdapter {
  getBootstrap(): Promise<BootstrapPayload>;
  hydrateClientState?(): Promise<boolean>;
  getPublicFeed(): Promise<PublicFeedItem[]>;
  getHomeFeed(): Promise<PublicFeedItem[]>;
  getPersonalFeed(options?: { scope?: 'following' | 'popular'; sort?: 'popular' | 'recent' }): Promise<PersonalFeedItem[]>;
  getChannel(slug: string): Promise<ScopePageData | null>;
  getCommunity(slug: string): Promise<ScopePageData | null>;
  getPlatform(): Promise<ScopePageData | null>;
  getPlatformAssets(): Promise<PlatformAssetsPageData | null>;
  getOnboarding(): Promise<OnboardingPageData>;
  signIn(input: SignInInput): Promise<AuthResult>;
  signOut(): Promise<void>;
  signUp(input: SignUpInput): Promise<AuthResult>;
  getSettings(): Promise<SettingsPageData | null>;
  updateSettings(input: SettingsUpdateInput): Promise<void>;
  getProfile(username: string): Promise<ProfilePageData | null>;
  followUser(username: string): Promise<{ followStatus: string | null }>;
  unfollowUser(username: string): Promise<void>;
  acceptFollowRequest(username: string): Promise<void>;
  rejectFollowRequest(username: string): Promise<void>;
  getFollowRequests(): Promise<ViewerSummary[]>;
  submitFeedback(input: {
    category: 'bug' | 'idea';
    title: string;
    description: string;
    pageUrl?: string;
  }): Promise<{ issueNumber: number; issueUrl: string }>;
  getNotifications(): Promise<NotificationsPageData | null>;
  getMessages(): Promise<MessagesPageData | null>;
  getConversationMessages(
    conversationId: string,
    viewerId: string,
    participants: ViewerSummary[]
  ): Promise<DirectMessage[]>;
  getMessageContacts(query: string, limit?: number): Promise<ViewerSummary[]>;
  getSearch(query: string): Promise<SearchPageData>;
  getProject(slug: string): Promise<ProjectPageData | null>;
  getThread(slug: string): Promise<ThreadPageData | null>;
  createProject(input: CreateProjectInput): Promise<CreateResult>;
  createThread(input: CreateThreadInput): Promise<CreateResult>;
  createEvent(input: CreateEventInput): Promise<CreateResult>;
  createPost(input: CreatePostInput): Promise<CreateResult>;
  createChannel(input: CreateChannelInput): Promise<CreateResult>;
  createCommunity(input: CreateCommunityInput): Promise<CreateResult>;
  createHelpRequest(input: CreateHelpRequestInput): Promise<CreateResult>;
  getTaggableScopes(
    query: string,
    kind?: 'channel' | 'community',
    limit?: number
  ): Promise<{ channels: ScopeDirectoryItem[]; communities: ScopeDirectoryItem[] }>;
  getPost(id: string): Promise<PostPageData | null>;
  getHelpRequest(id: string): Promise<HelpRequestPageData | null>;
  commitHelpRequestRole(helpRequestId: string, roleId: string): Promise<{ ok: boolean; error?: string }>;
  uncommitHelpRequestRole(helpRequestId: string, roleId: string): Promise<{ ok: boolean; error?: string }>;
  getEvent(slug: string): Promise<EventPageData | null>;
  toggleEventMembership(eventSlug: string): Promise<void>;
  toggleProjectMembership(projectSlug: string): Promise<void>;
  toggleProjectDemandSignal(projectSlug: string): Promise<void>;
  setProjectSignal(projectSlug: string, signal: GovernanceSignalType): Promise<void>;
  addProjectValue(projectSlug: string, label: string): Promise<void>;
  setProjectValueImportance(
    projectSlug: string,
    valueId: string,
    importance: ProjectImportanceVoteValue
  ): Promise<void>;
  addProjectProductionPlan(
    projectSlug: string,
    input: ProjectProductionPlanInput,
    projectMode?: string
  ): Promise<{ ok: boolean; error?: string }>;
  updateProjectProductionPlan(
    projectSlug: string,
    planId: string,
    input: ProjectProductionPlanInput
  ): Promise<{ ok: boolean; error?: string }>;
  addProjectDistributionPlan(
    projectSlug: string,
    input: ProjectDistributionPlanInput,
    projectMode?: string
  ): Promise<{ ok: boolean; error?: string }>;
  addProjectPullRequest(projectSlug: string, input: ProjectSoftwarePullRequestInput): Promise<void>;
  requestProjectMergeCapabilityChange(
    projectSlug: string,
    input: ProjectSoftwareMergeCapabilityChangeInput
  ): Promise<void>;
  requestProjectRepositoryReplacement(
    projectSlug: string,
    input: ProjectSoftwareRepositoryReplacementInput
  ): Promise<void>;
  setProjectPlanValueVote(
    projectSlug: string,
    phaseId: Extract<ProjectLifecyclePhaseId, 'phase-2' | 'phase-3'>,
    planId: string,
    valueId: string,
    vote: ProjectApprovalVote | null
  ): Promise<void>;
  setProjectPlanOverallVote(
    projectSlug: string,
    phaseId: Extract<ProjectLifecyclePhaseId, 'phase-2' | 'phase-3'>,
    planId: string,
    vote: ProjectApprovalVote | null
  ): Promise<void>;
  addProjectActivity(projectSlug: string, input: ProjectActivityInput): Promise<void>;
  setProjectActivityCommitment(
    projectSlug: string,
    activityId: string,
    roleLabel: string | null
  ): Promise<void>;
  addProjectServiceRequest(
    projectSlug: string,
    input: ProjectServiceRequestInput
  ): Promise<{ conversationId?: string }>;
  createProjectManualLinkRequest(
    projectSlug: string,
    targetProjectSlug: string,
    relationshipLabel: string,
    summary: string
  ): Promise<void>;
  setProjectManualLinkVote(
    projectSlug: string,
    requestId: string,
    vote: ProjectApprovalVote | null
  ): Promise<void>;
  planProjectServiceRequest(
    projectSlug: string,
    requestId: string,
    input: ProjectServiceRequestPlanInput
  ): Promise<void>;
  setProjectServiceRequestStatus(
    projectSlug: string,
    requestId: string,
    status: ProjectServiceRequestStatus
  ): Promise<void>;
  requestProjectServiceRequestSettingsChange(
    projectSlug: string,
    input: ProjectServiceRequestSettingsChangeInput
  ): Promise<void>;
  setProjectServiceRequestSettingsChangeVote(
    projectSlug: string,
    requestId: string,
    vote: ProjectApprovalVote | null
  ): Promise<void>;
  toggleProjectServiceHistoryCompletion(
    projectSlug: string,
    historyId: string,
    role: ProjectServiceHistoryCompletionRole,
    selection?: ProjectServiceHistoryCompletionChoice
  ): Promise<void>;
  requestProjectPhaseChange(
    projectSlug: string,
    targetPhaseId: ProjectLifecyclePhaseId,
    reason: string,
    options?: ProjectPhaseChangeRequestOptions
  ): Promise<void>;
  setProjectPhaseChangeVote(
    projectSlug: string,
    requestId: string,
    vote: ProjectApprovalVote | null
  ): Promise<void>;
  requestProjectUpdate(projectSlug: string, body: string): Promise<void>;
  setProjectUpdateVote(
    projectSlug: string,
    requestId: string,
    vote: ProjectApprovalVote | null
  ): Promise<void>;
  updateProjectDetails(
    projectSlug: string,
    title: string,
    description: string
  ): Promise<void>;
  requestProjectEdit(
    projectSlug: string,
    title: string,
    description: string
  ): Promise<void>;
  setProjectEditVote(
    projectSlug: string,
    requestId: string,
    vote: ProjectApprovalVote | null
  ): Promise<void>;
  setProjectPullRequestVote(
    projectSlug: string,
    decisionId: string,
    vote: ProjectApprovalVote | null
  ): Promise<void>;
  setProjectMergeCapabilityChangeVote(
    projectSlug: string,
    decisionId: string,
    vote: ProjectApprovalVote | null
  ): Promise<void>;
  setProjectRepositoryReplacementVote(
    projectSlug: string,
    decisionId: string,
    vote: ProjectApprovalVote | null
  ): Promise<void>;
  recordProjectPullRequestMerge(
    projectSlug: string,
    requestId: string,
    mergeId: string
  ): Promise<void>;
  advanceProjectPhase(projectSlug: string, closeNote?: string): Promise<void>;
  revertProjectPhase(
    projectSlug: string,
    targetPhaseId: Extract<ProjectLifecyclePhaseId, 'phase-1' | 'phase-2' | 'phase-3'>,
    reason: string
  ): Promise<void>;
  toggleScopeMembership(kind: ScopeKind, slug: string): Promise<void>;
  redeemScopeInvite(
    kind: ScopeKind,
    slug: string,
    inviteValue: string
  ): Promise<import('$lib/api/drivers/fastapi/domains/scopes').ScopeInviteRedeemResult>;
  createScopeInvite(
    kind: 'channel' | 'community',
    slug: string
  ): Promise<import('$lib/api/drivers/fastapi/domains/scopes').ScopeInviteCreateResult>;
  inviteUserToCommunity(
    slug: string,
    username: string
  ): Promise<import('$lib/api/drivers/fastapi/domains/scopes').CommunityDirectInviteResult>;
  volunteerForBoard(): Promise<boolean>;
  removeVolunteer(): Promise<boolean>;
  castModeratorVote(targetUserId: string, vote: string): Promise<boolean>;
  setVote(targetId: string, vote: VoteDirection): Promise<void>;
  addComment(
    subjectId: string,
    body: string,
    parentId?: string,
    subjectType?: 'thread' | 'post' | 'event' | 'project' | 'help_request'
  ): Promise<void>;
  submitReport(subjectId: string, targetId: string, reason: string, details: string): Promise<void>;
  setReportVote(targetId: string, vote: ContentReportVote): Promise<void>;
  addProjectUpdate(projectSlug: string, title: string, body: string): Promise<void>;
  setEventSignal(eventSlug: string, signal: GovernanceSignalType): Promise<void>;
  addEventValue(eventSlug: string, label: string): Promise<void>;
  setEventValueImportance(
    eventSlug: string,
    valueId: string,
    importance: ProjectImportanceVoteValue
  ): Promise<void>;
  addEventPlan(eventSlug: string, input: EventPlanInput): Promise<boolean>;
  setEventPlanValueVote(
    eventSlug: string,
    planId: string,
    valueId: string,
    vote: ProjectApprovalVote | null
  ): Promise<void>;
  setEventPlanOverallVote(
    eventSlug: string,
    planId: string,
    vote: ProjectApprovalVote | null
  ): Promise<void>;
  addEventActivity(eventSlug: string, input: ProjectActivityInput): Promise<void>;
  setEventActivityCommitment(
    eventSlug: string,
    activityId: string,
    roleLabel: string | null
  ): Promise<void>;
  requestEventPhaseChange(
    eventSlug: string,
    targetPhaseId: import('$lib/types/detail').EventLifecyclePhaseId,
    reason: string
  ): Promise<void>;
  setEventPhaseChangeVote(
    eventSlug: string,
    requestId: string,
    vote: ProjectApprovalVote | null
  ): Promise<void>;
  requestEventUpdate(eventSlug: string, body: string): Promise<void>;
  setEventUpdateVote(
    eventSlug: string,
    requestId: string,
    vote: ProjectApprovalVote | null
  ): Promise<void>;
  requestEventEdit(eventSlug: string, title: string, description: string): Promise<void>;
  setEventEditVote(
    eventSlug: string,
    requestId: string,
    vote: ProjectApprovalVote | null
  ): Promise<void>;
  grantEventEditAccess(eventSlug: string, userId: string): Promise<void>;
  revokeEventEditAccess(eventSlug: string, userId: string): Promise<void>;
  shareProjectWithUser(projectSlug: string, username: string): Promise<ShareTargetResult>;
  shareEventWithUser(eventSlug: string, username: string): Promise<ShareTargetResult>;
  markNotificationRead(notificationId: string): Promise<void>;
  markAllNotificationsRead(): Promise<void>;
  markConversationRead(conversationId: string): Promise<void>;
  markLinkedChatRead(subjectType: string, subjectId: string): Promise<void>;
  sendMessage(conversationId: string, body: string): Promise<void>;
  startDirectMessage(participantUsername: string, body: string): Promise<MessageConversationResult>;
  createGroupConversation(input: CreateGroupMessageInput): Promise<MessageConversationResult>;
  renameGroupConversation(conversationId: string, title: string): Promise<MessageConversationResult>;
  addGroupConversationMember(
    conversationId: string,
    username: string
  ): Promise<MessageConversationResult>;
  removeGroupConversationMember(
    conversationId: string,
    username: string
  ): Promise<MessageConversationResult>;
}