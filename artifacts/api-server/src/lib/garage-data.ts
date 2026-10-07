import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  bookingsTable,
  customersTable,
  estimatesTable,
  inventoryItemsTable,
  locationsTable,
  organizationsTable,
  servicesTable,
  vehiclesTable,
  workOrderItemsTable,
  workOrdersTable,
} from "@workspace/db";
import { HttpError } from "./http";

export const numberValue = (value: string | number | null | undefined): number =>
  value === null || value === undefined ? 0 : Number(value);

export function moneyLineDto(item: typeof workOrderItemsTable.$inferSelect) {
  return {
    id: item.id,
    kind: item.kind,
    description: item.description,
    quantity: numberValue(item.quantity),
    unitPrice: numberValue(item.unitPrice),
    vatRate: numberValue(item.vatRate),
    total: numberValue(item.total),
    inventoryItemId: item.inventoryItemId,
  };
}

export function estimateDto(
  estimate: typeof estimatesTable.$inferSelect | undefined,
) {
  if (!estimate) return null;
  return {
    id: estimate.id,
    workOrderId: estimate.workOrderId,
    status: estimate.status,
    decision: estimate.decision,
    lines: estimate.lines.map((line) => ({
      ...line,
      quantity: Number(line.quantity),
      unitPrice: Number(line.unitPrice),
      vatRate: Number(line.vatRate),
      total: Number(line.total),
    })),
    subtotal: numberValue(estimate.subtotal),
    vatTotal: numberValue(estimate.vatTotal),
    total: numberValue(estimate.total),
    decisionTimestamp: estimate.decisionTimestamp?.toISOString() ?? null,
  };
}

export async function getWorkOrderDto(
  workOrderId: string,
  organizationId: string,
  options: { customerId?: string; hideInternalNotes?: boolean } = {},
) {
  const [record] = await db
    .select({
      order: workOrdersTable,
      customerName: customersTable.name,
      vehicle: vehiclesTable,
    })
    .from(workOrdersTable)
    .innerJoin(
      customersTable,
      eq(workOrdersTable.customerId, customersTable.id),
    )
    .innerJoin(vehiclesTable, eq(workOrdersTable.vehicleId, vehiclesTable.id))
    .where(
      and(
        eq(workOrdersTable.id, workOrderId),
        eq(workOrdersTable.organizationId, organizationId),
        options.customerId
          ? eq(workOrdersTable.customerId, options.customerId)
          : undefined,
      ),
    )
    .limit(1);
  if (!record) throw new HttpError(404, "Work order not found.", "not_found");

  const items = await db
    .select()
    .from(workOrderItemsTable)
    .where(
      and(
        eq(workOrderItemsTable.workOrderId, record.order.id),
        eq(workOrderItemsTable.organizationId, organizationId),
        eq(workOrderItemsTable.status, "active"),
      ),
    )
    .orderBy(asc(workOrderItemsTable.createdAt));
  const [estimate] = await db
    .select()
    .from(estimatesTable)
    .where(
      and(
        eq(estimatesTable.workOrderId, record.order.id),
        eq(estimatesTable.organizationId, organizationId),
      ),
    )
    .orderBy(desc(estimatesTable.createdAt))
    .limit(1);

  return {
    id: record.order.id,
    organizationId: record.order.organizationId,
    locationId: record.order.locationId,
    bookingId: record.order.bookingId,
    customerId: record.order.customerId,
    customerName: record.customerName,
    vehicleId: record.order.vehicleId,
    vehicleLabel: [record.vehicle.make, record.vehicle.model, record.vehicle.variant]
      .filter(Boolean)
      .join(" "),
    registrationNumber: record.vehicle.registrationNumber,
    status: record.order.status,
    complaint: record.order.complaint,
    diagnosis: record.order.diagnosis,
    assignedMechanic: record.order.assignedMechanic,
    mileage: record.order.mileage,
    fuelLevel: record.order.fuelLevel,
    visibleDamageNotes: record.order.visibleDamageNotes,
    additionalNotes: options.hideInternalNotes ? undefined : record.order.additionalNotes,
    items: items.map(moneyLineDto),
    estimate: estimateDto(estimate),
    createdAt: record.order.createdAt.toISOString(),
    updatedAt: record.order.updatedAt.toISOString(),
  };
}

export async function getBookingDto(
  bookingId: string,
  organizationId: string,
  customerId?: string,
) {
  const [record] = await db
    .select({
      booking: bookingsTable,
      customerName: customersTable.name,
      vehicle: vehiclesTable,
      serviceName: servicesTable.name,
    })
    .from(bookingsTable)
    .innerJoin(customersTable, eq(bookingsTable.customerId, customersTable.id))
    .innerJoin(vehiclesTable, eq(bookingsTable.vehicleId, vehiclesTable.id))
    .innerJoin(servicesTable, eq(bookingsTable.serviceId, servicesTable.id))
    .where(
      and(
        eq(bookingsTable.id, bookingId),
        eq(bookingsTable.organizationId, organizationId),
        customerId ? eq(bookingsTable.customerId, customerId) : undefined,
      ),
    )
    .limit(1);
  if (!record) throw new HttpError(404, "Booking not found.", "not_found");
  return bookingDtoFromRow(record);
}

export function bookingDtoFromRow(record: {
  booking: typeof bookingsTable.$inferSelect;
  customerName: string;
  vehicle: typeof vehiclesTable.$inferSelect;
  serviceName: string;
}) {
  return {
    id: record.booking.id,
    organizationId: record.booking.organizationId,
    locationId: record.booking.locationId,
    customerId: record.booking.customerId,
    customerName: record.customerName,
    vehicleId: record.booking.vehicleId,
    registrationNumber: record.vehicle.registrationNumber,
    vehicleLabel: [record.vehicle.make, record.vehicle.model, record.vehicle.variant]
      .filter(Boolean)
      .join(" "),
    serviceId: record.booking.serviceId,
    serviceName: record.serviceName,
    startsAt: record.booking.startsAt.toISOString(),
    durationMinutes: record.booking.durationMinutes,
    status: record.booking.status,
    source: record.booking.source,
    problemDescription: record.booking.problemDescription,
    assignedMechanic: record.booking.assignedMechanic,
    resource: record.booking.resource,
    createdAt: record.booking.createdAt.toISOString(),
  };
}

export async function getGarageAddress(organizationId: string, locationId: string) {
  const [record] = await db
    .select({
      garage: organizationsTable.name,
      location: locationsTable.name,
    })
    .from(locationsTable)
    .innerJoin(
      organizationsTable,
      eq(locationsTable.organizationId, organizationsTable.id),
    )
    .where(
      and(
        eq(locationsTable.id, locationId),
        eq(locationsTable.organizationId, organizationId),
      ),
    )
    .limit(1);
  if (!record) throw new HttpError(404, "Garage location not found.", "not_found");
  return `${record.garage} · ${record.location}`;
}

export async function getInventoryItemForTenant(
  inventoryItemId: string,
  organizationId: string,
) {
  const [item] = await db
    .select()
    .from(inventoryItemsTable)
    .where(
      and(
        eq(inventoryItemsTable.id, inventoryItemId),
        eq(inventoryItemsTable.organizationId, organizationId),
        eq(inventoryItemsTable.status, "active"),
      ),
    )
    .limit(1);
  return item;
}
