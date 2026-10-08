# Roadmap and known limits

## Production onboarding

The development demo can assign a newly signed-in identity to its fictional garage. Production mode intentionally requires an existing membership, but the app does not yet include invitations, staff provisioning, or organization administration.

## External providers

RDW/VWE, accounting, payment, email/SMS, shipping, and website widget delivery are demo-only. The checkout is not a real payment flow.

## Partner garage experience

The customer consent record and receiving-garage authorization are enforced by the API. A separate partner staff account, vehicle lookup, and history-import workflow still need to be added for a complete two-garage demonstration.

## Production verification

The Replit workflows, API typecheck, client typecheck, and database schema push are the current verification path. Vercel still needs deployment with an external PostgreSQL database, production Clerk settings, and provisioned memberships. Add browser/API integration tests for tenant boundaries, estimate replacement/approval, stock deductions, and grant expiry/revocation before a live release.
