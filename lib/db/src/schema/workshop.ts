import {
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import {
  customersTable,
  locationsTable,
  organizationsTable,
  servicesTable,
  vehiclesTable,
} from "./core";

const id = () => text("id").primaryKey().$defaultFn(() => crypto.randomUUID());
const createdAt = () =>
  timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());

export const bookingsTable = pgTable("bookings", {
  id: id(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizationsTable.id),
  locationId: text("location_id")
    .notNull()
    .references(() => locationsTable.id),
  customerId: text("customer_id")
    .notNull()
    .references(() => customersTable.id),
  vehicleId: text("vehicle_id")
    .notNull()
    .references(() => vehiclesTable.id),
  serviceId: text("service_id")
    .notNull()
    .references(() => servicesTable.id),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  status: text("status").notNull().default("confirmed"),
  source: text("source").notNull().default("website"),
  problemDescription: text("problem_description"),
  assignedMechanic: text("assigned_mechanic"),
  resource: text("resource"),
  createdBy: text("created_by"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const workOrdersTable = pgTable("work_orders", {
  id: id(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizationsTable.id),
  locationId: text("location_id")
    .notNull()
    .references(() => locationsTable.id),
  bookingId: text("booking_id")
    .notNull()
    .references(() => bookingsTable.id),
  customerId: text("customer_id")
    .notNull()
    .references(() => customersTable.id),
  vehicleId: text("vehicle_id")
    .notNull()
    .references(() => vehiclesTable.id),
  status: text("status").notNull().default("vehicle_received"),
  complaint: text("complaint").notNull(),
  diagnosis: text("diagnosis").notNull().default(""),
  workPerformed: text("work_performed").notNull().default(""),
  assignedMechanic: text("assigned_mechanic").notNull().default(""),
  mileage: integer("mileage").notNull(),
  fuelLevel: integer("fuel_level"),
  visibleDamageNotes: text("visible_damage_notes").notNull().default(""),
  additionalNotes: text("additional_notes").notNull().default(""),
  createdBy: text("created_by"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [
  uniqueIndex("work_orders_org_booking_unique").on(
    table.organizationId,
    table.bookingId,
  ),
]);

export const workOrderItemsTable = pgTable("work_order_items", {
  id: id(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizationsTable.id),
  locationId: text("location_id")
    .notNull()
    .references(() => locationsTable.id),
  workOrderId: text("work_order_id")
    .notNull()
    .references(() => workOrdersTable.id),
  kind: text("kind").notNull(),
  description: text("description").notNull(),
  quantity: numeric("quantity", { precision: 10, scale: 2 }).notNull(),
  unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
  vatRate: numeric("vat_rate", { precision: 5, scale: 2 }).notNull(),
  total: numeric("total", { precision: 12, scale: 2 }).notNull(),
  inventoryItemId: text("inventory_item_id"),
  status: text("status").notNull().default("active"),
  createdBy: text("created_by"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const estimatesTable = pgTable("estimates", {
  id: id(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizationsTable.id),
  locationId: text("location_id")
    .notNull()
    .references(() => locationsTable.id),
  workOrderId: text("work_order_id")
    .notNull()
    .references(() => workOrdersTable.id),
  status: text("status").notNull().default("sent"),
  decision: text("decision"),
  lines: jsonb("lines").$type<
    Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      vatRate: number;
      total: number;
    }>
  >().notNull().default([]),
  subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull(),
  vatTotal: numeric("vat_total", { precision: 12, scale: 2 }).notNull(),
  total: numeric("total", { precision: 12, scale: 2 }).notNull(),
  decisionTimestamp: timestamp("decision_timestamp", { withTimezone: true }),
  customerMessage: text("customer_message").notNull().default(""),
  createdBy: text("created_by"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const invoicesTable = pgTable("invoices", {
  id: id(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizationsTable.id),
  locationId: text("location_id")
    .notNull()
    .references(() => locationsTable.id),
  workOrderId: text("work_order_id")
    .notNull()
    .references(() => workOrdersTable.id),
  customerId: text("customer_id")
    .notNull()
    .references(() => customersTable.id),
  invoiceNumber: text("invoice_number").notNull(),
  date: timestamp("date", { withTimezone: true }).notNull().defaultNow(),
  lines: jsonb("lines").$type<
    Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      vatRate: number;
      total: number;
    }>
  >().notNull().default([]),
  vatTotal: numeric("vat_total", { precision: 12, scale: 2 }).notNull(),
  total: numeric("total", { precision: 12, scale: 2 }).notNull(),
  paymentStatus: text("payment_status").notNull().default("unpaid"),
  status: text("status").notNull().default("issued"),
  createdBy: text("created_by"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const garageCommercialRecordsTable = pgTable(
  "garage_commercial_records",
  {
    id: id(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizationsTable.id),
    locationId: text("location_id")
      .notNull()
      .references(() => locationsTable.id),
    workOrderId: text("work_order_id")
      .notNull()
      .references(() => workOrdersTable.id),
    invoiceId: text("invoice_id").references(() => invoicesTable.id),
    privateNotes: text("private_notes").notNull().default(""),
    status: text("status").notNull().default("completed"),
    createdBy: text("created_by"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
);

export type Booking = typeof bookingsTable.$inferSelect;
export type WorkOrder = typeof workOrdersTable.$inferSelect;
export type WorkOrderItem = typeof workOrderItemsTable.$inferSelect;
export type Estimate = typeof estimatesTable.$inferSelect;
export type Invoice = typeof invoicesTable.$inferSelect;
