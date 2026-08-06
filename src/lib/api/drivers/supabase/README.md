# Supabase driver package

Status: **unimplemented scaffold** (registry status stays `unimplemented`).

Live deploys continue to use `VITE_BACKEND=fastapi`.

## Layout

- `client.ts` — Supabase JS client / BFF HTTP placeholder
- `sessionTransport.ts` / `errorTransport.ts` — auth/error seams
- `domains/*` — one file per required domain (throw stubs)
- `index.ts` — assembles `AppAdapter` from domain modules

## Fill order when implementing

1. `client.ts`
2. `sessionTransport.ts` + `errorTransport.ts`
3. `domains/auth.ts` + `domains/bootstrap.ts`
4. Remaining domains against `web-supabase`
5. Flip registry `status` to `ready`
