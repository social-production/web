# Social Production: web

The website for Social Production, built with SvelteKit. It talks to the API in [web-backend](https://github.com/social-production/web-backend).

- Live site: https://web-production-885ec.up.railway.app
- API: https://web-backend-production-dd75.up.railway.app

## Run it locally

You need Node.js 22+ and Docker.

```bash
cp .env.example .env.local
npm install
npm run dev
```

`npm run dev` starts the backend in Docker (from `../web-backend`) if it isn't already running, then the site at http://localhost:5173. The backend seeds a demo account on first start: `victoria-demo` / `victoria-demo-dev`.

Already running the backend yourself? Use `npm run dev:vite` to start only the site.

Settings live in `.env.local`. The defaults work locally; the file explains each switch (signup, captcha, PWA).

## Checks

```bash
npm run smoke                        # type check + production build (what CI runs)
npx vitest run                       # unit tests
bash scripts/check-route-boundary.sh # pages must use services, not call the API directly
```

## How the code is laid out

Pages call `src/lib/services/{queries,commands}`, which go through one adapter to the FastAPI driver in `src/lib/api/drivers/fastapi/`. Nothing else talks to the API, so the backend can be swapped later (a peer-to-peer rebuild is under way in [app](https://github.com/social-production/app)). More in [docs/FRONTEND_ARCHITECTURE.md](docs/FRONTEND_ARCHITECTURE.md).

## Deploy

Pushing to `main` redeploys on Railway. When the site needs new API fields, push the backend first and wait for its `/readyz` to return 200. See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Testing on phones over Wi-Fi

`./scripts/lan-dev.sh` serves the site on your local network and prints a `192.168.x.x` link to share. If other devices can't connect, run `./scripts/lan-diagnose.sh`. Dev settings only, so use a network you trust.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Feedback sent from the site's Feedback button becomes a GitHub issue in this repo.
