import { apiClient } from '../client';
import type { InviteAnswer, PendingInvite } from '$lib/types/invites';

interface BackendInvite {
  id: string;
  kind: PendingInvite['kind'];
  title: string;
  description: string;
  href: string;
  invited_by: string | null;
  created_at: string;
  scheduled_at: string | null;
  ends_at: string | null;
}

export async function fetchPendingInvites(): Promise<PendingInvite[]> {
  const res = await apiClient.get<{ items: BackendInvite[] }>('/invites');
  return res.items.map((item) => ({
    id: item.id,
    kind: item.kind,
    title: item.title,
    description: item.description,
    href: item.href,
    invitedBy: item.invited_by,
    createdAt: item.created_at,
    scheduledAt: item.scheduled_at,
    endsAt: item.ends_at,
  }));
}

export async function fetchAnswerInvite(id: string, accept: boolean): Promise<InviteAnswer> {
  const res = await apiClient.post<{ accepted: boolean; href: string | null }>(
    `/invites/${id}/${accept ? 'accept' : 'decline'}`,
    {}
  );
  return { accepted: res.accepted, href: res.href };
}
