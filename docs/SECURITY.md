# Frontend security checklist

Trusted-beta posture for the SvelteKit PWA. Backend details: [web-backend/docs/SECURITY.md](https://github.com/social-production/web-backend/blob/main/docs/SECURITY.md).

## Session model

| Item | Status |
|------|--------|
| JWT not stored in `localStorage` | Done |
| API calls use `credentials: 'include'` | Done |
| CSRF token sent on mutating requests (`X-CSRF-Token`) | Done |
| Session recovery via `/auth/refresh` on 401 | Done |
| Client route guards are UX-only; API is authoritative | By design |

## Edge headers (`src/hooks.server.ts`)

| Header | Status |
|--------|--------|
| `X-Content-Type-Options: nosniff` | Done |
| `X-Frame-Options: DENY` | Done |
| `Referrer-Policy` | Done |
| `Permissions-Policy` | Done |
| `Strict-Transport-Security` (HTTPS) | Done |
| `Content-Security-Policy` (permissive baseline) | Done |

## Adapter boundary

Routes should call `$lib/services/queries` and `$lib/services/commands`, not raw `fetch` or driver internals. See [ADAPTER_AUDIT.md](./ADAPTER_AUDIT.md) and [BACKEND_DRIVER_GUIDE.md](./BACKEND_DRIVER_GUIDE.md).

## Deferred (public launch)

- Tighter CSP (remove `unsafe-inline` once feasible)
- Custom domain + edge WAF
- Playwright E2E against staging/beta URL in CI
