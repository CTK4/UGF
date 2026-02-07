# Release Guide (Replit)

## 1) Upload to Replit
1. Create a new **Node.js Repl**.
2. Upload the project contents from this folder into the repl root.
3. Confirm `.replit` is present.

## 2) Configure environment variables
In Replit **Secrets** (or environment settings), set:
- `NODE_ENV=production`
- `PORT` is optional (Replit usually injects this automatically)

Use `.env.example` as the template for local `.env` files. Do not commit secrets.

## 3) Install and run
Single-command run (same as Replit Run button):

```bash
npm run start
```

This command performs a production build and then serves it on `0.0.0.0:$PORT`.

## 4) Publish
1. Click **Deploy** / **Publish** in Replit.
2. Deployment command should be:

```bash
npm ci && npm run start
```

3. Wait for health status and open the deployment URL.

## 5) Smoke test checklist
After startup, verify:
- `GET /` returns HTTP 200.
- App UI loads and shows `UGF Coach RPG`.
- `Advance Week (demo)` executes without runtime errors.

## Local parity commands
```bash
npm ci
npm run smoke
```
