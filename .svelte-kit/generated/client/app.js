export { matchers } from './matchers.js';

export const nodes = [
	() => import('./nodes/0'),
	() => import('./nodes/1'),
	() => import('./nodes/2'),
	() => import('./nodes/3'),
	() => import('./nodes/4'),
	() => import('./nodes/5'),
	() => import('./nodes/6'),
	() => import('./nodes/7'),
	() => import('./nodes/8'),
	() => import('./nodes/9'),
	() => import('./nodes/10'),
	() => import('./nodes/11'),
	() => import('./nodes/12'),
	() => import('./nodes/13'),
	() => import('./nodes/14'),
	() => import('./nodes/15'),
	() => import('./nodes/16'),
	() => import('./nodes/17'),
	() => import('./nodes/18'),
	() => import('./nodes/19'),
	() => import('./nodes/20'),
	() => import('./nodes/21'),
	() => import('./nodes/22'),
	() => import('./nodes/23'),
	() => import('./nodes/24'),
	() => import('./nodes/25'),
	() => import('./nodes/26'),
	() => import('./nodes/27'),
	() => import('./nodes/28')
];

export const server_loads = [];

export const dictionary = {
		"/": [2],
		"/about": [3],
		"/channels/[slug]": [4],
		"/communities/[slug]": [5],
		"/create/channel": [6],
		"/create/community": [7],
		"/create/event": [8],
		"/create/post": [9],
		"/create/project": [10],
		"/create/thread": [11],
		"/events/[slug]": [12],
		"/messages": [13],
		"/notifications": [14],
		"/onboarding": [15],
		"/personal": [16],
		"/platform": [17],
		"/platform/assets": [18],
		"/platform/assets/[assetSlug]": [19],
		"/platform/assets/[assetSlug]/attached/[attachedAssetSlug]": [20],
		"/posts/[id]": [21],
		"/profile/[username]": [22],
		"/projects/[slug]": [23],
		"/roadmap": [24],
		"/search": [25],
		"/settings": [26],
		"/stewardship": [27],
		"/threads/[slug]": [28]
	};

export const hooks = {
	handleError: (({ error }) => { console.error(error) }),
	
	reroute: (() => {}),
	transport: {}
};

export const decoders = Object.fromEntries(Object.entries(hooks.transport).map(([k, v]) => [k, v.decode]));
export const encoders = Object.fromEntries(Object.entries(hooks.transport).map(([k, v]) => [k, v.encode]));

export const hash = false;

export const decode = (type, value) => decoders[type](value);

export { default as root } from '../root.js';