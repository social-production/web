import { apiAssetUrl, apiClient, extractErrorMessage } from '../client';
import type {
  ScopeProposal,
  ScopeSettings,
  ScopeSettingsApi,
  ScopeSettingsKind,
} from '$lib/types/scopeSettings';

interface BackendProposal {
  id: string;
  kind: ScopeProposal['kind'];
  payload: Record<string, unknown>;
  proposer: string | null;
  yes: number;
  no: number;
  votes_required: number;
  viewer_vote: 'yes' | 'no' | null;
  viewer_can_vote: boolean;
  created_at?: string;
  closes_at: string;
}

interface BackendSettings {
  scope_kind: ScopeSettingsKind;
  slug: string;
  name: string;
  description: string;
  image_url: string | null;
  is_private: boolean;
  governance: 'collaborative' | 'organizer';
  quorum_basis: string;
  member_count: number;
  organizers: Array<string | null>;
  viewer_is_member: boolean;
  viewer_is_organizer: boolean;
  viewer_edits_directly: boolean;
  proposals: BackendProposal[];
}

const plural = (kind: ScopeSettingsKind) => (kind === 'community' ? 'communities' : 'channels');

function mapSettings(res: BackendSettings): ScopeSettings {
  return {
    kind: res.scope_kind,
    slug: res.slug,
    name: res.name,
    description: res.description,
    imageUrl: res.image_url ? apiAssetUrl(res.image_url) : null,
    isPrivate: res.is_private,
    governance: res.governance,
    quorumBasis: res.quorum_basis,
    memberCount: res.member_count,
    organizers: res.organizers.filter((name): name is string => Boolean(name)),
    viewerIsMember: res.viewer_is_member,
    viewerIsOrganizer: res.viewer_is_organizer,
    viewerEditsDirectly: res.viewer_edits_directly,
    proposals: res.proposals.map((item) => ({
      id: item.id,
      kind: item.kind,
      payload: {
        name: typeof item.payload.name === 'string' ? item.payload.name : undefined,
        description:
          typeof item.payload.description === 'string' ? item.payload.description : undefined,
        imageUrl:
          typeof item.payload.image_url === 'string' ? apiAssetUrl(item.payload.image_url) : null,
        removeImage: Boolean(item.payload.remove_image),
        username: typeof item.payload.username === 'string' ? item.payload.username : undefined,
        organizerUsernames: Array.isArray(item.payload.organizer_usernames)
          ? (item.payload.organizer_usernames as string[])
          : undefined,
      },
      proposer: item.proposer,
      yes: item.yes,
      no: item.no,
      votesRequired: item.votes_required,
      viewerVote: item.viewer_vote,
      viewerCanVote: item.viewer_can_vote,
      createdAt: item.created_at ?? null,
      closesAt: item.closes_at,
    })),
  };
}

async function call<T>(run: () => Promise<T>, fallback: string): Promise<T> {
  try {
    return await run();
  } catch (err) {
    throw new Error(extractErrorMessage(err, fallback));
  }
}

export const fastapiScopeSettings: ScopeSettingsApi = {
  get: (kind, slug) =>
    call(
      async () =>
        mapSettings(
          await apiClient.get<BackendSettings>(`/scopes/${plural(kind)}/${slug}/settings`)
        ),
      'Could not load settings.'
    ),
  edit: (kind, slug, input) =>
    call(
      async () =>
        mapSettings(
          await apiClient.patch<BackendSettings>(`/scopes/${plural(kind)}/${slug}/settings`, {
            name: input.name,
            description: input.description,
            image_key: input.imageKey,
            image_content_type: input.imageContentType,
            remove_image: input.removeImage,
          })
        ),
      'Could not save that change.'
    ),
  uploadImage: (kind, slug, file) =>
    call(async () => {
      const form = new FormData();
      form.append('file', file);
      const res = await apiClient.postForm<{ image_key: string; content_type: string }>(
        `/scopes/${plural(kind)}/${slug}/image`,
        form
      );
      return { imageKey: res.image_key, contentType: res.content_type };
    }, 'Could not upload that picture.'),
  propose: (kind, slug, input) =>
    call(
      async () =>
        mapSettings(
          await apiClient.post<BackendSettings>(`/scopes/${plural(kind)}/${slug}/proposals`, {
            kind: input.kind,
            target_username: input.targetUsername,
            organizer_usernames: input.organizerUsernames ?? [],
          })
        ),
      'Could not start that vote.'
    ),
  vote: (proposalId, vote) =>
    call(
      async () =>
        mapSettings(
          await apiClient.post<BackendSettings>(`/scopes/proposals/${proposalId}/vote`, { vote })
        ),
      'Could not record that vote.'
    ),
  setOrganizer: (kind, slug, username, organizer) =>
    call(
      async () =>
        mapSettings(
          await apiClient.post<BackendSettings>(`/scopes/${plural(kind)}/${slug}/organizers`, {
            username,
            organizer,
          })
        ),
      'Could not change organizers.'
    ),
  removeMember: (kind, slug, username) =>
    call(
      async () =>
        mapSettings(
          await apiClient.delete<BackendSettings>(
            `/scopes/${plural(kind)}/${slug}/members/${encodeURIComponent(username)}`
          )
        ),
      'Could not remove that member.'
    ),
};
