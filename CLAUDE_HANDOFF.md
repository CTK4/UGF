# Claude Handoff — UGF Coach RPG (Replit/Vite/TS/PWA)

## Goal
Finish/debug the app so it runs cleanly on Replit and supports a playable MVP (staff hiring + weekly advance + persistent single save) with a cleaner UI.

## What you are receiving
A **single Vite + React + TypeScript** project.

Key architecture constraints (locked)
- **Domain E** is the only writer of canonical save state (IndexedDB) and enforces:
  - WAL closed
  - Event hash chain
  - Checksum chain (meta.checksum / meta.prevChecksum)
  - `load(saveId)` verifies and throws on corruption
- **checkpointId == stateHash == meta.checksum**
- UI is allowed to persist UX state in localStorage (non-canonical).

## Current known issue to fix
Users may see: **"Save verification failed: State checksum mismatch"**.

Likely causes
- Any persistence write that happens without `createCheckpoint()` first.

Where to check
- `src/app/enginePortImpl.ts`
  - All mutations to `mem.save` must call Domain E checkpoint+save.
- `src/domainE/persistence/*`

## Replit hosting constraints
- Vite must allow the Replit hostname via `server.allowedHosts` in `vite.config.ts`.

## What to build next
### MVP1 (must)
- Hub shows actions:
  - Refresh Hub
  - Advance Week (demo)
  - Open Staff / Hire market (OC/DC)
- Staff market:
  - deterministic candidate session per week
  - explicit refresh creates new session rN
  - availability is derived from active employment, no rerolls on click
- Persistence:
  - single save id
  - loads on boot, creates new save if missing

### MVP2 (nice)
- Better UI styling (cards, spacing)
- Phone inbox/thread (simple)
- Read canonical rosters/contracts from `UGF_2026_Rosters_v12.1.xlsx` at startup (can be parsed client-side)

## File map (start here)
- App shell: `src/app/App.tsx`
- Engine facade for UI: `src/app/enginePortImpl.ts`
- Canonical persistence: `src/domainE/persistence/*`
- UI types: `src/ui/engine/types.ts`

## IMPORTANT: how to respond
Claude should:
1) Identify any write paths that call `persistence.save()` without `persistence.createCheckpoint()`.
2) Ensure fresh-save bootstrap always results in a state with a valid `meta.checksum`.
3) Keep changes minimal and compile-safe.

