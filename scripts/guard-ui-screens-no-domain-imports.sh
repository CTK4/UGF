#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SCREENS_DIR="$ROOT_DIR/src/ui/screens"

if ! command -v rg >/dev/null 2>&1; then
  echo "ripgrep (rg) is required for this guard." >&2
  exit 1
fi

echo "[guard] Checking UI screens for forbidden imports..."

FORBIDDEN=(
  "@/data/TableRegistry"
  "@/services/"
  "@/bundle/"
  "@/domain"
  "@/domainE/"
  "@/ui/dispatch/actions"
)

FAILED=0
for pat in "${FORBIDDEN[@]}"; do
  if rg -n "$pat" "$SCREENS_DIR" >/dev/null 2>&1; then
    echo
    echo "❌ Forbidden import pattern found: $pat"
    rg -n "$pat" "$SCREENS_DIR" || true
    FAILED=1
  fi
done

if [[ "$FAILED" -eq 1 ]]; then
  echo
  echo "Fix: move data/logic usage into ui.selectors and ui.dispatch only."
  exit 1
fi

echo "✅ OK"
