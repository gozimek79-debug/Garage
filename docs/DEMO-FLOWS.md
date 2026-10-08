# Demo flows

## First launch

1. Open the public home page and browse services, prices, occasions, and the parts shop.
2. Create/sign into a Clerk account.
3. In the development demo, use the role control in the staff shell to switch between owner, manager, reception, mechanic, sales, warehouse, and customer.
4. Use the demo reset control to restore the seeded workshop when needed.

The customer role is linked to the fictional Emma account and demonstrates an existing estimate, two vehicles, invoice, and technical service history. Role switching and reset are never available in production.

## Booking through completion

1. Submit a public booking with a future slot, service, vehicle registration, and customer contact details.
2. In the staff workspace, receive a booking to create its work order.
3. Add a diagnosis and labor/stock lines. Editing the lines supersedes any old estimate so a changed total needs fresh approval.
4. Send the estimate to the customer. Switch to customer role and approve, decline, or request a call from “Mijn garage”.
5. Switch to a staff role, move the work order to repair/ready, and complete it. This creates a demo invoice and a price-free technical service record.

## Service passport consent

1. Switch to customer and open Servicepaspoort.
2. Select a vehicle and grant one-time, 30-day, or until-revoked access to the fictional partner garage.
3. View the recorded technical history or revoke the grant. Existing grants reload from the API.
4. The sharing response contains no prices, invoice lines, internal notes, or commercial records.

## Safe demo commerce

The parts shop checkout and used-car enquiry create fictional database records. Neither charges a card nor contacts a real garage or provider.
