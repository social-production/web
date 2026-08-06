# Holochain driver package

Status: **unimplemented scaffold** (registry status stays `unimplemented`).

This is a **long-horizon redesign track**, not a transport-only swap.

## Layout

Same shape as Supabase/FastAPI:

- `client.ts`
- `sessionTransport.ts` / `errorTransport.ts`
- `domains/*`
- `index.ts`

## Guidance

- Reuse `AppAdapter` and `$lib/types/*` where product semantics stay universal.
- Keep `centralizedOnly` capabilities unsupported until feeds, moderation electorates, and messaging are redesigned.
- Prefer documenting redesign areas in `web-holochain` over premature domain implementations.
