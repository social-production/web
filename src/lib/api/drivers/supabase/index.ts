/**
 * Supabase driver package.
 *
 * Talk to the web-supabase workspace (Auth + Postgres + optional Edge Functions).
 * Map payloads into $lib/types/* and keep AppAdapter shapes identical to FastAPI.
 * Flip registry status to ready only after SessionTransport + ErrorTransport work.
 *
 * Package shape mirrors FastAPI / template checklist:
 * client.ts, sessionTransport.ts, errorTransport.ts, domains/*.
 */

import type { AppAdapter } from '$lib/services/adapters/types';
import { assembleScaffoldDriver } from '../scaffold';
import { authDomain } from './domains/auth';
import { bootstrapDomain } from './domains/bootstrap';
import { feedsDomain } from './domains/feeds';
import { projectsDomain } from './domains/projects';
import { eventsDomain } from './domains/events';
import { contentDomain } from './domains/content';
import { helpRequestsDomain } from './domains/helpRequests';
import { messagesDomain } from './domains/messages';
import { notificationsDomain } from './domains/notifications';
import { scopesDomain } from './domains/scopes';
import { usersDomain } from './domains/users';
import { searchDomain } from './domains/search';
import { locationsDomain } from './domains/locations';
import { feedbackDomain } from './domains/feedback';

export { createSupabaseClient } from './client';
export { createSupabaseSessionTransport } from './sessionTransport';
export { createSupabaseErrorTransport } from './errorTransport';

export function createSupabaseDriver(): AppAdapter {
  return assembleScaffoldDriver('supabase', {
    auth: authDomain,
    bootstrap: bootstrapDomain,
    feeds: feedsDomain,
    projects: projectsDomain,
    events: eventsDomain,
    content: contentDomain,
    helpRequests: helpRequestsDomain,
    messages: messagesDomain,
    notifications: notificationsDomain,
    scopes: scopesDomain,
    users: usersDomain,
    search: searchDomain,
    locations: locationsDomain,
    feedback: feedbackDomain,
  });
}
