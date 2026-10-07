import {
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { locationsTable, organizationsTable, vehiclesTable } from "./core";
import { workOrdersTable } from "./workshop";

const id = () => text("id").primaryKey().$defaultFn(() => crypto.randomUUID());
const createdAt = () =>
  timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());

export const portableServiceRecordsTable = pgTable(
  "portable_service_records",
  {
    id: id(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizationsTable.id),
    locationId: text("location_id")
      .notNull()
      .references(() => locationsTable.id),
    vehicleId: text("vehicle_id")
      .notNull()
      .references(() => vehiclesTable.id),
    workOrderId: text("work_order_id")
      .notNull()
      .references(() => workOrdersTable.id),
    serviceDate: timestamp("service_date", { withTimezone: true })
      .notNull()
      .defaultNow(),
    mileage: integer("mileage").notNull(),
    serviceType: text("service_type").notNull(),
    workPerformed: text("work_performed").notNull(),
    partsInstalled: text("parts_installed").array().notNull().default([]),
    partManufacturer: text("part_manufacturer").notNull().default(""),
    partNumber: text("part_number").notNull().default(""),
    fluids: text("fluids").notNull().default(""),
    technicalResult: text("technical_result").notNull(),
    serviceGarage: text("service_garage").notNull(),
    verificationStatus: text("verification_status")
      .notNull()
      .default("verified"),
    status: text("status").notNull().default("published"),
    createdBy: text("created_by"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
);

export const vehicleHistoryGrantsTable = pgTable("vehicle_history_grants", {
  id: id(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizationsTable.id),
  locationId: text("location_id")
    .notNull()
    .references(() => locationsTable.id),
  vehicleId: text("vehicle_id")
    .notNull()
    .references(() => vehiclesTable.id),
  grantedByCustomerId: text("granted_by_customer_id").notNull(),
  receivingOrganizationId: text("receiving_organization_id")
    .notNull()
    .references(() => organizationsTable.id),
  scope: text("scope").notNull(),
  createdAt: createdAt(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  usedAt: timestamp("used_at", { withTimezone: true }),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  updatedAt: updatedAt(),
});

export type PortableServiceRecord =
  typeof portableServiceRecordsTable.$inferSelect;
export type VehicleHistoryGrant = typeof vehicleHistoryGrantsTable.$inferSelect;
