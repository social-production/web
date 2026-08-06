#!/usr/bin/env bash
set -euo pipefail

# Routes must not import FastAPI driver internals.
if rg -n "from '\\\$lib/api/drivers/fastapi/(client|auth)'" src/routes --glob '*.{ts,svelte}'; then
  echo "Route files must not import FastAPI driver internals. Use \\\$lib/services/queries, commands, errors, or session."
  exit 1
fi

# Features, utils, and service facades must not import FastAPI driver internals.
# Only src/lib/api/drivers/** may use driver-specific modules.
forbidden_paths=(src/lib/features src/lib/utils src/lib/services src/routes)
for path in "${forbidden_paths[@]}"; do
  if rg -n "from '\\\$lib/api/drivers/fastapi/" "$path" --glob '*.{ts,svelte}' \
    | rg -v "src/lib/api/drivers/"; then
    echo "Files outside src/lib/api/drivers must not import FastAPI driver internals."
    echo "Use \\\$lib/services/queries, commands, errors, session, or governanceEntityRegistry."
    exit 1
  fi
done

echo "Route adapter boundary check passed."
