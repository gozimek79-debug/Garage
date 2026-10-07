import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

const id = () => text("id").primaryKey().$defaultFn(() => crypto.randomUUID());
const createdAt = () =>
  timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());

export const organizationsTable = pgTable("organizations", {
  id: id(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  countryCode: text("country_code").notNull().default("NL"),
  primaryLanguage: text("primary_language").notNull().default("nl"),
  languages: text("languages").array().notNull().default(["nl", "en"]),
  brand: jsonb("brand").$type<Record<string, string>>().notNull().default({}),
  status: text("status").notNull().default("active"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const locationsTable = pgTable("locations", {
  id: id(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizationsTable.id),
  name: text("name").notNull(),
  address: text("address").notNull(),
  postalCode: text("postal_code").notNull(),
  city: text("city").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  domain: text("domain").notNull().default(""),
  openingHours: jsonb("opening_hours")
    .$type<Record<string, string>>()
    .notNull()
    .default({}),
  isMain: boolean("is_main").notNull().default(false),
  status: text("status").notNull().default("active"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const customersTable = pgTable("customers", {
  id: id(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizationsTable.id),
  locationId: text("location_id")
    .notNull()
    .references(() => locationsTable.id),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  preferredLanguage: text("preferred_language").notNull().default("nl"),
  address: text("address"),
  notes: text("notes").notNull().default(""),
  status: text("status").notNull().default("active"),
  createdBy: text("created_by"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const vehiclesTable = pgTable(
  "vehicles",
  {
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
    registrationNumber: text("registration_number").notNull(),
    vin: text("vin"),
    make: text("make").notNull(),
    model: text("model").notNull(),
    variant: text("variant").notNull().default(""),
    fuelType: text("fuel_type").notNull(),
    year: integer("year").notNull(),
    mileage: integer("mileage").notNull().default(0),
    apkExpiry: text("apk_expiry").notNull(),
    status: text("status").notNull().default("active"),
    createdBy: text("created_by"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("vehicles_tenant_registration_unique").on(
      table.organizationId,
      table.registrationNumber,
    ),
  ],
);

export const usersTable = pgTable("users", {
  id: id(),
  clerkUserId: text("clerk_user_id").notNull().unique(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizationsTable.id),
  locationId: text("location_id")
    .notNull()
    .references(() => locationsTable.id),
  customerId: text("customer_id").references(() => customersTable.id),
  name: text("name").notNull(),
  email: text("email").notNull(),
  role: text("role").notNull().default("owner"),
  status: text("status").notNull().default("active"),
  createdBy: text("created_by"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const employeesTable = pgTable("employees", {
  id: id(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizationsTable.id),
  locationId: text("location_id")
    .notNull()
    .references(() => locationsTable.id),
  name: text("name").notNull(),
  email: text("email").notNull(),
  role: text("role").notNull(),
  specialty: text("specialty").notNull().default(""),
  initials: text("initials").notNull().default(""),
  status: text("status").notNull().default("active"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const servicesTable = pgTable("services", {
  id: id(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizationsTable.id),
  locationId: text("location_id")
    .notNull()
    .references(() => locationsTable.id),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  estimatedDurationMinutes: integer("estimated_duration_minutes").notNull(),
  basePrice: numeric("base_price", { precision: 12, scale: 2 }).notNull(),
  requiredResourceType: text("required_resource_type").notNull(),
  status: text("status").notNull().default("active"),
  createdBy: text("created_by"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const workshopResourcesTable = pgTable("workshop_resources", {
  id: id(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizationsTable.id),
  locationId: text("location_id")
    .notNull()
    .references(() => locationsTable.id),
  name: text("name").notNull(),
  type: text("type").notNull(),
  capacity: integer("capacity").notNull().default(1),
  status: text("status").notNull().default("active"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const pricingPackagesTable = pgTable("pricing_packages", {
  id: id(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizationsTable.id),
  serviceId: text("service_id")
    .notNull()
    .references(() => servicesTable.id),
  tier: text("tier").notNull(),
  priceModifier: numeric("price_modifier", { precision: 12, scale: 2 })
    .notNull()
    .default("0"),
  description: text("description").notNull().default(""),
  status: text("status").notNull().default("active"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export type Organization = typeof organizationsTable.$inferSelect;
export type Location = typeof locationsTable.$inferSelect;
export type Customer = typeof customersTable.$inferSelect;
export type Vehicle = typeof vehiclesTable.$inferSelect;
export type User = typeof usersTable.$inferSelect;
export type Service = typeof servicesTable.$inferSelect;
export type WorkshopResource = typeof workshopResourcesTable.$inferSelect;
export type PricingPackage = typeof pricingPackagesTable.$inferSelect;
