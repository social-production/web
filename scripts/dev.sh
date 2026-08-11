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

ensure_supabase_gateway() {
  local anon_key functions_url health_url line
  anon_key=""
  functions_url="http://127.0.0.1:54321/functions/v1"
  if [ -f "$WEB_DIR/.env.local" ]; then
    line="$(grep -E '^[[:space:]]*VITE_SUPABASE_ANON_KEY=' "$WEB_DIR/.env.local" | tail -n 1 || true)"
    if [ -n "$line" ]; then
      anon_key="${line#*=}"
      anon_key="${anon_key%\"}"
      anon_key="${anon_key#\"}"
      anon_key="${anon_key%\'}"
      anon_key="${anon_key#\'}"
    fi
    line="$(grep -E '^[[:space:]]*VITE_SUPABASE_FUNCTIONS_URL=' "$WEB_DIR/.env.local" | tail -n 1 || true)"
    if [ -n "$line" ]; then
      functions_url="${line#*=}"
      functions_url="${functions_url%\"}"
      functions_url="${functions_url#\"}"
      functions_url="${functions_url%\'}"
      functions_url="${functions_url#\'}"
      functions_url="${functions_url%/}"
    fi
  fi
  if [ -z "$anon_key" ]; then
    cat >&2 <<EOF
VITE_BACKEND=supabase but VITE_SUPABASE_ANON_KEY is missing from web/.env.local.

Copy the Supabase block from web-supabase/docs/LOCAL_DEV.md into web/.env.local, then restart.
EOF
    exit 1
  fi
  health_url="${functions_url}/gateway/healthz"
  echo "Checking Supabase gateway at ${health_url}..."
  if curl -fsS \
    -H "apikey: ${anon_key}" \
    -H "Authorization: Bearer ${anon_key}" \
    "$health_url" >/dev/null 2>&1; then
    echo "Supabase gateway is ready."
    return 0
  fi
  cat >&2 <<EOF
Supabase gateway is not reachable at ${health_url}.

The browser will show 503 until Terminal 2 is running:

  cd web-supabase
  # create .env.local first (see LOCAL_DEV.md)
  npm run functions:serve

Also confirm Docker Supabase is up:

  cd web-supabase && npm run start

Open only http://localhost:5173 (not 127.0.0.1 or a LAN IP).
EOF
  exit 1
}

VITE_BACKEND_VALUE="$(read_vite_backend)"
case "$VITE_BACKEND_VALUE" in
  supabase)
    echo "VITE_BACKEND=supabase — skipping FastAPI startup."
    ensure_supabase_gateway
    ;;
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
