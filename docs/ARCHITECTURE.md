# Architecture

## Runtime

- `artifacts/sst-garage-demo` is the React 19/Vite client. It calls the API through same-origin `/api` routes and uses generated React Query hooks.
- `artifacts/api-server` is an Express 5 API. Clerk middleware resolves the authenticated identity; garage membership and tenant role are loaded from the database before protected handlers run.
- `lib/db` defines the PostgreSQL schema with Drizzle.
- `lib/api-spec/openapi.yaml` is the API contract. Orval generates `lib/api-zod` validators/types and `lib/api-client-react` hooks.

Replit runs web and API as separate workflows. At the workspace root, Vercel builds the static web output and routes the catch-all `/api/*` serverless function to the same Express app.

## Authentication and tenant isolation

Clerk identifies the person; `users` maps a Clerk user ID to a garage organization, location, and role. API handlers scope reads and writes by that membership. Development-only demo tools may assign a fictional role, but production identities without a provisioned membership are denied.

Every commercial/workshop record has tenant identifiers. The customer-facing passport is a separate, price-free record set. Access grants authorize only those portable records for a specific receiving garage; revocation, expiry, and one-time use are enforced by the API.

## Demo data and transactions

The API seeds fictional tenants once on the first non-health request. Reset removes seeded tenant data in dependency order and seeds it again. Checkout and completing a work order use database transactions for stock and financial record updates. No payment provider is called.

## Deployment boundary

Vercel needs its own externally reachable PostgreSQL database plus Clerk configuration. The Vercel file does not transfer Replit database contents, provision tenant memberships, or create a Vercel project. Those steps are documented in the root README.
