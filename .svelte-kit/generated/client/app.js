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
	() => import('./nodes/24')
];

export const server_loads = [];

export const dictionary = {
		"/": [2],
		"/channels/[slug]": [3],
		"/communities/[slug]": [4],
		"/create/channel": [5],
		"/create/community": [6],
		"/create/event": [7],
		"/create/post": [8],
		"/create/project": [9],
		"/create/thread": [10],
		"/events/[slug]": [11],
		"/messages": [12],
		"/notifications": [13],
		"/onboarding": [14],
		"/personal": [15],
		"/platform": [16],
		"/posts/[id]": [17],
		"/profile/[username]": [18],
		"/projects/[slug]": [19],
		"/roadmap": [20],
		"/search": [21],
		"/settings": [22],
		"/stewardship": [23],
		"/threads/[slug]": [24]
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