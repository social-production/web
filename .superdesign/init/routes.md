# Route map

All routes render inside `src/routes/+layout.svelte` → `AppShell` unless noted.

| Route | Entry `+page.svelte` | Feature / page component | Notes |
|-------|----------------------|--------------------------|-------|
| `/` | `src/routes/+page.svelte` | `PublicFeed` (`src/lib/features/public-feed/PublicFeed.svelte`) | Public discovery feed; loader in `+page.ts` |
| `/personal` | `src/routes/personal/+page.svelte` | `PersonalFeed` (`src/lib/features/personal-feed/PersonalFeed.svelte`) | Personal feed; requires viewer for full experience |
| `/settings` | `src/routes/settings/+page.svelte` | `SettingsPage` (`src/lib/features/settings/SettingsPage.svelte`) | Account, appearance, privacy toggles |
| `/messages` | `src/routes/messages/+page.svelte` | `MessagesPage` (`src/lib/features/messages/MessagesPage.svelte`) | DMs, linked chats, composer |
| `/onboarding` | `src/routes/onboarding/+page.svelte` | `OnboardingPage` (`src/lib/features/onboarding/OnboardingPage.svelte`) | Auth entry; shell uses `shell-auth` (no rails/nav) |
| `/projects/[slug]` | `src/routes/projects/[slug]/+page.svelte` | `ProjectDetailPage` (`src/lib/features/projects/ProjectDetailPage.svelte`) | Project detail with governance tabs |
| `/create/project` | `src/routes/create/project/+page.svelte` | `CreateProjectPage` | |
| `/create/thread` | `src/routes/create/thread/+page.svelte` | `CreateThreadPage` | |
| `/create/event` | `src/routes/create/event/+page.svelte` | `CreateEventPage` | |
| `/create/post` | `src/routes/create/post/+page.svelte` | `CreatePostPage` | |
| `/create/help-request` | `src/routes/create/help-request/+page.svelte` | `CreateHelpRequestPage` | |
| `/create/community` | `src/routes/create/community/+page.svelte` | `CreateCommunityPage` | |
| `/create/channel` | `src/routes/create/channel/+page.svelte` | `CreateChannelPage` | |

### Create routes (detail)

| Path | Feature module |
|------|----------------|
| `/create/project` | `$lib/features/create/project/CreateProjectPage.svelte` |
| `/create/thread` | `$lib/features/create/thread/CreateThreadPage.svelte` |
| `/create/event` | `$lib/features/create/event/CreateEventPage.svelte` |
| `/create/post` | `$lib/features/create/post/CreatePostPage.svelte` |
| `/create/help-request` | `$lib/features/create/help-request/CreateHelpRequestPage.svelte` |
| `/create/community` | `$lib/features/create/community/CreateCommunityPage.svelte` |
| `/create/channel` | `$lib/features/create/channel/CreateChannelPage.svelte` |

Create menu links are defined in `$lib/app/shell/createMenuItems.ts` and surfaced via `CreateFab`.

### Related routes (not primary map targets)

- `/notifications` → `NotificationsPage`
- `/map` → map panel / dedicated map page
- `/search` → search results
- `/threads/[slug]`, `/events/[slug]`, `/posts/[id]`, `/help-requests/[id]` → detail surfaces
- `/login`, `/signup` → auth (auth shell)
