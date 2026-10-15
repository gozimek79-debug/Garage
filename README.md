# SST Garage Platform Demo

A Dutch-language demo of a multi-tenant garage platform. It combines an online garage website and appointment flow with a staff console for bookings, customers, work orders, estimates, invoices, inventory, used-car leads, and a customer-controlled service passport.

## Run in Replit

The project has two configured workflows:

- Web: `pnpm --filter @workspace/sst-garage-demo run dev`
- API: `pnpm --filter @workspace/api-server run dev`

The API uses the workspace PostgreSQL database. The first non-health API request seeds fictional organizations, staff, customers, vehicles, bookings, work orders, parts, used cars, and shop items. The seed is idempotent; the demo reset endpoint returns it to its initial state.

## Check and update

```sh
pnpm run typecheck
pnpm --filter @workspace/api-server run typecheck
pnpm --filter @workspace/sst-garage-demo run typecheck
pnpm --filter @workspace/api-spec run codegen
pnpm --filter @workspace/db run push
```

After editing `lib/api-spec/openapi.yaml`, regenerate the client and server validation schemas with `pnpm --filter @workspace/api-spec run codegen`.

## Sign-in and roles

Sign-in and sign-up use the configured Clerk tenant. In development, a newly authenticated Clerk identity can be attached to the fictional demo garage. The workspace’s demo role switch is only available when both `NODE_ENV=development` and `ENABLE_DEMO_TOOLS=true`. In production, a user without an explicitly provisioned garage membership receives an access message; automatic membership assignment is intentionally disabled.

## Configuration

See `.env.example` for variable names. Do not commit populated environment files. The app expects PostgreSQL and Clerk configuration at runtime; the serverless deployment also requires an externally reachable PostgreSQL database.

## Vercel

The root `vercel.json` builds the static Vite app and routes `/api/*` to an Express catch-all function. Before deploying:

1. Connect the repository at its workspace root.
2. Configure `DATABASE_URL`, `CLERK_PUBLISHABLE_KEY`, and `CLERK_SECRET_KEY` as Vercel environment variables.
3. Configure `VITE_CLERK_PUBLISHABLE_KEY` and, if used by the Clerk instance, `VITE_CLERK_PROXY_URL` for the build.
4. Use a PostgreSQL service reachable from Vercel and apply the schema through the project’s migration/push process.
5. Provision garage memberships before inviting production users. Keep `ENABLE_DEMO_TOOLS` unset or false.

The Vercel configuration is a deployment entry point, not a completed production launch. No Vercel project, external database, custom domain, or production Clerk membership provisioning has been configured from this workspace.

See [the Vercel runbook](docs/VERCEL.md) for exact build settings, database initialization, owner provisioning, and smoke checks.

## Demo boundaries

RDW/VWE lookups, payments, email/SMS delivery, accounting, and the website widgets are represented by local demo adapters. Checkout records a fictional order and never charges a payment method. See [integrations](docs/INTEGRATIONS.md) and [the roadmap](docs/FUTURE-ROADMAP.md).

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Domain model](docs/DOMAIN-MODEL.md)
- [Demo flows](docs/DEMO-FLOWS.md)
- [Integrations](docs/INTEGRATIONS.md)
- [Future roadmap and known limits](docs/FUTURE-ROADMAP.md)
