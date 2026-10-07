# SST — Garage Platform Demo
## Executor Build Task

**Role:** Senior Full-Stack Product Engineer / Software Architect  
**Owner:** CEO — Gregor  
**Technical lead:** CTO — ChatGPT  
**Executor:** Codex  
**Review:** Cursor / Claude  
**Target:** Production-quality interactive DEMO, prepared for later commercial development  
**Deployment target:** Vercel  
**Priority:** HIGH  
**Status:** New product prototype / commercial demonstration

---

# 1. Objective

Build a fully interactive demonstration of a modern garage/workshop management platform intended initially for automotive service businesses in the Netherlands.

This must NOT be a disposable visual mockup.

The demo must:

1. look polished enough to present directly to a real garage owner;
2. demonstrate the full business concept through realistic workflows;
3. use a real, extensible domain model;
4. be architected so the same repository can later evolve into the commercial product;
5. support a future multi-garage / SaaS model;
6. be frontend-agnostic at the Core level;
7. be deployable to Vercel;
8. use mock/demo adapters where real external integrations are not yet available;
9. clearly distinguish DEMO functionality from live external services.

The key architectural principle is:

> **Core first. Frontend replaceable. Integrations replaceable.**

The garage management system must not depend on one website implementation.

---

# 2. Product concept

The platform should ultimately consist of:

- Garage Core
- Workshop Engine
- Booking Engine
- Estimate / Pricing Engine
- Customer Account
- Vehicle Service Passport
- Inventory
- Used Cars / Occasions
- Parts & Accessories Shop
- Notifications
- Billing / Invoicing
- Website Integration Layer
- future Garage Network

For the demo, implement enough of each module to demonstrate how the full ecosystem works.

---

# 3. Demo business

Create one fictional Dutch garage as the default tenant.

Example:

**Van Dijk Auto Service**

Use realistic but completely fictional data.

Location:
Netherlands

Languages for demo:

- Nederlands — primary
- English — secondary

Prepare the internationalization structure so Polish and German can be added later without architectural changes.

Do not use real private business/customer information.

---

# 4. Architecture requirement

The system must be designed from day one for multiple independent garages.

Required hierarchy:

```text
Organization
 └── Location
      ├── Employees
      ├── Customers
      ├── Vehicles
      ├── Bookings
      ├── Work Orders
      ├── Estimates
      ├── Inventory
      ├── Used Vehicles
      └── Sales
```

Relevant records must contain explicit organization/tenant ownership.

At minimum support:

```text
organizationId
locationId
createdAt
updatedAt
createdBy
status
```

where applicable.

Even if the demo contains one garage, the architecture must not assume there will only ever be one.

---

# 5. Technical architecture

Use a modern TypeScript web stack suitable for Vercel.

Preferred structure:

```text
/apps
  /web

/packages
  /core
  /database
  /ui
  /domain
  /integrations
  /config
```

or an equally clean structure if a monorepo would unnecessarily complicate the demo.

Use:

- TypeScript
- React
- Next.js
- responsive UI
- server-side APIs/actions where appropriate
- schema validation
- strict typing
- environment-based configuration

Use current stable versions compatible with Vercel.

Do not lock critical business logic inside React components.

Business logic should live in domain/services modules.

Example:

```text
UI
 ↓
Application/API layer
 ↓
Domain services
 ↓
Repositories
 ↓
Database / adapters
```

---

# 6. Persistence

The demo must persist data.

Do not build a fake frontend whose state disappears on refresh.

Use a database architecture suitable for later production.

Preferred:

PostgreSQL-compatible persistence.

If external database credentials are not available during initial implementation, provide:

- a clean repository abstraction;
- local/demo persistence;
- seed support;
- documented migration path to hosted PostgreSQL.

The final Vercel version must be compatible with external persistent storage.

---

# 7. Authentication and roles

Implement demo authentication.

Required roles:

### Owner
Full access.

### Manager
Workshop, bookings, customers, estimates and reporting.

### Reception
Customers, vehicles, bookings, estimates.

### Mechanic
Assigned jobs, diagnosis, work performed, parts.

### Sales
Used cars and leads.

### Warehouse
Inventory.

For DEMO convenience, provide clearly visible role-switching or prepared demo accounts.

Do not remove authorization boundaries simply because this is a demo.

---

# 8. Main demo dashboard

Create a professional workshop dashboard.

Show:

## Today

- appointments
- vehicles currently in workshop
- vehicles waiting for customer approval
- vehicles ready for collection
- open estimates
- new leads

## Business overview

- today's revenue — demo data
- month revenue — demo data
- workshop utilization
- unpaid invoices
- low-stock parts

Charts may use realistic seeded demo information.

Do not overbuild analytics.

The goal is to make a garage owner understand the value within approximately 60 seconds.

---

# 9. Customer module

Create customer profiles.

Example fields:

```text
name
email
phone
preferredLanguage
address optional
notes
vehicles[]
```

Customer view should show:

- vehicles
- future appointments
- active work orders
- previous service visits
- estimates
- invoices
- Vehicle Service Passport permissions

---

# 10. Vehicle module

Vehicle entity should support:

```text
registrationNumber
VIN optional
make
model
variant
fuelType
year
mileage
APKExpiry
customerId
```

Create several seeded vehicles.

Provide a mocked Dutch license plate lookup.

Example:

User enters:

```text
12-ABC-3
```

Demo adapter responds with vehicle data.

IMPORTANT:

Create an interface such as:

```text
VehicleDataProvider
```

and implement:

```text
MockRDWProvider
```

Do not couple vehicle lookup directly to fake data.

This should later be replaceable with a legitimate RDW/data provider integration.

Display a clear DEMO badge when mock vehicle information is returned.

---

# 11. Booking system

Build an interactive booking flow.

Customer selects:

1. vehicle / registration;
2. service;
3. optional problem description;
4. preferred date/time;
5. contact details;
6. confirmation.

Services should include:

- APK
- Kleine beurt
- Grote beurt
- Olie + filter
- Remmen
- Banden
- Airco
- Diagnose
- Storing
- Overig

Each service should have:

```text
estimatedDuration
basePrice
requiredResourceType
```

Calendar should understand:

- opening hours
- service duration
- mechanics/resources
- workshop bays/lifts

For the demo this scheduling logic may be simplified, but architecture must support real resource scheduling later.

---

# 12. Workshop calendar

Create day/week workshop views.

Support views by:

- booking
- mechanic
- workshop bay / lift

Visual example:

```text
08:00  Golf — APK
09:00  BMW — Brakes
10:30  Transit — Service
```

Allow staff to click a booking and open the job.

Use drag/drop only if stable and useful. Do not prioritize animation over reliability.

---

# 13. Vehicle reception

Booking can become a vehicle reception record.

At reception allow staff to capture:

- mileage
- fuel level optional
- visible damage notes
- customer complaint
- photos placeholder/demo uploads
- additional notes

Then convert booking into:

# Work Order

---

# 14. Work Order

Required lifecycle:

```text
Requested
Confirmed
Vehicle Received
Diagnosis
Waiting for Approval
Approved
In Repair
Ready
Completed
Cancelled
```

Work order screen should include:

- customer
- vehicle
- mileage
- complaint
- diagnosis
- assigned mechanic
- labor entries
- parts
- photos/evidence
- estimate
- status timeline

---

# 15. Diagnosis and estimate

Mechanic should be able to create findings.

Example:

```text
Front brake discs worn
Front pads approximately 15% remaining
Rear brakes OK
```

Generate an estimate from work order data.

Estimate contains:

- labor
- parts
- quantity
- VAT
- totals

Example:

```text
Brake discs       €146
Brake pads         €68
Labour 1.5 h      €112.50
-------------------------
Total              €326.50
```

Use demo EUR values.

Provide a customer-facing estimate screen.

Customer can choose:

```text
Approve
Decline
Contact Garage
```

Store:

```text
decision
decisionTimestamp
```

Create an audit record.

---

# 16. Pricing Engine foundation

Do not hardcode every service price directly into UI components.

Create a basic Pricing Engine.

Concept:

```text
Service
 + Labor
 + Parts
 + Vehicle modifier
 + Optional package
 = Estimate
```

Support packages:

- Economy
- Standard
- Premium

For the demo, seed a limited pricing catalog.

Architecture must allow later dynamic pricing.

---

# 17. Vehicle Service Passport

This is a core differentiating feature.

Every completed Work Order should produce two logically distinct records.

## A. Private Commercial Record

Visible only to the relevant garage/customer relationship.

May contain:

- prices
- invoice
- discounts
- payment details
- internal notes
- commercial information

## B. Portable Service Record

Contains only technical service history.

Example:

```text
vehicle
serviceDate
mileage
serviceType
workPerformed
partsInstalled
partManufacturer
partNumber
fluids
technicalResult
serviceGarage
verificationStatus
```

Must NOT contain:

- labor price
- part price
- invoice totals
- discounts
- payment information
- commercial margins
- private internal notes

This separation must exist in the data/domain model.

Do NOT merely hide price fields in the UI.

---

# 18. Customer-controlled sharing

Customer account must allow the vehicle owner to share the technical service history with another garage.

Demo flow:

```text
My Garage
→ Vehicle
→ Service Passport
→ Share service history
→ Select garage
→ Permission
```

Options:

```text
One-time
30 days
Until revoked
```

Receiving garage can see:

- technical service history
- mileage
- completed service types
- installed parts
- service dates
- garage verification

Receiving garage must NOT see commercial pricing.

Customer can revoke access.

Record:

```text
grantedBy
grantedToOrganization
vehicleId
scope
createdAt
expiresAt
revokedAt
```

Seed a second fictional garage only for demonstrating this permission flow.

---

# 19. Verified service record

Completed service records should display:

```text
Verified Service Record
```

when created by a participating garage.

Historical records are immutable to other garages.

Another garage may:

- read the shared record;
- create its own future service record;
- not edit the previous garage's record.

Prepare append-only/audit-friendly architecture.

---

# 20. Vehicle ownership transfer concept

Implement a simple demo flow showing how a vehicle history could remain with the vehicle after sale while personal/commercial data does not transfer.

Demo:

```text
Transfer Vehicle
```

New owner receives the technical service history.

Do not transfer:

- previous owner's personal data
- invoices
- payment details
- commercial garage records

This feature may be clearly marked as PREVIEW if implementation would overcomplicate the first build.

---

# 21. Inventory

Build basic parts inventory.

Fields:

```text
SKU
EAN optional
OEM/part number
name
brand
purchasePrice
salePrice
VAT
stock
minimumStock
storageLocation
compatibleVehicles optional
```

Mechanic can add inventory parts to a Work Order.

When used:

```text
stock decreases
estimate/work order receives the item
```

Show low-stock alerts.

---

# 22. Parts & accessories shop

Create a customer-facing demo shop.

Categories:

- filters
- oils
- wipers
- lamps
- fluids
- accessories
- maintenance products

Customer can:

- browse
- filter
- view product
- add to cart

A complete payment/order fulfillment system is not required in the first demo.

But architecture should support it later.

Add:

```text
DEMO CHECKOUT
```

rather than pretending a real payment was processed.

---

# 23. Used Cars / Occasions

Build an Occasions module.

Garage can create/edit a used car listing.

Fields:

```text
registration
make
model
variant
year
mileage
fuel
transmission
price
description
features
images
APK
serviceHistoryAvailable
status
```

Public listing page should support:

- browse cars
- vehicle detail
- request test drive
- contact garage
- trade-in inquiry

Example trust badge:

```text
Verified digital service history available
```

---

# 24. Customer portal — My Garage

Create a polished customer portal.

Navigation:

```text
Dashboard
My Vehicles
Appointments
Estimates
Invoices
Service Passport
Orders
Messages
Profile
```

Vehicle page should clearly show:

- vehicle details
- mileage
- next appointment
- APK date
- service recommendations
- service history
- sharing permissions

---

# 25. Website strategy

The Garage Platform Core must not depend on the demo website.

Demonstrate two possible frontend models.

## Model A — Full garage website

Build a polished fictional garage website containing:

```text
Home
Services
Prices
Book Appointment
APK
Occasions
Shop
About
Contact
My Garage
```

This represents the case where SST builds a new website for the garage.

## Model B — Existing Website Integration

Create a separate demo/integration page showing embeddable components such as:

```text
Booking Widget
Used Cars Widget
Customer Login
Service Price Widget
```

This represents a garage keeping its existing website.

The widgets do not need to be distributed as a production NPM package yet.

But architect components/API boundaries so that this can be implemented later.

---

# 26. Garage Web Gateway

Introduce an architectural boundary called:

```text
Garage Web Gateway
```

Responsibilities:

- authentication/session bridge
- public-safe API access
- tenant branding
- booking
- customer portal entry
- widget/API requests
- rate limiting abstraction
- integration boundaries

Concept:

```text
Existing Website
        │
Garage Web Gateway
        │
Garage Platform Core
```

Do not expose internal Core services directly from arbitrary public UI.

---

# 27. White-label support

Tenant configuration should support:

```text
garageName
logo
primaryBrand settings
contact details
domain
languages
openingHours
services
location
```

Avoid deeply hardcoded garage identity.

Create a central tenant branding configuration.

The demo should make it obvious that another garage could receive the same platform under its own branding.

---

# 28. API readiness

Prepare explicit application interfaces for major capabilities.

Examples:

```text
Vehicle lookup
Booking creation
Booking availability
Customer vehicle access
Estimate approval
Inventory
Used cars
Service Passport sharing
```

No requirement to expose a broad unrestricted public API.

Prefer safe capability-specific endpoints.

Document the intended API boundaries.

---

# 29. Integrations architecture

Create adapters/interfaces for future:

- RDW / vehicle data provider
- payment provider / iDEAL
- email
- SMS
- WhatsApp
- parts catalogs
- accounting
- APK provider/RDW workflow

For the demo use mocks.

Example:

```text
PaymentProvider
 └── MockPaymentProvider

VehicleDataProvider
 └── MockRDWProvider

NotificationProvider
 └── DemoNotificationProvider
```

This is mandatory.

External vendor logic must not leak into the domain model.

---

# 30. Notifications

Create a demo notification center.

Examples:

```text
Booking confirmed
Vehicle received
Estimate ready
Estimate approved
Vehicle ready
APK reminder
Service reminder
```

Show notifications inside customer portal.

Actual SMS/email integration can be mocked.

---

# 31. Invoice module

Create simple invoice generation from completed work orders.

Fields:

- invoice number
- customer
- garage
- date
- lines
- VAT
- totals
- payment status

Provide printable web invoice.

PDF generation is optional in the first demo.

Do not build a full accounting platform.

---

# 32. Demo journey

Create seeded scenarios that can be demonstrated without manual setup.

## Scenario 1 — New booking

Customer:

**Emma de Vries**

Vehicle:

**Volkswagen Golf**

Flow:

```text
Home
→ Enter registration
→ Vehicle identified
→ Select brake service
→ Choose appointment
→ Booking confirmed
```

## Scenario 2 — Workshop

Reception opens booking:

```text
Vehicle Received
→ Work Order
→ Diagnosis
→ Add brake discs/pads
→ Create Estimate
```

## Scenario 3 — Customer approval

Customer portal:

```text
Estimate €326.50
→ Approve
```

Workshop:

```text
Waiting for Approval
→ Approved
→ In Repair
→ Ready
→ Completed
```

## Scenario 4 — Service Passport

Completed job generates:

```text
Verified Service Record
```

Another demo garage requests history.

Customer grants 30-day permission.

Second garage sees technical repair history but NO prices.

## Scenario 5 — Used car

Garage publishes a used vehicle.

Customer:

```text
Occasions
→ Vehicle
→ View verified service history badge
→ Request test drive
```

## Scenario 6 — Existing website

Show integration page containing embedded booking and used-car modules.

These journeys must work after seed/reset without developers manually modifying the database.

---

# 33. Demo reset

Create a safe DEMO RESET capability available only in the demo environment.

It should restore known seed data.

Protect it from accidental availability in future production environments.

Example:

```text
ENABLE_DEMO_TOOLS=true
```

---

# 34. UX requirements

Visual style:

- modern
- professional
- automotive
- trustworthy
- clean
- not overly futuristic
- mobile-first where customer-facing
- efficient desktop workflow for staff

Avoid dashboard template appearance.

Customer-facing interface should feel simpler than staff interface.

Use clear status colors and icons, while preserving accessibility.

Do not make the interface dependent on color alone.

---

# 35. Responsive behavior

Test at least:

```text
mobile ~390 px
tablet ~768 px
desktop ~1440 px
```

Customer booking and estimate approval must work comfortably on a phone.

Staff dashboard should remain usable on tablet and desktop.

---

# 36. Accessibility

Minimum expectations:

- semantic labels
- keyboard accessibility
- visible focus
- sensible contrast
- useful empty states
- useful validation errors
- accessible form controls

---

# 37. Security baseline

Even for demo:

- validate all inputs;
- separate authentication from authorization;
- enforce organization ownership server-side;
- no trusting organizationId from browser alone;
- safe file upload abstraction;
- protect privileged actions;
- do not expose secrets to client;
- no production credentials committed to repository;
- environment variables through configuration;
- audit important actions.

Important audited actions:

```text
estimate approval
service record creation
service passport access grant
permission revocation
vehicle transfer
work order completion
```

Prepare the foundation for stronger SST security integration later.

---

# 38. Privacy model

Respect data separation.

Categories:

```text
Customer Personal Data
Garage Commercial Data
Vehicle Technical Data
Portable Service History
Internal Garage Notes
```

Do not mix these into a single unrestricted record.

Especially ensure:

```text
Portable Service Record ≠ Invoice
```

and:

```text
Shared vehicle history ≠ full customer record
```

---

# 39. Demo labels

Anything not actually connected to a live provider must be clearly marked.

Examples:

```text
DEMO RDW
DEMO PAYMENT
DEMO MESSAGE
```

Never present simulated integrations as real.

---

# 40. Vercel readiness

The project must be deployable to Vercel.

Provide:

```text
README.md
.env.example
deployment instructions
required environment variables
build command
database setup instructions
seed instructions
demo reset instructions
```

Ensure:

```text
npm install
npm run build
```

passes successfully.

Avoid assumptions about persistent local filesystem in production.

Do not store production state in local files.

External persistence must be supported.

---

# 41. Repository quality

Use:

- clear folder structure
- meaningful types
- no giant single components
- no duplicated business logic
- domain enums where useful
- validation schemas
- reusable UI components
- clean loading/error/empty states

Avoid premature enterprise complexity.

We need a strong foundation, not dozens of unnecessary abstractions.

---

# 42. Required core domain entities

At minimum define:

```text
Organization
Location
User
Role
Customer
Vehicle
VehicleOwnership
Booking
Service
WorkshopResource
WorkOrder
WorkOrderItem
Diagnosis
Estimate
EstimateItem
Approval
Invoice
InvoiceItem
InventoryItem
UsedVehicle
ShopProduct
ServiceRecord
PortableServiceRecord
VehicleHistoryAccessGrant
Notification
AuditEvent
```

Entities may be refined during implementation.

Document any important changes.

---

# 43. Out of scope for first demo

Do NOT spend significant time implementing:

- real RDW credentials
- real APK submission
- real iDEAL payment
- real SMS
- real WhatsApp
- real accounting integration
- complete ecommerce logistics
- AI diagnosis
- complex fleet management
- cross-garage financial settlement
- full Garage Network marketplace
- native mobile app

Create clean adapters/interfaces where these capabilities will later connect.

---

# 44. Future Garage Network compatibility

Architecture must anticipate:

```text
Garage A
Garage B
Garage C
```

sharing limited capabilities without sharing entire customer databases.

Future use cases:

- technical history sharing by customer consent
- service referrals
- specialist referrals
- capacity sharing
- parts availability
- subcontracting
- cross-garage bookings

Do not implement the complete network now.

But avoid design choices that make it impossible later.

---

# 45. Documentation

Create:

```text
README.md
docs/ARCHITECTURE.md
docs/DOMAIN-MODEL.md
docs/DEMO-FLOWS.md
docs/INTEGRATIONS.md
docs/FUTURE-ROADMAP.md
```

ARCHITECTURE.md must explain:

- frontend-independent Core
- multi-tenant design
- Web Gateway
- adapter model
- privacy boundaries
- Service Passport architecture

---

# 46. Seed data

Create enough realistic seed data that the system feels alive immediately.

Minimum:

- 2 garage organizations
- 2 locations for primary garage if useful
- 6 employees
- 12 customers
- 15+ vehicles
- 20+ bookings/history records
- 10+ inventory items
- 4 used cars
- 10+ shop products
- several estimates/invoices
- several Service Passport records

Primary demo garage must have enough current activity for a meaningful dashboard.

---

# 47. Presentation mode

Create a small:

```text
Demo Guide
```

accessible to the presenter.

It should explain:

1. start here;
2. show booking;
3. show workshop;
4. show estimate;
5. approve as customer;
6. complete repair;
7. show Service Passport;
8. share history;
9. show Occasions;
10. show existing-site integration.

This guide should not appear to ordinary customer users.

---

# 48. Quality gates

Before declaring completion:

### Build

- typecheck PASS
- lint PASS
- production build PASS

### Core flows

- login PASS
- tenant isolation PASS
- booking PASS
- booking → work order PASS
- work order → estimate PASS
- customer approval PASS
- repair completion PASS
- Service Passport record PASS
- history sharing PASS
- prices excluded from shared passport PASS
- inventory decrement PASS
- used car listing PASS
- demo reset PASS

### Responsive

- mobile customer flow PASS
- desktop workshop PASS

### Vercel

- production build compatible
- no local-file persistence assumptions
- environment documentation complete

---

# 49. Important implementation rule

When choosing between:

A. a spectacular visual shortcut that must later be rewritten

and

B. a slightly simpler implementation that creates the correct foundation,

choose **B**.

This demo is intended to become the first version of the real product if a garage accepts the concept.

---

# 50. Final deliverables

Return:

1. working source code;
2. deployed Vercel demo if deployment access is available;
3. README;
4. architecture documentation;
5. test/build evidence;
6. demo credentials;
7. demo presentation route/guide;
8. list of mocked integrations;
9. list of production integrations still required;
10. identified risks;
11. recommended next iteration.

Also provide a concise final report:

```text
GARAGE PLATFORM DEMO — EXECUTION REPORT

Build:
Tests:
Deployment:
Implemented modules:
Mock integrations:
Known limitations:
Architecture decisions:
Security notes:
Production blockers:
Recommended Iteration 1:
```

---

# 51. Definition of Done

The task is complete only when a non-technical garage owner can open the deployed demo and understand this story:

> A customer books a repair online.
>
> The garage receives the car and creates a work order.
>
> The mechanic diagnoses the problem and prepares an estimate.
>
> The customer approves it digitally.
>
> The garage performs the repair and completes the invoice.
>
> The technical repair becomes part of the vehicle's verified Service Passport.
>
> The customer can later allow another garage to view that technical history without revealing prices or private commercial data.
>
> The same system also supports used-car sales, inventory and a parts shop.
>
> The garage may either use a new website built on the platform or connect the system to its existing website.
>
> The architecture is already prepared to evolve into a multi-garage SaaS and future Garage Network.

That business story is the primary success criterion.
