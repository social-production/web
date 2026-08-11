/**
 * Holochain driver package.
 *
 * Holochain is a long-horizon redesign, not a transport-only swap.
 * Reuse AppAdapter / shared types where feasible; redesign feeds, moderation, messaging.
 * Keep registry status unimplemented until product semantics are redesigned.
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

export { createHolochainClient } from './client';
export { createHolochainSessionTransport } from './sessionTransport';
export { createHolochainErrorTransport } from './errorTransport';

export function createHolochainDriver(): AppAdapter {
  return assembleScaffoldDriver('holochain', {
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
  });
}
