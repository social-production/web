#!/usr/bin/env bash
# Run the Vite dev server. Starts FastAPI only when VITE_BACKEND=fastapi (default).
set -euo pipefail

WEB_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_DIR="$(cd "$WEB_DIR/../web-backend" && pwd)"
BACKEND_PORT="${BACKEND_PORT:-8000}"
FRONTEND_PORT="${FRONTEND_PORT:-5173}"
HEALTH_URL="http://127.0.0.1:${BACKEND_PORT}/healthz"

read_vite_backend() {
  local backend="fastapi"
  if [ -f "$WEB_DIR/.env.local" ]; then
    local line
    line="$(grep -E '^[[:space:]]*VITE_BACKEND=' "$WEB_DIR/.env.local" | tail -n 1 || true)"
    if [ -n "$line" ]; then
      backend="${line#*=}"
      backend="${backend%\"}"
      backend="${backend#\"}"
      backend="${backend%\'}"
      backend="${backend#\'}"
    fi
  fi
  printf '%s' "$backend"
}

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

ensure_fastapi() {
  if backend_ready; then
    echo "FastAPI already running at http://127.0.0.1:${BACKEND_PORT}."
    return 0
  fi

  if command -v docker >/dev/null 2>&1 && [ -f "$BACKEND_DIR/docker-compose.yml" ]; then
    echo "FastAPI is not running. Starting Docker stack in web-backend..."
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
    return 0
  fi

  cat >&2 <<EOF
FastAPI is not reachable at http://127.0.0.1:${BACKEND_PORT}.

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
}

if [ ! -f "$WEB_DIR/.env.local" ] && [ -f "$WEB_DIR/.env.example" ]; then
  echo "Creating .env.local from .env.example..."
  cp "$WEB_DIR/.env.example" "$WEB_DIR/.env.local"
fi

VITE_BACKEND_VALUE="$(read_vite_backend)"
case "$VITE_BACKEND_VALUE" in
  holochain|template)
    echo "VITE_BACKEND=${VITE_BACKEND_VALUE} — skipping FastAPI startup."
    echo "Ensure the matching backend is already running."
    ;;
  *)
    ensure_fastapi
    ;;
esac

cd "$WEB_DIR"

if [ ! -d node_modules ]; then
  echo "Installing frontend dependencies..."
  npm install
fi

echo "Starting frontend at http://localhost:${FRONTEND_PORT}"
exec npm run dev:vite -- --port "$FRONTEND_PORT"
