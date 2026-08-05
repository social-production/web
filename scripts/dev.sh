#!/usr/bin/env bash
# Start the FastAPI backend (Docker) if needed, then run the Vite dev server.
set -euo pipefail

WEB_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_DIR="$(cd "$WEB_DIR/../web-backend" && pwd)"
BACKEND_PORT="${BACKEND_PORT:-8000}"
FRONTEND_PORT="${FRONTEND_PORT:-5173}"
HEALTH_URL="http://127.0.0.1:${BACKEND_PORT}/healthz"

backend_ready() {
  curl -fsS "$HEALTH_URL" >/dev/null 2>&1
}

wait_for_backend() {
  echo "Waiting for backend at ${HEALTH_URL}..."
  for _ in $(seq 1 45); do
    if backend_ready; then
      return 0
    fi
    sleep 2
  done
  return 1
}

if ! backend_ready; then
  if command -v docker >/dev/null 2>&1 && [ -f "$BACKEND_DIR/docker-compose.yml" ]; then
    echo "Backend is not running. Starting Docker stack in web-backend..."
    (
      cd "$BACKEND_DIR"
      docker compose up -d --build
    )
    if ! wait_for_backend; then
      echo "Backend did not become ready in time." >&2
      echo "Check logs: cd web-backend && docker compose logs -f backend" >&2
      exit 1
    fi
    echo "Backend is ready."
  else
    cat >&2 <<EOF
Backend is not reachable at http://127.0.0.1:${BACKEND_PORT}.

Start it in another terminal:

  cd web-backend
  docker compose up -d --build

Or, without Docker:

  cd web-backend
  source .venv/bin/activate
  uvicorn app.main:app --host 0.0.0.0 --port ${BACKEND_PORT} --reload

Then run npm run dev again.
EOF
    exit 1
  fi
else
  echo "Backend already running at http://127.0.0.1:${BACKEND_PORT}."
fi

if [ ! -f "$WEB_DIR/.env.local" ] && [ -f "$WEB_DIR/.env.example" ]; then
  echo "Creating .env.local from .env.example..."
  cp "$WEB_DIR/.env.example" "$WEB_DIR/.env.local"
fi

cd "$WEB_DIR"

if [ ! -d node_modules ]; then
  echo "Installing frontend dependencies..."
  npm install
fi

echo "Starting frontend at http://localhost:${FRONTEND_PORT}"
exec npm run dev:vite -- --port "$FRONTEND_PORT"
