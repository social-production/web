import type { BootstrapPayload } from '$lib/types/bootstrap';
import type {
  OnboardingPageData,
  ProfilePageData,
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
  ProjectServiceRequestStatus,
  ThreadPageData
} from '$lib/types/detail';
import type { MessagesPageData, NotificationsPageData } from '$lib/types/inbox';
import type { PersonalFeedItem, PublicFeedItem, VoteDirection } from '$lib/types/feed';
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
  getSettings(): Promise<SettingsPageData | null>;
  updateSettings(input: SettingsUpdateInput): Promise<void>;
  getProfile(username: string): Promise<ProfilePageData | null>;
  getNotifications(): Promise<NotificationsPageData | null>;
  getMessages(): Promise<MessagesPageData | null>;
  getSearch(query: string): Promise<SearchPageData>;
  getProject(slug: string): Promise<ProjectPageData | null>;
  getThread(slug: string): Promise<ThreadPageData | null>;
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
  addProjectServiceRequest(projectSlug: string, title: string, body: string): Promise<void>;
  setProjectServiceRequestStatus(
    projectSlug: string,
    requestId: string,
    status: ProjectServiceRequestStatus
  ): Promise<void>;
  advanceProjectPhase(projectSlug: string): Promise<void>;
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
  markNotificationRead(notificationId: string): Promise<void>;
  markAllNotificationsRead(): Promise<void>;
  markMessageThreadRead(threadId: string): Promise<void>;
  sendMessage(threadId: string, body: string): Promise<void>;
  startMessageThread(participantUsername: string, body: string): Promise<string | null>;
}