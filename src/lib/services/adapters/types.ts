import type { BootstrapPayload } from '$lib/types/bootstrap';
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
  PostPageData,
  ProjectActivityInput,
  ProjectApprovalVote,
  ProjectDistributionPlanInput,
  ProjectImportanceVoteValue,
  ProjectLifecyclePhaseId,
  ProjectPageData,
  ProjectProductionPlanInput,
  ProjectServiceRequestInput,
  ShareTargetResult,
  ProjectServiceRequestStatus,
  ThreadPageData
} from '$lib/types/detail';
import type {
  CreateGroupMessageInput,
  MessageConversationResult,
  MessagesPageData,
  NotificationsPageData
} from '$lib/types/inbox';
import type {
  CreateChannelInput,
  CreateCommunityInput,
  CreateEventInput,
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
  getPersonalFeed(): Promise<PersonalFeedItem[]>;
  getChannel(slug: string): Promise<ScopePageData | null>;
  getCommunity(slug: string): Promise<ScopePageData | null>;
  getPlatform(): Promise<ScopePageData | null>;
  getOnboarding(): Promise<OnboardingPageData>;
  signIn(input: SignInInput): Promise<AuthResult>;
  signOut(): Promise<void>;
  signUp(input: SignUpInput): Promise<AuthResult>;
  getSettings(): Promise<SettingsPageData | null>;
  updateSettings(input: SettingsUpdateInput): Promise<void>;
  getProfile(username: string): Promise<ProfilePageData | null>;
  getNotifications(): Promise<NotificationsPageData | null>;
  getMessages(): Promise<MessagesPageData | null>;
  getSearch(query: string): Promise<SearchPageData>;
  getProject(slug: string): Promise<ProjectPageData | null>;
  getThread(slug: string): Promise<ThreadPageData | null>;
  createProject(input: CreateProjectInput): Promise<CreateResult>;
  createThread(input: CreateThreadInput): Promise<CreateResult>;
  createEvent(input: CreateEventInput): Promise<CreateResult>;
  createPost(input: CreatePostInput): Promise<CreateResult>;
  createChannel(input: CreateChannelInput): Promise<CreateResult>;
  createCommunity(input: CreateCommunityInput): Promise<CreateResult>;
  getPost(id: string): Promise<PostPageData | null>;
  getEvent(slug: string): Promise<EventPageData | null>;
  toggleEventGoing(eventId: string): Promise<void>;
  toggleProjectMembership(projectSlug: string): Promise<void>;
  toggleProjectDemandSignal(projectSlug: string): Promise<void>;
  addProjectValue(projectSlug: string, label: string): Promise<void>;
  setProjectValueImportance(
    projectSlug: string,
    valueId: string,
    importance: ProjectImportanceVoteValue
  ): Promise<void>;
  addProjectProductionPlan(projectSlug: string, input: ProjectProductionPlanInput): Promise<void>;
  addProjectDistributionPlan(projectSlug: string, input: ProjectDistributionPlanInput): Promise<void>;
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
  addProjectServiceRequest(projectSlug: string, input: ProjectServiceRequestInput): Promise<void>;
  setProjectServiceRequestStatus(
    projectSlug: string,
    requestId: string,
    status: ProjectServiceRequestStatus
  ): Promise<void>;
  advanceProjectPhase(projectSlug: string, closeNote?: string): Promise<void>;
  revertProjectPhase(
    projectSlug: string,
    targetPhaseId: Extract<ProjectLifecyclePhaseId, 'phase-2' | 'phase-3'>,
    reason: string
  ): Promise<void>;
  toggleProjectManagerNomination(projectSlug: string): Promise<void>;
  toggleEventManagerNomination(eventSlug: string): Promise<void>;
  inviteEventManager(eventSlug: string, userId: string): Promise<void>;
  toggleScopeMembership(kind: ScopeKind, slug: string): Promise<void>;
  redeemScopeInvite(kind: ScopeKind, slug: string, inviteValue: string): Promise<boolean>;
  setVote(targetId: string, vote: VoteDirection): Promise<void>;
  addComment(subjectId: string, body: string, parentId?: string): Promise<void>;
  addProjectUpdate(projectSlug: string, title: string, body: string): Promise<void>;
  addEventUpdate(eventSlug: string, title: string, body: string): Promise<void>;
  shareProjectWithUser(projectSlug: string, username: string): Promise<ShareTargetResult>;
  shareEventWithUser(eventSlug: string, username: string): Promise<ShareTargetResult>;
  markNotificationRead(notificationId: string): Promise<void>;
  markAllNotificationsRead(): Promise<void>;
  markConversationRead(conversationId: string): Promise<void>;
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