/**
 * FastAPI driver shim — prefer `$lib/services/governanceEntityRegistry`.
 * Kept so domain modules can migrate gradually.
 */
export {
  registerEntityType,
  registerCommentIds,
  tryResolveEntityType,
  resolveEntityType,
  resetGovernanceEntityRegistryForTests,
  type GovernanceEntityType
} from '$lib/services/governanceEntityRegistry';
