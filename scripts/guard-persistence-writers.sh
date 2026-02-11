#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-src}"
ALLOW_PREFIX="src/domainE/persistence/"

echo "Guard: forbidding direct IndexedDB/localStorage writes outside ${ALLOW_PREFIX}"

fail() { echo ""; echo "FAIL: $1"; echo ""; exit 1; }

# Use ripgrep if available, else grep -R
scan() {
  if command -v rg >/dev/null 2>&1; then
    rg -n --hidden --glob '!**/node_modules/**' "$1" "$ROOT" || true
  else
    grep -RIn --exclude-dir=node_modules -E "$1" "$ROOT" || true
  fi
}

IDB_HITS="$(scan 'indexedDB\.open\(|\.transaction\(|objectStore\(')"
if [[ -n "$IDB_HITS" ]]; then
  BAD_IDB="$(printf "%s\n" "$IDB_HITS" | grep -v "^${ALLOW_PREFIX}" || true)"
  if [[ -n "$BAD_IDB" ]]; then
    echo "$BAD_IDB"
    fail "Direct IndexedDB usage found outside Domain E persistence."
  fi
fi

LS_HITS="$(scan 'localStorage\.setItem\(')"
if [[ -n "$LS_HITS" ]]; then
  BAD_LS="$(printf "%s\n" "$LS_HITS" | grep -v "^${ALLOW_PREFIX}" || true)"
  if [[ -n "$BAD_LS" ]]; then
    echo "$BAD_LS"
    fail "localStorage.setItem found outside Domain E persistence."
  fi
fi

echo "OK: no direct persistence writers found outside Domain E."
