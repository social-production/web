
// this file is generated — do not edit it


declare module "svelte/elements" {
	export interface HTMLAttributes<T> {
		'data-sveltekit-keepfocus'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-noscroll'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-preload-code'?:
			| true
			| ''
			| 'eager'
			| 'viewport'
			| 'hover'
			| 'tap'
			| 'off'
			| undefined
			| null;
		'data-sveltekit-preload-data'?: true | '' | 'hover' | 'tap' | 'off' | undefined | null;
		'data-sveltekit-reload'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-replacestate'?: true | '' | 'off' | undefined | null;
	}
}

export {};


declare module "$app/types" {
	type MatcherParam<M> = M extends (param : string) => param is (infer U extends string) ? U : string;

	export interface AppTypes {
		RouteId(): "/" | "/channels" | "/channels/[slug]" | "/communities" | "/communities/[slug]" | "/create" | "/create/channel" | "/create/community" | "/create/event" | "/create/post" | "/create/project" | "/create/thread" | "/events" | "/events/[slug]" | "/messages" | "/notifications" | "/onboarding" | "/personal" | "/platform" | "/posts" | "/posts/[id]" | "/profile" | "/profile/[username]" | "/profile/[handle]" | "/projects" | "/projects/[slug]" | "/roadmap" | "/search" | "/settings" | "/stewardship" | "/threads" | "/threads/[slug]";
		RouteParams(): {
			"/channels/[slug]": { slug: string };
			"/communities/[slug]": { slug: string };
			"/events/[slug]": { slug: string };
			"/posts/[id]": { id: string };
			"/profile/[username]": { username: string };
			"/profile/[handle]": { handle: string };
			"/projects/[slug]": { slug: string };
			"/threads/[slug]": { slug: string }
		};
		LayoutParams(): {
			"/": { slug?: string; id?: string; username?: string; handle?: string };
			"/channels": { slug?: string };
			"/channels/[slug]": { slug: string };
			"/communities": { slug?: string };
			"/communities/[slug]": { slug: string };
			"/create": Record<string, never>;
			"/create/channel": Record<string, never>;
			"/create/community": Record<string, never>;
			"/create/event": Record<string, never>;
			"/create/post": Record<string, never>;
			"/create/project": Record<string, never>;
			"/create/thread": Record<string, never>;
			"/events": { slug?: string };
			"/events/[slug]": { slug: string };
			"/messages": Record<string, never>;
			"/notifications": Record<string, never>;
			"/onboarding": Record<string, never>;
			"/personal": Record<string, never>;
			"/platform": Record<string, never>;
			"/posts": { id?: string };
			"/posts/[id]": { id: string };
			"/profile": { username?: string; handle?: string };
			"/profile/[username]": { username: string };
			"/profile/[handle]": { handle: string };
			"/projects": { slug?: string };
			"/projects/[slug]": { slug: string };
			"/roadmap": Record<string, never>;
			"/search": Record<string, never>;
			"/settings": Record<string, never>;
			"/stewardship": Record<string, never>;
			"/threads": { slug?: string };
			"/threads/[slug]": { slug: string }
		};
		Pathname(): "/" | `/channels/${string}` & {} | `/communities/${string}` & {} | "/create/channel" | "/create/community" | "/create/event" | "/create/post" | "/create/project" | "/create/thread" | `/events/${string}` & {} | "/messages" | "/notifications" | "/onboarding" | "/personal" | "/platform" | `/posts/${string}` & {} | `/profile/${string}` & {} | `/projects/${string}` & {} | "/roadmap" | "/search" | "/settings" | "/stewardship" | `/threads/${string}` & {};
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): string & {};
	}
}