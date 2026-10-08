# Domain model

## Garage tenancy

- **Organization** — a garage company and the root tenant boundary.
- **Location** — a branch within an organization; staff can be scoped to a location.
- **User / employee** — a Clerk identity mapped to a garage role, branch, and optional customer record.

## Workshop operations

- **Customer** owns or is associated with one or more **vehicles**.
- **Booking** connects customer, vehicle, service, location, and schedule/resource.
- **Work order** begins when a booking is received. It contains complaint, diagnosis, internal work lines, and status.
- **Estimate** snapshots line items and Dutch VAT; a customer response approves, declines, or requests contact.
- **Invoice** and **commercial record** remain in the originating garage’s tenant and are not portable.
- **Inventory item** is tenant stock. Part use is validated against stock when a work order is completed.

## Portable service passport

- **Portable service record** stores technical date, mileage, work, parts, fluids, result, and garage attribution without prices or private notes.
- **History grant** records the vehicle owner’s consent, receiving organization, scope, expiry, use, and revocation.
- Cross-garage reads return published portable records only. The API never joins invoices or commercial notes into this response.

## Commerce and used vehicles

- **Used vehicle lead** captures an enquiry about a listed vehicle.
- **Shop product / demo order** supports a fictional local checkout. It is not a live payment or shipping integration.
- **Notification / audit event** records operational updates and material actions.
