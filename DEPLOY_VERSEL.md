# Deploying on Vercel

This project is a **Vite + React + TypeScript SPA** and is ready for direct Vercel import.

## Vercel project settings

- **Framework Preset:** Vite
- **Install Command:** `npm ci` (auto-detected from `package-lock.json`)
- **Build Command:** `npm run build`
- **Output Directory:** `dist`

## SPA routing

Client-side routes are handled by `vercel.json` rewrite rules:

- all paths rewrite to `/index.html`
- deep links (for example `/draft`) load correctly

## Environment variables

- Copy `.env.example` to `.env` for local development.
- No secrets are committed.
- `NODE_ENV` is optional for local usage.
- `PORT` is local/dev-only and ignored by Vercel static hosting.

## Save recovery / reset flow

The app validates checksums for persisted UI save state.

- If a checksum mismatch is detected, the corrupted save is cleared.
- The app shows a recovery banner with **Reset Save**.
- **Reset Save** always clears persisted state and returns the app to the Hub route.
