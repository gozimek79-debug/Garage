# SST Garage Platform Demo

An interactive Dutch workshop-management demo with a public garage site, customer portal, and tenant-scoped staff workspace.

## Run & verify

- `pnpm --filter @workspace/api-server run dev` — run the Express API.
- `pnpm --filter @workspace/sst-garage-demo run dev` — run the Vite app.
- `pnpm run typecheck` — check shared libraries and artifact packages.
- `pnpm --filter @workspace/api-spec run codegen` — regenerate Zod schemas and React Query hooks from `lib/api-spec/openapi.yaml`.
- `pnpm --filter @workspace/db run push` — apply the Drizzle schema to the development PostgreSQL database.

Required runtime configuration: `DATABASE_URL`, `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, and `SESSION_SECRET`. The browser also needs `VITE_CLERK_PUBLISHABLE_KEY`; `VITE_CLERK_PROXY_URL` is optional and depends on the Clerk deployment.

`ENABLE_DEMO_TOOLS=true` only enables role switching and reset when `NODE_ENV=development`. Never enable it in a production deployment.

## Source of truth

- API contract: `lib/api-spec/openapi.yaml`.
- Database schema: `lib/db/src/schema/`.
- API implementation and demo seed: `artifacts/api-server/src/`.
- Web application: `artifacts/sst-garage-demo/src/`.
- Operational and deployment notes: `README.md` and `docs/`.

## Product constraints

- Every garage record is scoped to an organization and location.
- Only the price-free technical passport is portable between garages; estimates, invoices, margins, and internal notes remain tenant-private.
- RDW, checkout, notifications, and website widgets are demo adapters. They do not call live providers or move real money.
- Production sign-ups are not automatically assigned to a garage. The demo-only role tools must stay disabled outside development.
