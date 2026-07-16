#!/usr/bin/env bash
set -euo pipefail

if rg -n "from '\\\$lib/api/drivers/fastapi/(client|auth)'" src/routes --glob '*.{ts,svelte}'; then
  echo "Route files must not import FastAPI driver internals. Use \\\$lib/services/queries, commands, errors, or session."
  exit 1
fi

echo "Route adapter boundary check passed."
