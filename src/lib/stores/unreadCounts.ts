import { writable } from 'svelte/store';
import type { UnreadCounts } from '$lib/types/bootstrap';

export const unreadCounts = writable<UnreadCounts | null>(null);
