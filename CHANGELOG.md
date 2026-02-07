# Changelog

## Bugfix
- Updated Vite server configuration to honor runtime `PORT` with a safe fallback to `3000`, preventing hardcoded-port deployment failures.

## Config
- Added `.replit` with deterministic run/deployment commands.
- Added `.env.example` documenting required runtime variables.
- Added `.gitignore` to exclude `node_modules`, build artifacts, and `.env` secrets.
- Added `package-lock.json` for reproducible installs.
- Added `start`, `start:prod`, and hardened `preview` scripts for production-style execution.

## Security
- Enforced env-driven runtime configuration and excluded secret-bearing `.env` files from version control.

## DX
- Added `smoke` script to validate build + preview + HTTP response in one command.
- Added `RELEASE.md` with exact Replit upload/run/publish steps.
