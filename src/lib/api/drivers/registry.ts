/**
 * Provider registry metadata — build-time backend selection via VITE_BACKEND.
 *
 * Product UI depends only on AppAdapter + SessionTransport + ErrorTransport.
 * New backends plug in by implementing those three seams and registering here.
 */

export type BackendDriverName = 'fastapi' | 'supabase' | 'holochain' | 'mock' | 'template';

export type ProviderStatus = 'ready' | 'unimplemented' | 'experimental';

/**
 * Capability classes for negotiating what a backend can satisfy.
 *
 * - required: every ready provider must implement these surfaces
 * - optional: product may degrade gracefully when missing
 * - centralizedOnly: assumes a single coordinating server (opt out for distributed)
 * - distributedRedesign: needs a different product model under Holochain-like backends
 */
export type ProviderCapabilityClass =
  | 'required'
  | 'optional'
  | 'centralizedOnly'
  | 'distributedRedesign';

export type ProviderCapabilityId =
  | 'sessionTransport'
  | 'errorTransport'
  | 'bootstrap'
  | 'feeds'
  | 'governanceVotes'
  | 'governanceComments'
  | 'governanceReports'
  | 'messaging'
  | 'notifications'
  | 'search'
  | 'locations'
  | 'scopes'
  | 'moderation'
  | 'platformBoard'
  | 'ipGeolocationHint'
  | 'centralizedInviteCodes'
  | 'agentCentricIdentity';

export interface ProviderCapability {
  id: ProviderCapabilityId;
  class: ProviderCapabilityClass;
  description: string;
}

export const PROVIDER_CAPABILITIES: readonly ProviderCapability[] = [
  {
    id: 'sessionTransport',
    class: 'required',
    description: 'Cold-start session restore and auth refresh via SessionTransport'
  },
  {
    id: 'errorTransport',
    class: 'required',
    description: 'Normalize provider errors via ErrorTransport'
  },
  {
    id: 'bootstrap',
    class: 'required',
    description: 'Viewer + unread counts bootstrap payload'
  },
  {
    id: 'feeds',
    class: 'required',
    description: 'Paginated public / home / personal / scope / user feeds'
  },
  {
    id: 'governanceVotes',
    class: 'required',
    description: 'Explicit VoteTargetRef votes on content entities'
  },
  {
    id: 'governanceComments',
    class: 'required',
    description: 'Explicit CommentSubjectRef comments and replies'
  },
  {
    id: 'governanceReports',
    class: 'required',
    description: 'Explicit ReportTargetRef content reports'
  },
  {
    id: 'messaging',
    class: 'required',
    description: 'Direct / group messages and linked chats'
  },
  {
    id: 'notifications',
    class: 'required',
    description: 'Notification list + mark-read coherence'
  },
  {
    id: 'search',
    class: 'required',
    description: 'Entity search with access filtering'
  },
  {
    id: 'locations',
    class: 'required',
    description: 'Location search / create / reverse geocode'
  },
  {
    id: 'scopes',
    class: 'required',
    description: 'Channels, communities, membership, invites'
  },
  {
    id: 'moderation',
    class: 'required',
    description: 'Moderation states on feed and detail surfaces'
  },
  {
    id: 'platformBoard',
    class: 'centralizedOnly',
    description: 'Platform moderator board volunteering / voting'
  },
  {
    id: 'ipGeolocationHint',
    class: 'centralizedOnly',
    description: 'Server-side IP location hint endpoint'
  },
  {
    id: 'centralizedInviteCodes',
    class: 'centralizedOnly',
    description: 'Server-issued scope invite codes'
  },
  {
    id: 'agentCentricIdentity',
    class: 'distributedRedesign',
    description: 'Agent-centric identity / DHT authorship (Holochain track)'
  }
] as const;

export type ProviderCapabilitySupport = 'supported' | 'unsupported' | 'planned';

export interface ProviderMetadata {
  name: BackendDriverName;
  label: string;
  status: ProviderStatus;
  /** Separate backend workspace / repo expected for this provider. */
  backendWorkspace: string | null;
  /** Short note for smoke tooling and docs. */
  notes: string;
  /** Domains a full driver must implement (mirrors fastapi/domains). */
  requiredDomains: readonly string[];
  /**
   * Capability negotiation map. Missing keys default to:
   * - required → supported when status=ready, else planned
   * - optional / centralizedOnly / distributedRedesign → planned
   */
  capabilities?: Partial<Record<ProviderCapabilityId, ProviderCapabilitySupport>>;
}

export const PROVIDER_REQUIRED_DOMAINS = [
  'auth',
  'bootstrap',
  'feeds',
  'projects',
  'events',
  'content',
  'helpRequests',
  'messages',
  'notifications',
  'scopes',
  'users',
  'search',
  'locations'
] as const;

const CENTRALIZED_DEFAULTS: Partial<Record<ProviderCapabilityId, ProviderCapabilitySupport>> = {
  platformBoard: 'supported',
  ipGeolocationHint: 'supported',
  centralizedInviteCodes: 'supported',
  agentCentricIdentity: 'unsupported'
};

const DISTRIBUTED_DEFAULTS: Partial<Record<ProviderCapabilityId, ProviderCapabilitySupport>> = {
  platformBoard: 'unsupported',
  ipGeolocationHint: 'unsupported',
  centralizedInviteCodes: 'planned',
  agentCentricIdentity: 'planned'
};

export const PROVIDER_REGISTRY: Record<BackendDriverName, ProviderMetadata> = {
  fastapi: {
    name: 'fastapi',
    label: 'FastAPI + Postgres + Redis',
    status: 'ready',
    backendWorkspace: 'web-backend',
    notes: 'Production beta provider. Implements AppAdapter + session/error transports.',
    requiredDomains: PROVIDER_REQUIRED_DOMAINS,
    capabilities: {
      ...CENTRALIZED_DEFAULTS,
      sessionTransport: 'supported',
      errorTransport: 'supported',
      bootstrap: 'supported',
      feeds: 'supported',
      governanceVotes: 'supported',
      governanceComments: 'supported',
      governanceReports: 'supported',
      messaging: 'supported',
      notifications: 'supported',
      search: 'supported',
      locations: 'supported',
      scopes: 'supported',
      moderation: 'supported'
    }
  },
  supabase: {
    name: 'supabase',
    label: 'Supabase',
    status: 'ready',
    backendWorkspace: 'web-supabase',
    notes:
      'Local-ready alternate via Auth + Postgres + Edge Function gateway. Strict parity pass: lifecycle votes, region clip, board standing, report thresholds. Messaging remains intentional plaintext at rest. Beginner guides: web-supabase/docs/LOCAL_DEV.md, HOSTED.md, SIGNOFF.md. See PARITY_AUDIT.md.',
    requiredDomains: PROVIDER_REQUIRED_DOMAINS,
    capabilities: {
      ...CENTRALIZED_DEFAULTS,
      sessionTransport: 'supported',
      errorTransport: 'supported',
      bootstrap: 'supported',
      feeds: 'supported',
      governanceVotes: 'supported',
      governanceComments: 'supported',
      governanceReports: 'supported',
      messaging: 'supported',
      notifications: 'supported',
      search: 'supported',
      locations: 'supported',
      scopes: 'supported',
      moderation: 'supported'
    }
  },
  holochain: {
    name: 'holochain',
    label: 'Holochain',
    status: 'unimplemented',
    backendWorkspace: 'web-holochain',
    notes:
      'Long-horizon track. Frontend driver scaffold + web-holochain placeholder exist. Same frontend contract; domain model will differ. Do not treat as a transport-only swap.',
    requiredDomains: PROVIDER_REQUIRED_DOMAINS,
    capabilities: {
      ...DISTRIBUTED_DEFAULTS,
      sessionTransport: 'planned',
      errorTransport: 'planned',
      bootstrap: 'planned',
      feeds: 'planned',
      governanceVotes: 'planned',
      governanceComments: 'planned',
      governanceReports: 'planned',
      messaging: 'planned',
      notifications: 'planned',
      search: 'planned',
      locations: 'planned',
      scopes: 'planned',
      moderation: 'planned'
    }
  },
  mock: {
    name: 'mock',
    label: 'Mock (removed)',
    status: 'unimplemented',
    backendWorkspace: null,
    notes: 'Removed. Use fastapi for local development or template for scaffolding.',
    requiredDomains: PROVIDER_REQUIRED_DOMAINS,
    capabilities: {}
  },
  template: {
    name: 'template',
    label: 'Template scaffold',
    status: 'experimental',
    backendWorkspace: null,
    notes: 'Proxy driver that throws notImplemented for every method. Use to scaffold new providers.',
    requiredDomains: PROVIDER_REQUIRED_DOMAINS,
    capabilities: {}
  }
};

export function parseBackendDriverName(raw: string | undefined | null): BackendDriverName {
  const value = (raw ?? 'fastapi').trim().toLowerCase();
  if (value in PROVIDER_REGISTRY) {
    return value as BackendDriverName;
  }
  throw new Error(
    `Unknown VITE_BACKEND="${raw}". Expected one of: ${Object.keys(PROVIDER_REGISTRY).join(', ')}`
  );
}

export function getProviderMetadata(name: BackendDriverName): ProviderMetadata {
  return PROVIDER_REGISTRY[name];
}

export function getProviderCapability(
  name: BackendDriverName,
  capabilityId: ProviderCapabilityId
): ProviderCapabilitySupport {
  const meta = getProviderMetadata(name);
  const declared = meta.capabilities?.[capabilityId];
  if (declared) {
    return declared;
  }
  const capability = PROVIDER_CAPABILITIES.find((item) => item.id === capabilityId);
  if (!capability) {
    return 'unsupported';
  }
  if (capability.class === 'required') {
    return meta.status === 'ready' ? 'supported' : 'planned';
  }
  return 'planned';
}

export function providerSupports(name: BackendDriverName, capabilityId: ProviderCapabilityId): boolean {
  return getProviderCapability(name, capabilityId) === 'supported';
}

export function listCapabilitiesByClass(
  capabilityClass: ProviderCapabilityClass
): readonly ProviderCapability[] {
  return PROVIDER_CAPABILITIES.filter((capability) => capability.class === capabilityClass);
}

export function assertProviderReady(name: BackendDriverName): void {
  const meta = getProviderMetadata(name);
  if (meta.status === 'ready' || meta.status === 'experimental') {
    return;
  }
  throw new Error(
    [
      `Backend provider "${name}" is not implemented yet.`,
      meta.notes,
      meta.backendWorkspace
        ? `Expected backend workspace: ${meta.backendWorkspace}`
        : null,
      'Set VITE_BACKEND=fastapi until the alternate driver exists.'
    ]
      .filter(Boolean)
      .join(' ')
  );
}
