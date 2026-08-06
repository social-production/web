/**
 * Holochain `events` domain scaffold.
 * Responsibility: event detail + lifecycle mutations.
 * Replace stubs with real `web-holochain` calls mapped to `$lib/types/*`.
 */
import type { AppAdapter } from '$lib/services/adapters/types';
import { stubMethod } from '../../scaffold';

const provider = 'holochain' as const;
const domain = 'events' as const;

export const eventsDomain: Partial<AppAdapter> = {
  getEvent: stubMethod(provider, domain, 'getEvent') as AppAdapter['getEvent'],
  createEvent: stubMethod(provider, domain, 'createEvent') as AppAdapter['createEvent'],
  toggleEventMembership: stubMethod(provider, domain, 'toggleEventMembership') as AppAdapter['toggleEventMembership'],
  setEventSignal: stubMethod(provider, domain, 'setEventSignal') as AppAdapter['setEventSignal'],
  addEventValue: stubMethod(provider, domain, 'addEventValue') as AppAdapter['addEventValue'],
  setEventValueImportance: stubMethod(provider, domain, 'setEventValueImportance') as AppAdapter['setEventValueImportance'],
  addEventPlan: stubMethod(provider, domain, 'addEventPlan') as AppAdapter['addEventPlan'],
  setEventPlanValueVote: stubMethod(provider, domain, 'setEventPlanValueVote') as AppAdapter['setEventPlanValueVote'],
  setEventPlanCriterionRating: stubMethod(provider, domain, 'setEventPlanCriterionRating') as AppAdapter['setEventPlanCriterionRating'],
  setEventPlanOverallVote: stubMethod(provider, domain, 'setEventPlanOverallVote') as AppAdapter['setEventPlanOverallVote'],
  addEventActivity: stubMethod(provider, domain, 'addEventActivity') as AppAdapter['addEventActivity'],
  setEventActivityCommitment: stubMethod(provider, domain, 'setEventActivityCommitment') as AppAdapter['setEventActivityCommitment'],
  setEventActivityRating: stubMethod(provider, domain, 'setEventActivityRating') as AppAdapter['setEventActivityRating'],
  deleteEventActivityRating: stubMethod(provider, domain, 'deleteEventActivityRating') as AppAdapter['deleteEventActivityRating'],
  toggleEventHistoryCompletion: stubMethod(provider, domain, 'toggleEventHistoryCompletion') as AppAdapter['toggleEventHistoryCompletion'],
  requestEventPhaseChange: stubMethod(provider, domain, 'requestEventPhaseChange') as AppAdapter['requestEventPhaseChange'],
  setEventPhaseChangeVote: stubMethod(provider, domain, 'setEventPhaseChangeVote') as AppAdapter['setEventPhaseChangeVote'],
  requestEventUpdate: stubMethod(provider, domain, 'requestEventUpdate') as AppAdapter['requestEventUpdate'],
  setEventUpdateVote: stubMethod(provider, domain, 'setEventUpdateVote') as AppAdapter['setEventUpdateVote'],
  requestEventEdit: stubMethod(provider, domain, 'requestEventEdit') as AppAdapter['requestEventEdit'],
  setEventEditVote: stubMethod(provider, domain, 'setEventEditVote') as AppAdapter['setEventEditVote'],
  createEventManualLinkRequest: stubMethod(provider, domain, 'createEventManualLinkRequest') as AppAdapter['createEventManualLinkRequest'],
  setEventManualLinkVote: stubMethod(provider, domain, 'setEventManualLinkVote') as AppAdapter['setEventManualLinkVote'],
  createEventManualLinkSeverRequest: stubMethod(provider, domain, 'createEventManualLinkSeverRequest') as AppAdapter['createEventManualLinkSeverRequest'],
  grantEventEditAccess: stubMethod(provider, domain, 'grantEventEditAccess') as AppAdapter['grantEventEditAccess'],
  revokeEventEditAccess: stubMethod(provider, domain, 'revokeEventEditAccess') as AppAdapter['revokeEventEditAccess'],
  shareEventWithUser: stubMethod(provider, domain, 'shareEventWithUser') as AppAdapter['shareEventWithUser'],
};

