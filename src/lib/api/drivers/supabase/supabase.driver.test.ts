/**
 * Supabase driver unit smoke — validates driver assembly + transport seams
 * without requiring a live Supabase instance.
 */

import { describe, expect, it } from 'vitest';
import {
  createSupabaseDriver,
  createSupabaseErrorTransport,
  createSupabaseSessionTransport
} from '$lib/api/drivers/supabase';
import { usernameToAuthEmail } from '$lib/api/drivers/supabase/authSession';
import type { AppAdapter } from '$lib/services/adapters/types';
import type { ErrorTransport } from '$lib/services/errorTransport';
import type { SessionTransport } from '$lib/services/sessionTransport';

const APP_ADAPTER_CONTRACT_METHODS = [
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
  'getLinkedChats',
  'getNotifications',
  'setVote',
  'getComments',
  'addComment',
  'submitReport',
  'setReportVote'
] as const satisfies ReadonlyArray<keyof AppAdapter>;

const SESSION_TRANSPORT_METHODS = [
  'refreshSession',
  'markAuthenticatedSession',
  'clearAuthenticatedSession',
  'hasAuthenticatedSession',
  'hasRememberedAuthCookie',
  'shouldAttemptSessionRefresh',
  'getCsrfToken',
  'tryRestoreAuthenticatedSession'
] as const satisfies ReadonlyArray<keyof SessionTransport>;

const ERROR_TRANSPORT_METHODS = [
  'extractErrorMessage',
  'isApiClientError',
  'isNetworkLoadError',
  'toLoadError'
] as const satisfies ReadonlyArray<keyof ErrorTransport>;

describe('supabase driver package', () => {
  it('exposes session transport methods', () => {
    const transport = createSupabaseSessionTransport();
    for (const method of SESSION_TRANSPORT_METHODS) {
      expect(typeof transport[method]).toBe('function');
    }
  });

  it('exposes error transport methods', () => {
    const transport = createSupabaseErrorTransport();
    for (const method of ERROR_TRANSPORT_METHODS) {
      expect(typeof transport[method]).toBe('function');
    }
  });

  it('assembles AppAdapter contract methods', () => {
    const driver = createSupabaseDriver();
    for (const method of APP_ADAPTER_CONTRACT_METHODS) {
      expect(typeof driver[method]).toBe('function');
    }
  });

  it('maps usernames to synthetic auth emails', () => {
    expect(usernameToAuthEmail('Ada')).toBe('ada@users.socialproduction.com');
    expect(usernameToAuthEmail('ada@example.com')).toBe('ada@example.com');
  });

  it('normalizes gateway-style error bodies', () => {
    const transport = createSupabaseErrorTransport();
    expect(
      transport.extractErrorMessage({ status: 400, body: { detail: 'bad request' } }, 'fallback')
    ).toBe('bad request');
    expect(
      transport.extractErrorMessage({ status: 400, body: { msg: 'invalid login' } }, 'fallback')
    ).toBe('invalid login');
  });
});
