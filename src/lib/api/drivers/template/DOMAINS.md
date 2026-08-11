# Domain modules a provider driver must implement

Mirror `src/lib/api/drivers/fastapi/domains/` when building a new provider.

| Domain | Responsibility |
|--------|----------------|
| `auth.ts` | signIn / signUp / signOut mapping |
| `bootstrap.ts` | bootstrap + summary |
| `feeds.ts` | public / home / personal / region / scope / user feeds + map markers |
| `projects.ts` | project detail + lifecycle mutations |
| `events.ts` | event detail + lifecycle mutations |
| `content.ts` | threads, posts, comments, votes, reports |
| `helpRequests.ts` | help request detail + role commits |
| `messages.ts` | conversations, DMs, groups, contacts |
| `notifications.ts` | notification list + mark read |
| `scopes.ts` | channels, communities, invites, board |
| `users.ts` | profile, settings, follows |
| `search.ts` | global search |
| `locations.ts` | geocode / create / reverse |

Also implement at the driver package root:

- `index.ts` — `createXDriver(): AppAdapter` assembled from domain modules
- `sessionTransport.ts` — `SessionTransport`
- `errorTransport.ts` — `ErrorTransport`
- `client.ts` — HTTP/SDK transport (provider-specific)

`supabase/` and `holochain/` already contain this beginner layout with throw stubs.
Shared assembly helper: `../scaffold.ts`.

Register in `src/lib/api/drivers/index.ts` and flip `status` to `ready` in `registry.ts` only when implemented.
