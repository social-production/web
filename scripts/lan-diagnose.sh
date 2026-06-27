#!/usr/bin/env bash
# Quick LAN connectivity checks for Social Production dev mode.
set -euo pipefail

WEB_DIR="$(cd "$(dirname "$0")/.." && pwd)"
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

  echo "$ip"
}

LAN_IP="${LAN_IP:-$(detect_lan_ip)}"

echo "Social Production — LAN diagnostics"
echo "==================================="
echo ""

if [ -z "$LAN_IP" ]; then
  echo "Could not detect a Wi-Fi/LAN IP on this machine."
  exit 1
fi

echo "Share this URL with testers (Wi-Fi IP only):"
echo "  http://${LAN_IP}:${FRONTEND_PORT}"
echo ""
echo "Do NOT share Docker bridge addresses such as 172.17.x.x or 172.18.x.x."
echo ""

echo "Network interfaces (IPv4):"
ip -4 -o addr show scope global 2>/dev/null | awk '{print "  " $2 " -> " $4}' || true
echo ""

echo "Listening ports:"
if command -v ss >/dev/null 2>&1; then
  ss -tlnp 2>/dev/null | grep -E ":${FRONTEND_PORT}|:${BACKEND_PORT}" || echo "  (frontend/backend not listening — is lan-dev.sh running?)"
else
  echo "  ss not available"
fi
echo ""

echo "Local reachability from this computer:"
for url in \
  "http://127.0.0.1:${FRONTEND_PORT}/" \
  "http://${LAN_IP}:${FRONTEND_PORT}/" \
  "http://127.0.0.1:${BACKEND_PORT}/healthz" \
  "http://${LAN_IP}:${BACKEND_PORT}/healthz"
do
  if curl -fsS --connect-timeout 2 "$url" >/dev/null 2>&1; then
    echo "  OK  $url"
  else
    echo "  FAIL $url"
  fi
done
echo ""

if command -v firewall-cmd >/dev/null 2>&1; then
  echo "Firewalld active zones:"
  firewall-cmd --get-active-zones 2>/dev/null || true
  echo ""
fi

echo "On another device (phone/laptop, same Wi-Fi), try:"
echo "  1. ping ${LAN_IP}"
echo "  2. open http://${LAN_IP}:${FRONTEND_PORT}"
echo ""
echo "If ping fails or the browser times out:"
echo "  - Your router may have client/AP isolation (devices cannot see each other)."
echo "  - Guest Wi-Fi often blocks this. Use the main home network."
echo "  - Workaround: phone hotspot → connect your PC + testers to the hotspot."
echo ""
echo "If the page loads but data is empty, restart with:"
echo "  cd \"$WEB_DIR\" && ./scripts/lan-dev.sh"
echo ""
