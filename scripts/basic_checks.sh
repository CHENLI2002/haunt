#!/bin/bash
#
# Basic checks for the project.
#
# Usage:
#   ./scripts/basic_checks.sh [level]
#
# The optional [level] argument decides how far to go (default: 0):
#
#   0  Compile verification (no Docker / Supabase needed)
#        pnpm typecheck   -> 5/5 packages pass = whole project compiles
#
#   1  Web runs (no Docker / Supabase needed)
#        pnpm --filter web dev   -> open http://localhost:3000
#        Expected: landing page "Haunt / Follow a venue. See who plays next."
#        Note: /venue/<slug> and /sitemap.xml will error until Supabase is
#        connected (B2~B4) — that is normal, the landing page is enough to
#        prove the project runs.
#
#   2  Mobile runs (needs a simulator or a phone)
#        pnpm --filter mobile dev
#
# Each level includes the work of lower levels first.

set -euo pipefail

LEVEL="${1:-0}"

case "$LEVEL" in
  0|1|2) ;;
  *)
    echo "Error: invalid level '$LEVEL'. Expected 0, 1, or 2." >&2
    echo "Usage: $0 [0|1|2]" >&2
    exit 1
    ;;
esac

cd "$(dirname "$0")/.."


if [ "$LEVEL" -eq 0 ]; then
  # Level 0 — compilation verification
  echo "==> Level 0: pnpm typecheck"
  pnpm typecheck
elif [ "$LEVEL" -eq 1 ]; then
  # Level 1 — web app (landing page at http://localhost:3000)
  echo "==> Level 1: pnpm --filter web dev"
  echo "    Open http://localhost:3000 — expect the landing page."
  pnpm --filter web dev
else
  # Level 2 — mobile app (needs a simulator or a phone)
  echo "==> Level 2: pnpm --filter mobile dev"
  pnpm --filter mobile dev
fi
