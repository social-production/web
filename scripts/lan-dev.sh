#!/usr/bin/env bash
# Start Social Production for testing on your local Wi-Fi network.
# Detects this machine's LAN IP at runtime — nothing personal is stored in this file.
set -euo pipefail

WEB_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_DIR="$(cd "$WEB_DIR/../web-backend" && pwd)"
ENV_FILE="$WEB_DIR/.env.local"
FRONTEND_PORT="${FRONTEND_PORT:-5173}"
BACKEND_PORT="${BACKEND_PORT:-8000}"

detect_lan_ip() {
  local ip=""

  if command -v ip >/dev/null 2>&1; then
    ip="$(ip -4 route get 1.1.1.1 2>/dev/null | awk '{for (i = 1; i <= NF; i++) if ($i == "src") { print $(i + 1); exit }}')"
  fi

  if [ -z "$ip" ] && command -v hostname >/dev/null 2>&1; then
    ip="$(hostname -I 2>/dev/null | awk '{print $1}')"
  fi

  if [ -z "$ip" ]; then
    echo "Could not detect a LAN IP address on this machine." >&2
    echo "Set it manually and run again, for example:" >&2
    echo "  LAN_IP=192.168.1.50 $0" >&2
    exit 1
  fi

  echo "$ip"
}

LAN_IP="${LAN_IP:-$(detect_lan_ip)}"
FRONTEND_ORIGIN="http://${LAN_IP}:${FRONTEND_PORT}"
API_URL="http://${LAN_IP}:${BACKEND_PORT}"
CORS_ORIGINS="http://localhost:${FRONTEND_PORT},${FRONTEND_ORIGIN}"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is required. Install Docker, then run this script again." >&2
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "Node.js and npm are required. Install Node 18+, then run this script again." >&2
  exit 1
fi

if [ ! -d "$BACKEND_DIR" ]; then
  echo "Expected backend at: $BACKEND_DIR" >&2
  exit 1
fi

cat >"$ENV_FILE" <<EOF
VITE_BACKEND=fastapi
VITE_USE_DEV_PROXY=true
VITE_LAN_HMR_HOST=${LAN_IP}
VITE_DEV_PORT=${FRONTEND_PORT}
EOF

echo "Writing frontend config to .env.local (gitignored)"
echo "  LAN URL: ${FRONTEND_ORIGIN}"
echo "  API: proxied through the frontend (testers only need port ${FRONTEND_PORT})"
echo ""
echo "Starting backend (Docker)..."
(
  cd "$BACKEND_DIR"
  export CORS_ORIGINS
  docker compose up -d --build
)

echo "Waiting for backend health check..."
ready=0
for _ in $(seq 1 45); do
  if curl -fsS "http://127.0.0.1:${BACKEND_PORT}/healthz" >/dev/null 2>&1; then
    ready=1
    break
  fi
  sleep 2
done

if [ "$ready" -ne 1 ]; then
  echo "Backend did not become ready in time." >&2
  echo "Check logs: cd web-backend && docker compose logs -f backend" >&2
  exit 1
fi

cd "$WEB_DIR"

if [ ! -d node_modules ]; then
  echo "Installing frontend dependencies..."
  npm install
fi

cat <<EOF

============================================================
  Social Production is running on your local network.

  Share this link with people on the same Wi-Fi:
    ${FRONTEND_ORIGIN}

  On this computer you can also use:
    http://localhost:${FRONTEND_PORT}

  API docs (this computer):
    http://localhost:${BACKEND_PORT}/docs

  Stop the frontend:  Ctrl+C in this terminal
  Stop the backend:   cd web-backend && docker compose down

  If others cannot connect, run: ./scripts/lan-diagnose.sh

  Common fixes:
  - Share http://${LAN_IP}:${FRONTEND_PORT} only (not 172.17.x or 172.18.x)
  - Disable router "AP/client isolation" or avoid guest Wi-Fi
  - Try a phone hotspot if your router blocks device-to-device traffic
  - Firewall: see web/README.md (LAN section)
============================================================

EOF

exec npm run dev:lan -- --port "$FRONTEND_PORT"
