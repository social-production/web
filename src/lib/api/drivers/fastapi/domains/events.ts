import { apiClient, extractErrorMessage } from '../client';
import { registerEntityType, registerCommentIds } from '../typeRegistry';
import type {
  EventPageData,
  EventPlanInput,
  ProjectActivityInput,
  ProjectApprovalVote,
  ProjectImportanceVoteValue,
  GovernanceSignalType,
  ShareTargetResult,
  EventLifecyclePhaseId,
} from '$lib/types/detail';
import type { CreateEventInput, CreateResult } from '$lib/types/feed';

// Membership cache for toggle direction (populated from getEvent viewerIsMember)
const membershipCache = new Map<string, boolean>();

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// -- Read -------------------------------------------------------------------

export async function fetchEvent(slug: string): Promise<EventPageData | null> {
  try {
    const res = await apiClient.get<EventPageData>(`/events/${slug}`);
    membershipCache.set(res.slug, res.viewerIsMember);
    registerEntityType(res.id, 'event');
    if (res.discussion) registerCommentIds(res.discussion);
    return res;
  } catch (err) {
    if ((err as { status?: number }).status === 404) return null;
    throw err;
  }
}

// -- Create ------------------------------------------------------------------

export async function fetchCreateEvent(input: CreateEventInput): Promise<CreateResult> {
  try {
    const res = await apiClient.post<{ event: { slug: string } }>('/events', {
      slug: slugify(input.title),
      title: input.title,
      description: input.description,
      is_private: input.isPrivate ?? false,
      time_label: 'TBD',
      location_label: 'TBD',
      channel_slugs: input.channelTags.map(t => t.slug),
      community_slugs: input.communityTags.map(t => t.slug),
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

export async function fetchSetEventSignal(eventSlug: string, signal: GovernanceSignalType): Promise<void> {
  await apiClient.post(`/events/${eventSlug}/signals`, { signal_type: signal });
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
      schedule_payload: input.schedule ?? {},
      plan_payload: { planPhases: input.planPhases },
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
  if (!vote) return;
  await apiClient.post(`/events/${eventSlug}/plans/${planId}/vote`, { vote });
}

export async function fetchSetEventPlanValueVote(
  eventSlug: string,
  planId: string,
  valueId: string,
  vote: ProjectApprovalVote | null
): Promise<void> {
  if (!vote) return;
  await apiClient.post(`/events/${eventSlug}/plans/${planId}/value-votes`, {
    value_id: valueId,
    vote,
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
    location_label: input.locationLabel,
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
