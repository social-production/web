import { writable } from 'svelte/store';

/** Height of the install banner while it is showing, so the shell can keep content clear of it. */
export const installBannerHeight = writable(0);
