import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { locationsTable, organizationsTable } from "./core";

const id = () => text("id").primaryKey().$defaultFn(() => crypto.randomUUID());
const createdAt = () =>
  timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());

export const inventoryItemsTable = pgTable("inventory_items", {
  id: id(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizationsTable.id),
  locationId: text("location_id")
    .notNull()
    .references(() => locationsTable.id),
  sku: text("sku").notNull(),
  partNumber: text("part_number").notNull(),
  name: text("name").notNull(),
  brand: text("brand").notNull(),
  purchasePrice: numeric("purchase_price", { precision: 12, scale: 2 }).notNull(),
  salePrice: numeric("sale_price", { precision: 12, scale: 2 }).notNull(),
  vatRate: numeric("vat_rate", { precision: 5, scale: 2 }).notNull(),
  stock: integer("stock").notNull().default(0),
  minimumStock: integer("minimum_stock").notNull().default(0),
  storageLocation: text("storage_location").notNull().default(""),
  compatibleVehicles: text("compatible_vehicles").array().notNull().default([]),
  status: text("status").notNull().default("active"),
  createdBy: text("created_by"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const usedVehiclesTable = pgTable("used_vehicles", {
  id: id(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizationsTable.id),
  locationId: text("location_id")
    .notNull()
    .references(() => locationsTable.id),
  registration: text("registration").notNull(),
  make: text("make").notNull(),
  model: text("model").notNull(),
  variant: text("variant").notNull().default(""),
  year: integer("year").notNull(),
  mileage: integer("mileage").notNull(),
  fuel: text("fuel").notNull(),
  transmission: text("transmission").notNull(),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  description: text("description").notNull(),
  features: text("features").array().notNull().default([]),
  imageUrl: text("image_url").notNull().default(""),
  apk: text("apk").notNull().default(""),
  serviceHistoryAvailable: boolean("service_history_available")
    .notNull()
    .default(false),
  status: text("status").notNull().default("draft"),
  createdBy: text("created_by"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const usedVehicleLeadsTable = pgTable("used_vehicle_leads", {
  id: id(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizationsTable.id),
  locationId: text("location_id")
    .notNull()
    .references(() => locationsTable.id),
  usedVehicleId: text("used_vehicle_id")
    .notNull()
    .references(() => usedVehiclesTable.id),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  type: text("type").notNull(),
  message: text("message").notNull().default(""),
  status: text("status").notNull().default("new"),
  createdBy: text("created_by"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const shopProductsTable = pgTable("shop_products", {
  id: id(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizationsTable.id),
  locationId: text("location_id")
    .notNull()
    .references(() => locationsTable.id),
  name: text("name").notNull(),
  category: text("category").notNull(),
  brand: text("brand").notNull(),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  stock: integer("stock").notNull().default(0),
  description: text("description").notNull().default(""),
  imageUrl: text("image_url").notNull().default(""),
  status: text("status").notNull().default("active"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const demoOrdersTable = pgTable("demo_orders", {
  id: id(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizationsTable.id),
  locationId: text("location_id")
    .notNull()
    .references(() => locationsTable.id),
  orderNumber: text("order_number").notNull(),
  items: jsonb("items").$type<
    Array<{ productId: string; name: string; quantity: number; price: number }>
  >().notNull(),
  total: numeric("total", { precision: 12, scale: 2 }).notNull(),
  status: text("status").notNull().default("demo"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const notificationsTable = pgTable("notifications", {
  id: id(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizationsTable.id),
  locationId: text("location_id")
    .notNull()
    .references(() => locationsTable.id),
  customerId: text("customer_id"),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(),
  read: boolean("read").notNull().default(false),
  status: text("status").notNull().default("active"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const auditEventsTable = pgTable("audit_events", {
  id: id(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizationsTable.id),
  locationId: text("location_id")
    .notNull()
    .references(() => locationsTable.id),
  actorUserId: text("actor_user_id"),
  action: text("action").notNull(),
  resourceType: text("resource_type").notNull(),
  resourceId: text("resource_id").notNull(),
  details: jsonb("details").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: createdAt(),
});

export type InventoryItem = typeof inventoryItemsTable.$inferSelect;
export type UsedVehicle = typeof usedVehiclesTable.$inferSelect;
export type UsedVehicleLead = typeof usedVehicleLeadsTable.$inferSelect;
export type ShopProduct = typeof shopProductsTable.$inferSelect;
export type Notification = typeof notificationsTable.$inferSelect;
