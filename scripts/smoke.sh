#!/usr/bin/env bash
set -euo pipefail

PORT_VALUE="${PORT:-3000}"

npm run build >/tmp/ugf-smoke-build.log 2>&1
npm run preview >/tmp/ugf-smoke-preview.log 2>&1 &
PREVIEW_PID=$!

cleanup() {
  if kill -0 "$PREVIEW_PID" >/dev/null 2>&1; then
    kill "$PREVIEW_PID" >/dev/null 2>&1 || true
    wait "$PREVIEW_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

sleep 3
curl -fsS "http://127.0.0.1:${PORT_VALUE}/" >/dev/null

echo "Smoke test passed on http://127.0.0.1:${PORT_VALUE}/"
