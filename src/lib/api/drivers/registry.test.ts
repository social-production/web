/**
 * Provider-agnostic frontend contract tests.
 *
 * Assert AppAdapter / transport / registry / governance behavior that every
 * backend must honor. These tests do not hit FastAPI HTTP details.
 */

import { describe, expect, it } from 'vitest';
import type { AppAdapter } from '$lib/services/adapters/types';
import type { ErrorTransport } from '$lib/services/errorTransport';
import type { SessionTransport } from '$lib/services/sessionTransport';
import {
  PROVIDER_CAPABILITIES,
  PROVIDER_REGISTRY,
  PROVIDER_REQUIRED_DOMAINS,
  assertProviderReady,
  getProviderCapability,
  getProviderMetadata,
  listCapabilitiesByClass,
  parseBackendDriverName,
  providerSupports
} from '$lib/api/drivers/registry';
import {
  TEMPLATE_DOMAIN_CHECKLIST,
  createTemplateDriver,
  createTemplateErrorTransport,
  createTemplateSessionTransport
} from '$lib/api/drivers/template';
import {
  toCommentSubjectType,
  toGovernanceEntityType,
  toVoteTargetType,
  type CommentSubjectRef,
  type ReportTargetRef,
  type VoteTargetRef
} from '$lib/types/governance';
import {
  DEFAULT_FEED_PAGE_SIZE,
  appendUniqueById,
  toFeedPageResult
} from '$lib/types/pagination';

/** Keep in sync with PROVIDER_CONTRACTS.md smoke behaviors. */
export const PROVIDER_COMPATIBILITY_CHECKLIST = [
  'restore authenticated session on cold start (or report anonymous)',
  'load bootstrap + unread counts',
  'paginate public / home / personal feeds with sort + filter filters',
  'enforce closed-community and private-event visibility',
  'surface moderation states on feed and detail',
  'search entities with access filtering',
  'deliver messaging + linked-chat comments via adapter methods',
  'keep notification unread counts coherent with mark-read',
  'accept explicit governance entity refs for vote / comment / report'
] as const;

/** Core AppAdapter methods every driver must expose (parity sample + governance). */
export const APP_ADAPTER_CONTRACT_METHODS = [
  'getBootstrap',
  'getBootstrapSummary',
  'getPublicFeedPage',
  'getHomeFeedPage',
  'getPersonalFeedPage',
  'signIn',
  'signOut',
  'signUp',
  'getSearch',
  'getMessages',
  'getNotifications',
  'setVote',
  'getComments',
  'addComment',
  'submitReport',
  'setReportVote'
] as const satisfies ReadonlyArray<keyof AppAdapter>;

export const SESSION_TRANSPORT_METHODS = [
  'refreshSession',
  'markAuthenticatedSession',
  'clearAuthenticatedSession',
  'hasAuthenticatedSession',
  'hasRememberedAuthCookie',
  'shouldAttemptSessionRefresh',
  'getCsrfToken',
  'tryRestoreAuthenticatedSession'
] as const satisfies ReadonlyArray<keyof SessionTransport>;

export const ERROR_TRANSPORT_METHODS = [
  'extractErrorMessage',
  'isApiClientError',
  'isNetworkLoadError',
  'toLoadError'
] as const satisfies ReadonlyArray<keyof ErrorTransport>;

export const PROVIDER_COMPATIBILITY_SURFACE = PROVIDER_COMPATIBILITY_CHECKLIST;

describe('provider registry', () => {
  it('exposes fastapi as the ready production provider', () => {
    const fastapi = getProviderMetadata('fastapi');
    expect(fastapi.status).toBe('ready');
    expect(fastapi.backendWorkspace).toBe('web-backend');
  });

  it('exposes supabase as a ready alternate and keeps holochain unimplemented', () => {
    expect(getProviderMetadata('supabase').status).toBe('ready');
    expect(getProviderMetadata('supabase').backendWorkspace).toBe('web-supabase');
    expect(providerSupports('supabase', 'bootstrap')).toBe(true);
    expect(providerSupports('supabase', 'governanceVotes')).toBe(true);
    expect(getProviderMetadata('holochain').status).toBe('unimplemented');
    expect(getProviderMetadata('holochain').backendWorkspace).toBe('web-holochain');
  });

  it('parses known VITE_BACKEND values', () => {
    expect(parseBackendDriverName('fastapi')).toBe('fastapi');
    expect(parseBackendDriverName('SUPABASE')).toBe('supabase');
    expect(parseBackendDriverName('holochain')).toBe('holochain');
  });

  it('rejects unknown provider names', () => {
    expect(() => parseBackendDriverName('planetscale')).toThrow(/Unknown VITE_BACKEND/);
  });

  it('fails clearly for unimplemented providers', () => {
    expect(() => assertProviderReady('supabase')).not.toThrow();
    expect(() => assertProviderReady('holochain')).toThrow(/web-holochain/);
  });

  it('lists the same required domains for every provider', () => {
    for (const meta of Object.values(PROVIDER_REGISTRY)) {
      expect(meta.requiredDomains).toEqual(PROVIDER_REQUIRED_DOMAINS);
    }
    expect(PROVIDER_REQUIRED_DOMAINS).toContain('auth');
    expect(PROVIDER_REQUIRED_DOMAINS).toContain('feeds');
    expect(PROVIDER_REQUIRED_DOMAINS).toContain('messages');
  });
});

describe('provider capability model', () => {
  it('declares required universal capabilities', () => {
    const required = listCapabilitiesByClass('required');
    expect(required.map((item) => item.id)).toEqual(
      expect.arrayContaining([
        'sessionTransport',
        'errorTransport',
        'bootstrap',
        'feeds',
        'governanceVotes',
        'governanceComments',
        'governanceReports'
      ])
    );
  });

  it('marks centralized-only surfaces for FastAPI and unsupported for Holochain', () => {
    expect(providerSupports('fastapi', 'platformBoard')).toBe(true);
    expect(providerSupports('fastapi', 'ipGeolocationHint')).toBe(true);
    expect(getProviderCapability('holochain', 'platformBoard')).toBe('unsupported');
    expect(getProviderCapability('holochain', 'agentCentricIdentity')).toBe('planned');
  });

  it('keeps capability catalog exhaustive for registry keys', () => {
    expect(PROVIDER_CAPABILITIES.length).toBeGreaterThanOrEqual(15);
    for (const capability of PROVIDER_CAPABILITIES) {
      expect(getProviderCapability('fastapi', capability.id)).toMatch(
        /supported|unsupported|planned/
      );
    }
  });
});

describe('template driver contract', () => {
  it('throws a loud not-implemented error for any AppAdapter method', async () => {
    const driver = createTemplateDriver('supabase');
    await expect(driver.getBootstrap()).rejects.toThrow(/supabase driver: getBootstrap/);
    await expect(driver.signIn({ username: 'x', password: 'y' })).rejects.toThrow(
      /not implemented/
    );
  });

  it('covers every required domain in the template checklist', () => {
    expect(TEMPLATE_DOMAIN_CHECKLIST.map((item) => item.domain)).toEqual([
      ...PROVIDER_REQUIRED_DOMAINS
    ]);
  });

  it('exposes SessionTransport and ErrorTransport scaffolds', () => {
    const session = createTemplateSessionTransport('supabase');
    const errors = createTemplateErrorTransport('supabase');
    for (const method of SESSION_TRANSPORT_METHODS) {
      expect(typeof session[method]).toBe('function');
    }
    for (const method of ERROR_TRANSPORT_METHODS) {
      expect(typeof errors[method]).toBe('function');
    }
  });
});

describe('supabase and holochain drivers', () => {
  it(
    'assembles AppAdapter methods; holochain still fails loudly as scaffold',
    async () => {
      const { createSupabaseDriver } = await import('$lib/api/drivers/supabase');
      const { createHolochainDriver } = await import('$lib/api/drivers/holochain');

      const supabase = createSupabaseDriver();
      const holochain = createHolochainDriver();

      for (const method of APP_ADAPTER_CONTRACT_METHODS) {
        expect(typeof supabase[method]).toBe('function');
      }

      await expect(holochain.getBootstrap()).rejects.toThrow(/holochain driver: getBootstrap/);
      await expect(holochain.addComment({ id: 'p1', type: 'post' }, 'hi')).rejects.toThrow(
        /domains\/content\.ts/
      );
    },
    15000
  );

  it('exposes split session and error transports', async () => {
    const supabase = await import('$lib/api/drivers/supabase');
    const holochain = await import('$lib/api/drivers/holochain');

    expect(typeof supabase.createSupabaseSessionTransport().refreshSession).toBe('function');
    expect(typeof supabase.createSupabaseErrorTransport().extractErrorMessage).toBe('function');
    expect(typeof holochain.createHolochainSessionTransport().refreshSession).toBe('function');
    expect(typeof holochain.createHolochainErrorTransport().extractErrorMessage).toBe('function');
  });
});

describe('AppAdapter method coverage', () => {
  it('template driver exposes every catalogued contract method', async () => {
    const driver = createTemplateDriver('template');
    for (const method of APP_ADAPTER_CONTRACT_METHODS) {
      expect(typeof driver[method]).toBe('function');
      await expect(
        (driver[method] as (...args: unknown[]) => Promise<unknown>)()
      ).rejects.toThrow(/not implemented/);
    }
  });

  it('governance methods require typed entity refs (compile-time contract shapes)', () => {
    const voteTarget: VoteTargetRef = { id: 't1', type: 'thread' };
    const commentSubject: CommentSubjectRef = { id: 'p1', type: 'post' };
    const reportTarget: ReportTargetRef = { id: 'c1', type: 'comment' };
    expect(voteTarget.type).toBe('thread');
    expect(commentSubject.type).toBe('post');
    expect(reportTarget.type).toBe('comment');
  });
});

describe('governance entity refs', () => {
  it('maps feed kind labels onto wire governance types', () => {
    expect(toGovernanceEntityType('help-request')).toBe('help_request');
    expect(toGovernanceEntityType('thread')).toBe('thread');
    expect(toVoteTargetType('post')).toBe('post');
    expect(toCommentSubjectType('project')).toBe('project');
  });

  it('rejects non-votable / non-commentable kinds', () => {
    expect(() => toVoteTargetType('message')).toThrow(/not a vote target/);
    expect(() => toCommentSubjectType('comment')).toThrow(/not a comment subject/);
    expect(() => toGovernanceEntityType('unknown')).toThrow(/Unsupported/);
  });
});

describe('shared pagination contract', () => {
  it('builds FeedPageResult without depending on feature folders', () => {
    expect(DEFAULT_FEED_PAGE_SIZE).toBe(20);
    const page = toFeedPageResult([{ id: 'a' }, { id: 'b' }], {
      limit: 2,
      offset: 0,
      rawCount: 2
    });
    expect(page.hasMore).toBe(true);
    expect(appendUniqueById([{ id: 'a' }], [{ id: 'a' }, { id: 'c' }])).toEqual([
      { id: 'a' },
      { id: 'c' }
    ]);
  });
});

describe('provider compatibility checklist', () => {
  it('documents the smoke behaviors every provider must satisfy', () => {
    expect(PROVIDER_COMPATIBILITY_CHECKLIST.length).toBeGreaterThanOrEqual(9);
    expect(PROVIDER_COMPATIBILITY_SURFACE).toBe(PROVIDER_COMPATIBILITY_CHECKLIST);
  });
});
