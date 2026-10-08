# Integrations

## Implemented demo adapters

- **Vehicle registration lookup** returns fictional RDW-like vehicle details and does not call RDW.
- **Parts checkout** validates stock and writes a demo order in a transaction; there is no payment, shipment, or refund.
- **Used-car enquiry** stores a demo lead; no email or CRM message is sent.
- **Website widgets** are represented as integration cards; they do not issue an embeddable production script.
- **Notifications** are stored in the application database; email and SMS delivery are not configured.

## Production adapters still required

Before real garages can use this platform, choose and configure providers for vehicle data, accounting/invoicing, payments and refunds, transactional email/SMS, and any external website embeds. Keep provider credentials in the deployment secrets store and keep their events tenant-scoped and auditable.

No external service credentials are required to run the current demo.
