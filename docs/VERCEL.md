# Vercel demo deployment

This runbook launches the fictional Garage demo, not a live workshop service.

## Project

Import `gozimek79-debug/Garage` into the intended Vercel team. Use the repository root (leave Root Directory empty), Framework Preset **Other**, Node.js **24.x**. The root `vercel.json` supplies:

- Install: `pnpm install --frozen-lockfile` (pnpm version is pinned in `package.json`).
- Build: `pnpm run build:vercel`.
- Static output: `artifacts/sst-garage-demo/dist/public`.
- API: `api/[...path].ts` exports Express without starting a listener.

The SPA fallback excludes `/api` so backend requests cannot become `index.html`. A missing API endpoint returns JSON once the database is available.

## Environment

Set these values directly in Vercel; never put populated secrets in Git or chat:

| Variable | Where | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Server runtime and operator database commands | External PostgreSQL, preferably a pooled endpoint near the function region. Follow the provider's TLS connection instructions. |
| `CLERK_PUBLISHABLE_KEY` | Server runtime | Clerk instance publishable key. |
| `CLERK_SECRET_KEY` | Server runtime | Secret key for the same Clerk instance. |
| `VITE_CLERK_PUBLISHABLE_KEY` | Browser build | The same publishable key. It is intentionally public. |

For standard Clerk on Vercel, leave `CLERK_PROXY_ENABLED` false/unset and `VITE_CLERK_PROXY_URL` empty. The Replit-specific proxy is not enabled automatically on Vercel. If deliberately using a configured custom proxy, set `CLERK_PROXY_ENABLED=true` and the matching `VITE_CLERK_PROXY_URL` in the browser build; use a supported Clerk production proxy configuration.

`SESSION_SECRET` is not read by this application and is not required. `PORT` and `BASE_PATH` default to `3000` and `/` for the Vite build. Do not override `NODE_ENV` on Vercel. Keep `ENABLE_DEMO_TOOLS=false`; role switching/reset and automatic owner assignment remain disabled in production.

Use a separate demo database. Preview and Production must have their own intentional configuration; do not point arbitrary preview branches at a real customer database. In Clerk, configure the deployed application URL, allowed origins and redirect URLs for the chosen instance. A publishable key embedded during a build requires rebuilding after it changes.

## Initialize the database and first owner

Run these commands locally from the repository root with `DATABASE_URL` supplied securely in the shell environment. Review schema changes before accepting the interactive push. Never run `push-force` against an existing database.

```sh
pnpm install --frozen-lockfile
pnpm --filter @workspace/db run push
pnpm --filter @workspace/db run seed:demo
```

The seed inserts fictional data. It does not copy Replit data. The API also checks/seeds demo data before non-health requests; do not use this deployment with real customer records. Seeding is currently multi-step rather than a single transactional migration, so initialize it once before accepting traffic.

Create/sign in to the intended Clerk account, copy its `user_...` ID from the Clerk dashboard, and supply these operator-only environment variables:

- `GARAGE_OWNER_CLERK_USER_ID`
- `GARAGE_OWNER_NAME`
- `GARAGE_OWNER_EMAIL`

Then run:

```sh
pnpm --filter @workspace/db run provision:demo-owner
```

This inserts one owner membership into the fictional garage. It refuses to alter an existing membership. These three operator variables do not need to be deployed to Vercel. New browser sign-ups do not receive owner privileges automatically. Invitations and customer membership provisioning remain future work.

## Verify a preview before production

1. Build locally with `VITE_CLERK_PUBLISHABLE_KEY` configured: `pnpm run build:vercel` and `pnpm run typecheck`. The frontend build refuses to proceed if that key is absent.
2. Deploy the reviewed branch to Preview with its configured database and Clerk keys.
3. `GET /api/healthz`: JSON `{ "status": "ok" }`, not HTML. This is liveness only, not a database/Clerk connectivity check.
4. Open `/`, reload `/services` and `/sign-in`; check JavaScript/CSS/image requests.
5. Open `/api/services` and a nonexistent `/api/...` path; confirm JSON responses and correct HTTP status codes.
6. Sign in with the provisioned owner; verify `/api/demo/session`, dashboard and persisted booking/work-order changes.
7. Sign in with an unprovisioned identity; confirm workspace access is denied. Production role-switch/reset requests must remain unavailable.
8. Review deployment/runtime logs, then promote the verified deployment using production configuration.

External RDW, payments, messaging and accounting remain demo adapters. No real payment is collected.
