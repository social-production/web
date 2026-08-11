# Supabase driver package

Status: **ready** (registry `status: 'ready'`).

Talks to the `web-supabase` Edge Function `gateway` plus Supabase Auth.

Live production may still use `VITE_BACKEND=fastapi` until hosted Supabase signoff is green. Local development can use either backend.

## Layout

- `client.ts` — gateway HTTP client (JWT bearer)
- `sessionTransport.ts` / `errorTransport.ts` — auth/error seams (`localStorage` JWT session)
- `domains/*` — one file per required domain (real gateway routes)
- `mappers/*` — response shaping for feeds/profile/detail
- `index.ts` — assembles `AppAdapter` from domain modules

## Contract tests

`domains.contract.test.ts` asserts the driver hits the gateway paths the UI expects, including lifecycle action aliases (`plans/overall-vote`, `phase-change/vote`, …) and group chat `memberUsernames`.

## Docs

- Local: `web-supabase/docs/LOCAL_DEV.md`
- Hosted: `web-supabase/docs/HOSTED.md`
- Cutover: `web-supabase/docs/CUTOVER.md`
- Parity: `web-supabase/docs/PARITY_AUDIT.md`
