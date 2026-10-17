import type { ScopeProposal } from '$lib/types/scopeSettings';

/** One line saying what a community or channel decision would change. */
export function describeScopeProposal(item: ScopeProposal): string {
  switch (item.kind) {
    case 'edit': {
      const parts = [];
      if (item.payload.name) parts.push(`rename to “${item.payload.name}”`);
      if (item.payload.description) parts.push('new description');
      if (item.payload.imageUrl) parts.push('new picture');
      return `Change: ${parts.join(', ') || 'settings'}`;
    }
    case 'remove_member':
      return `Remove ${item.payload.username ?? 'a member'}`;
    case 'to_collaborative':
      return 'Let all members decide';
    case 'to_organizer':
      return `Hand decisions to organizers: ${(item.payload.organizerUsernames ?? [item.proposer]).join(', ')}`;
  }
}
