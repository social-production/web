import { apiClient, extractErrorMessage } from '../client';
import { registerEntityType, registerCommentIds } from '../typeRegistry';
import type {
  EventPageData,
  EventPlanInput,
  ProjectActivityInput,
  ProjectApprovalVote,
  ProjectImportanceVoteValue,
  PlanCriterionRating,
  GovernanceSignalType,
  ShareTargetResult,
  EventLifecyclePhaseId,
  ProjectServiceHistoryCompletionChoice,
  ProjectServiceHistoryCompletionRole,
} from '$lib/types/detail';
import type { SignalToggleResult } from '$lib/types/feed';
import type { CreateEventInput, CreateResult } from '$lib/types/feed';

// Membership cache for toggle direction (populated from getEvent viewerIsMember)
const membershipCache = new Map<string, boolean>();

// -- Read -------------------------------------------------------------------

export async function fetchEvent(slug: string): Promise<EventPageData | null> {
  try {
    const res = await apiClient.get<EventPageData>(`/events/${slug}`);
    membershipCache.set(res.slug, res.viewerIsMember);
    registerEntityType(res.id, 'event');
    if (res.discussion) registerCommentIds(res.discussion);

    if (!res.lifecycle) {
      throw new Error('Event detail response is missing lifecycle data.');
    }

    res.lifecycle.phases = res.lifecycle.phases ?? [];
    res.lifecycle.phaseOne = res.lifecycle.phaseOne ?? {
      values: [],
      viewerCanSignalDemand: false,
      viewerCanSignalOpposition: false,
      viewerCanAddValue: false,
      viewerCanVoteOnValues: false,
      viewerHasDemandSignal: false,
      viewerHasOppositionSignal: false,
      signalSummary: {
        demandCount: 0,
        oppositionCount: 0,
        totalCount: 0,
        viewerSignal: null,
        signalRatioPercent: 0,
        ratioRequirementMet: false,
        requiredDemandCount: 0,
        demandRequirementMet: false,
        advancementUnlocked: false,
        usesPlatformVoteContext: false,
        voteContextLabel: '',
        voteContextPopulation: 0
      }
    };
    res.lifecycle.phaseOne.signalSummary = res.lifecycle.phaseOne.signalSummary ?? {
      demandCount: 0,
      oppositionCount: 0,
      totalCount: 0,
      viewerSignal: null,
      signalRatioPercent: 0,
      ratioRequirementMet: false,
      requiredDemandCount: 0,
      demandRequirementMet: false,
      advancementUnlocked: false,
      usesPlatformVoteContext: false,
      voteContextLabel: '',
      voteContextPopulation: 0
    };
    res.lifecycle.phaseTwo = res.lifecycle.phaseTwo ?? {
      plans: [],
      winningPlanId: null,
      viewerCanSubmitPlans: false,
      viewerCanVoteOnPlans: false
    };
    res.lifecycle.activity = res.lifecycle.activity ?? {
      activities: [],
      history: [],
      viewerCanCreateActivities: false,
      selectablePlanPhases: []
    };

    return res;
  } catch (err) {
    if ((err as { status?: number }).status === 404) return null;
    throw err;
  }
}

// -- Create ------------------------------------------------------------------

export async function fetchCreateEvent(input: CreateEventInput): Promise<CreateResult> {
  try {
    const locationLabel = input.locationLabel?.trim() || 'TBD';
    const res = await apiClient.post<{ event: { slug: string } }>('/events', {
      title: input.title,
      description: input.description,
      is_private: input.audience !== 'public',
      audience: input.audience,
      governance: input.governance,
      home_community_slug: input.homeCommunitySlug ?? null,
      time_label: input.timeLabel?.trim() || 'TBD',
      location_label: locationLabel,
      location_id: input.locationId ?? null,
      channel_slugs: input.channelTags.map((t) => t.slug),
      community_slugs: input.communityTags.map((t) => t.slug),
      invited_usernames: input.invitedUsernames,
      editor_usernames: input.editorUsernames ?? [],
      plan_title: input.planTitle ?? null,
      plan_description: input.planDescription ?? null,
      schedule_payload: input.schedulePayload ?? null,
      plan_payload: input.planPayload ?? null
    });
    return { ok: true, slug: res.event.slug };
  } catch (err) {
    return { ok: false, error: extractErrorMessage(err, 'Could not create event') };
  }
}

// -- Membership --------------------------------------------------------------

export async function fetchToggleEventMembership(eventSlug: string): Promise<void> {
  const isMember = membershipCache.get(eventSlug) ?? false;
  if (isMember) {
    await apiClient.delete(`/events/${eventSlug}/leave`);
    membershipCache.set(eventSlug, false);
  } else {
    await apiClient.post(`/events/${eventSlug}/join`);
    membershipCache.set(eventSlug, true);
  }
}

// -- Signals -----------------------------------------------------------------

type EventSignalToggleResponse = {
  ok: boolean;
  slug: string;
  action: 'added' | 'removed' | 'switched';
  signal_type: 'demand' | 'opposition';
  signals: { demand: number; opposition: number; total: number };
};

export async function fetchSetEventSignal(
  eventSlug: string,
  signal: GovernanceSignalType
): Promise<SignalToggleResult> {
  const response = await apiClient.post<EventSignalToggleResponse>(`/events/${eventSlug}/signals`, {
    signal_type: signal
  });
  return {
    ok: response.ok,
    slug: response.slug,
    action: response.action,
    signalType: response.signal_type,
    signals: response.signals
  };
}

// -- Values ------------------------------------------------------------------

export async function fetchAddEventValue(eventSlug: string, label: string): Promise<void> {
  await apiClient.post(`/events/${eventSlug}/values`, { label });
}

export async function fetchSetEventValueImportance(
  eventSlug: string,
  valueId: string,
  importance: ProjectImportanceVoteValue
): Promise<void> {
  await apiClient.post(`/events/${eventSlug}/values/${valueId}/importance`, { importance });
}

// -- Plans -------------------------------------------------------------------

export async function fetchAddEventPlan(eventSlug: string, input: EventPlanInput): Promise<boolean> {
  try {
    await apiClient.post(`/events/${eventSlug}/plans`, {
      title: input.title,
      description: input.description,
      demand_consideration_note: input.demandConsiderationNote,
      location_label: input.locationLabel,
      location_id: input.locationId ?? null,
      is_online: input.isOnline ?? false,
      schedule_payload: input.schedule ?? {},
      plan_payload: {
        planPhases: input.planPhases,
        valueConsiderationNotes: input.valueConsiderationNotes ?? {},
      },
    });
    return true;
  } catch {
    return false;
  }
}

export async function fetchSetEventPlanOverallVote(
  eventSlug: string,
  planId: string,
  vote: ProjectApprovalVote | null
): Promise<void> {
  await apiClient.post(`/events/${eventSlug}/plans/${planId}/vote`, { vote: vote ?? 'neutral' });
}

export async function fetchSetEventPlanValueVote(
  eventSlug: string,
  planId: string,
  valueId: string,
  vote: ProjectApprovalVote | null
): Promise<void> {
  await apiClient.post(`/events/${eventSlug}/plans/${planId}/value-votes`, {
    value_id: valueId,
    vote: vote ?? 'neutral'
  });
}

export async function fetchSetEventPlanCriterionRating(
  eventSlug: string,
  planId: string,
  criterionId: string,
  rating: PlanCriterionRating | null
): Promise<void> {
  await apiClient.post(`/events/${eventSlug}/plans/${planId}/criterion-ratings`, {
    criterion_id: criterionId,
    rating
  });
}

// -- Activities --------------------------------------------------------------

export async function fetchAddEventActivity(
  eventSlug: string,
  input: ProjectActivityInput
): Promise<void> {
  await apiClient.post(`/events/${eventSlug}/activities`, {
    title: input.title,
    scheduled_at: input.scheduledAt,
    ends_at: input.endsAt,
    is_online: input.isOnline ?? false,
    location_label: input.locationLabel,
    location_id: input.locationId ?? null,
    note: input.note,
    role_requirements: input.roleRequirements.map(r => ({
      label: r.label,
      required_count: r.requiredCount,
      maximum_count: r.maximumCount ?? null,
    })),
    linked_plan_phase_id: input.linkedPlanPhaseId ?? null,
  });
}

export async function fetchSetEventActivityCommitment(
  eventSlug: string,
  activityId: string,
  roleLabel: string | null
): Promise<void> {
  if (roleLabel === null) {
    await apiClient.delete(`/events/${eventSlug}/activities/${activityId}/commit`);
  } else {
    await apiClient.post(`/events/${eventSlug}/activities/${activityId}/commit`, { role_label: roleLabel });
  }
}

export async function fetchSetEventActivityRating(
  eventSlug: string,
  activityId: string,
  rating: number,
  comment: string | null
): Promise<void> {
  await apiClient.put(`/events/${eventSlug}/activities/${activityId}/rating`, {
    rating,
    comment
  });
}

export async function fetchDeleteEventActivityRating(
  eventSlug: string,
  activityId: string
): Promise<void> {
  await apiClient.delete(`/events/${eventSlug}/activities/${activityId}/rating`);
}

export async function fetchToggleEventHistoryCompletion(
  eventSlug: string,
  historyId: string,
  role: ProjectServiceHistoryCompletionRole,
  selection?: ProjectServiceHistoryCompletionChoice
): Promise<void> {
  await apiClient.post(`/events/${eventSlug}/activity-history/${historyId}/completion`, {
    role,
    selection: selection ?? null
  });
}

// -- Phase lifecycle ---------------------------------------------------------

export async function fetchRequestEventPhaseChange(
  eventSlug: string,
  targetPhaseId: EventLifecyclePhaseId,
  reason: string
): Promise<void> {
  await apiClient.post(`/events/${eventSlug}/phase-requests`, {
    target_phase_id: targetPhaseId,
    reason,
  });
}

export async function fetchSetEventPhaseChangeVote(
  eventSlug: string,
  requestId: string,
  vote: ProjectApprovalVote | null
): Promise<void> {
  if (!vote) return;
  await apiClient.post(`/events/${eventSlug}/phase-requests/${requestId}/vote`, { vote });
}

// -- Updates and edits -------------------------------------------------------

export async function fetchRequestEventUpdate(eventSlug: string, body: string): Promise<void> {
  await apiClient.post(`/events/${eventSlug}/update-requests`, { body });
}

export async function fetchSetEventUpdateVote(
  eventSlug: string,
  requestId: string,
  vote: ProjectApprovalVote | null
): Promise<void> {
  if (!vote) return;
  await apiClient.post(`/events/${eventSlug}/update-requests/${requestId}/vote`, { vote });
}

export async function fetchRequestEventEdit(
  eventSlug: string,
  title: string,
  description: string
): Promise<void> {
  await apiClient.post(`/events/${eventSlug}/edit-requests`, { title, description });
}

export async function fetchSetEventEditVote(
  eventSlug: string,
  requestId: string,
  vote: ProjectApprovalVote | null
): Promise<void> {
  if (!vote) return;
  await apiClient.post(`/events/${eventSlug}/edit-requests/${requestId}/vote`, { vote });
}

// -- Manual links ------------------------------------------------------------

export async function fetchCreateEventManualLinkRequest(
  eventSlug: string,
  targetKind: 'project' | 'event',
  targetSlug: string,
  summary: string,
  relationshipLabel?: string | null
): Promise<void> {
  await apiClient.post(`/events/${eventSlug}/manual-links`, {
    target_kind: targetKind,
    target_slug: targetSlug,
    relationship_label: relationshipLabel ?? undefined,
    summary,
  });
}

export async function fetchSetEventManualLinkVote(
  eventSlug: string,
  requestId: string,
  vote: ProjectApprovalVote | null
): Promise<void> {
  if (!vote) return;
  await apiClient.post(`/events/${eventSlug}/manual-links/${requestId}/vote`, { vote });
}

export async function fetchCreateEventManualLinkSeverRequest(
  eventSlug: string,
  linkId: string,
  summary?: string | null
): Promise<void> {
  await apiClient.post(`/events/${eventSlug}/links/${linkId}/sever`, {
    summary: summary ?? undefined
  });
}

// -- Editors -----------------------------------------------------------------

export async function fetchGrantEventEditAccess(eventSlug: string, userId: string): Promise<void> {
  await apiClient.post(`/events/${eventSlug}/editors/grant`, { user_id: userId });
}

export async function fetchRevokeEventEditAccess(eventSlug: string, userId: string): Promise<void> {
  await apiClient.post(`/events/${eventSlug}/editors/revoke`, { user_id: userId });
}

// -- Share -------------------------------------------------------------------

export async function fetchShareEventWithUser(
  eventSlug: string,
  username: string
): Promise<ShareTargetResult> {
  try {
    await apiClient.post(`/events/${eventSlug}/share`, { username });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: extractErrorMessage(err, 'Could not share') };
  }
}
