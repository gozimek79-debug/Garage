import { and, asc, desc, eq } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  CreateCustomerBody,
  CreateCustomerResponse,
  GetDemoSessionResponse,
  GetServicePassportResponse,
  GetSharedServiceHistoryParams,
  GetSharedServiceHistoryResponse,
  GrantServiceHistoryAccessBody,
  GrantServiceHistoryAccessParams,
  GrantServiceHistoryAccessResponse,
  ListCustomersResponse,
  ListServicesResponse,
  ListVehiclesResponse,
  LookupVehicleQueryParams,
  LookupVehicleResponse,
  RevokeServiceHistoryAccessParams,
  RevokeServiceHistoryAccessResponse,
} from "@workspace/api-zod";
import { db } from "@workspace/db";
import {
  customersTable,
  locationsTable,
  organizationsTable,
  portableServiceRecordsTable,
  servicesTable,
  usersTable,
  vehiclesTable,
  vehicleHistoryGrantsTable,
} from "@workspace/db";
import {
  currentGarageUser,
  requireGarageRole,
  requireGarageUser,
} from "../lib/auth";
import { auditGarageAction } from "../lib/audit";
import { PARTNER_ORG_ID } from "../lib/demo-seed";
import { numberValue } from "../lib/garage-data";
import { asyncRoute, HttpError } from "../lib/http";
import {
  requireLookupResult,
  vehicleDataProvider,
} from "../lib/integrations/mock-rdw";

const router: IRouter = Router();

router.get(
  "/demo/session",
  requireGarageUser,
  asyncRoute(async (_req, res) => {
    const user = currentGarageUser(res);
    const result = {
      userId: user.id,
      userName: user.name,
      organizationId: user.organizationId,
      organizationName: user.organizationName,
      locationId: user.locationId,
      role: user.role,
      demoToolsEnabled: isDemoToolsEnabled(),
    };
    res.json(GetDemoSessionResponse.parse(result));
  }),
);

router.get(
  "/customers",
  requireGarageUser,
  requireGarageRole("owner", "manager", "reception"),
  asyncRoute(async (_req, res) => {
    const user = currentGarageUser(res);
    if (user.role === "customer" && !user.customerId) {
      throw new HttpError(403, "A customer account is not linked to a vehicle.", "customer_unlinked");
    }
    const [customers, vehicles] = await Promise.all([
      db.select().from(customersTable)
        .where(eq(customersTable.organizationId, user.organizationId))
        .orderBy(asc(customersTable.name)),
      db.select({ customerId: vehiclesTable.customerId }).from(vehiclesTable)
        .where(eq(vehiclesTable.organizationId, user.organizationId)),
    ]);
    const counts = new Map<string, number>();
    for (const vehicle of vehicles) {
      counts.set(vehicle.customerId, (counts.get(vehicle.customerId) ?? 0) + 1);
    }
    res.json(ListCustomersResponse.parse(customers.map((customer) => ({
      id: customer.id,
      organizationId: customer.organizationId,
      locationId: customer.locationId,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      preferredLanguage: customer.preferredLanguage,
      address: customer.address,
      notes: customer.notes,
      vehicleCount: counts.get(customer.id) ?? 0,
      createdAt: customer.createdAt.toISOString(),
      updatedAt: customer.updatedAt.toISOString(),
    }))));
  }),
);

router.post(
  "/customers",
  requireGarageUser,
  requireGarageRole("owner", "manager", "reception"),
  asyncRoute(async (req, res) => {
    const user = currentGarageUser(res);
    if (user.role === "customer" && !user.customerId) {
      throw new HttpError(403, "A customer account is not linked to a vehicle.", "customer_unlinked");
    }
    const body = CreateCustomerBody.parse(req.body);
    const [customer] = await db
      .insert(customersTable)
      .values({
        ...body,
        organizationId: user.organizationId,
        locationId: user.locationId,
        createdBy: user.id,
      })
      .returning();
    if (!customer) throw new HttpError(500, "Customer could not be created.");
    await auditGarageAction(user, "customer.created", "customer", customer.id);
    const result = {
      id: customer.id,
      organizationId: customer.organizationId,
      locationId: customer.locationId,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      preferredLanguage: customer.preferredLanguage,
      address: customer.address,
      notes: customer.notes,
      vehicleCount: 0,
      createdAt: customer.createdAt.toISOString(),
      updatedAt: customer.updatedAt.toISOString(),
    };
    res.status(201).json(CreateCustomerResponse.parse(result));
  }),
);

router.get(
  "/vehicles",
  requireGarageUser,
  requireGarageRole("owner", "manager", "reception", "mechanic", "sales", "warehouse", "customer"),
  asyncRoute(async (_req, res) => {
    const user = currentGarageUser(res);
    const vehicles = await db
      .select({ vehicle: vehiclesTable, customerName: customersTable.name })
      .from(vehiclesTable)
      .innerJoin(customersTable, eq(vehiclesTable.customerId, customersTable.id))
      .where(
        and(
          eq(vehiclesTable.organizationId, user.organizationId),
          user.role === "customer" && user.customerId
            ? eq(vehiclesTable.customerId, user.customerId)
            : undefined,
        ),
      )
      .orderBy(desc(vehiclesTable.updatedAt));
    res.json(ListVehiclesResponse.parse(vehicles.map(({ vehicle, customerName }) => ({
      id: vehicle.id,
      organizationId: vehicle.organizationId,
      locationId: vehicle.locationId,
      customerId: vehicle.customerId,
      customerName,
      registrationNumber: vehicle.registrationNumber,
      vin: vehicle.vin,
      make: vehicle.make,
      model: vehicle.model,
      variant: vehicle.variant,
      fuelType: vehicle.fuelType,
      year: vehicle.year,
      mileage: vehicle.mileage,
      apkExpiry: vehicle.apkExpiry,
    }))));
  }),
);

router.get(
  "/vehicles/lookup",
  asyncRoute(async (req, res) => {
    const { registration } = LookupVehicleQueryParams.parse(req.query);
    const vehicle = requireLookupResult(
      await vehicleDataProvider.lookup(registration),
    );
    res.json(LookupVehicleResponse.parse({ demo: true, vehicle }));
  }),
);

router.get(
  "/services",
  asyncRoute(async (_req, res) => {
    const services = await db
      .select()
      .from(servicesTable)
      .where(
        and(
          eq(servicesTable.organizationId, DEMO_ORG_ID),
          eq(servicesTable.status, "active"),
        ),
      )
      .orderBy(asc(servicesTable.name));
    res.json(ListServicesResponse.parse(services.map((service) => ({
      id: service.id,
      name: service.name,
      description: service.description,
      estimatedDurationMinutes: service.estimatedDurationMinutes,
      basePrice: numberValue(service.basePrice),
      requiredResourceType: service.requiredResourceType,
    }))));
  }),
);

router.get(
  "/vehicles/:vehicleId/passport",
  requireGarageUser,
  asyncRoute(async (req, res) => {
    const user = currentGarageUser(res);
    const [vehicle] = await db
      .select()
      .from(vehiclesTable)
      .where(
        and(
          eq(vehiclesTable.id, req.params.vehicleId),
          eq(vehiclesTable.organizationId, user.organizationId),
          user.role === "customer" && user.customerId
            ? eq(vehiclesTable.customerId, user.customerId)
            : undefined,
        ),
      )
      .limit(1);
    if (!vehicle) throw new HttpError(404, "Vehicle not found.", "not_found");
    const records = await db
      .select()
      .from(portableServiceRecordsTable)
      .where(
        and(
          eq(portableServiceRecordsTable.vehicleId, vehicle.id),
          eq(portableServiceRecordsTable.organizationId, user.organizationId),
          eq(portableServiceRecordsTable.status, "published"),
        ),
      )
      .orderBy(desc(portableServiceRecordsTable.serviceDate));
    res.json(GetServicePassportResponse.parse(records.map((record) => ({
      id: record.id,
      organizationId: record.organizationId,
      locationId: record.locationId,
      vehicleId: record.vehicleId,
      serviceDate: record.serviceDate.toISOString(),
      mileage: record.mileage,
      serviceType: record.serviceType,
      workPerformed: record.workPerformed,
      partsInstalled: record.partsInstalled,
      partManufacturer: record.partManufacturer,
      partNumber: record.partNumber,
      fluids: record.fluids,
      technicalResult: record.technicalResult,
      serviceGarage: record.serviceGarage,
      verificationStatus: record.verificationStatus,
    }))));
  }),
);

router.post(
  "/vehicles/:vehicleId/sharing",
  requireGarageUser,
  requireGarageRole("customer"),
  asyncRoute(async (req, res) => {
    const user = currentGarageUser(res);
    const { vehicleId } = GrantServiceHistoryAccessParams.parse(req.params);
    const body = GrantServiceHistoryAccessBody.parse(req.body);
    const [vehicle] = await db
      .select()
      .from(vehiclesTable)
      .where(
        and(
          eq(vehiclesTable.id, vehicleId),
          eq(vehiclesTable.organizationId, user.organizationId),
          eq(vehiclesTable.customerId, user.customerId ?? ""),
        ),
      )
      .limit(1);
    if (!vehicle) throw new HttpError(404, "Vehicle not found.", "not_found");
    const [partner] = await db
      .select()
      .from(organizationsTable)
      .where(eq(organizationsTable.id, PARTNER_ORG_ID))
      .limit(1);
    if (!partner) throw new HttpError(404, "Receiving garage not found.", "not_found");
    const expiresAt = body.scope === "until_revoked"
      ? null
      : new Date(Date.now() + (body.scope === "one_time" ? 1 : 30) * 86_400_000);
    const [grant] = await db
      .insert(vehicleHistoryGrantsTable)
      .values({
        organizationId: user.organizationId,
        locationId: user.locationId,
        vehicleId,
        grantedByCustomerId: user.customerId ?? "",
        receivingOrganizationId: partner.id,
        scope: body.scope,
        expiresAt,
      })
      .returning();
    if (!grant) throw new HttpError(500, "Service history access could not be granted.");
    await auditGarageAction(user, "passport.access_granted", "history_grant", grant.id, {
      vehicleId,
      receivingOrganizationId: partner.id,
      scope: grant.scope,
    });
    const result = {
      id: grant.id,
      vehicleId: grant.vehicleId,
      receivingOrganizationId: grant.receivingOrganizationId,
      receivingGarage: partner.name,
      scope: grant.scope,
      createdAt: grant.createdAt.toISOString(),
      expiresAt: grant.expiresAt?.toISOString() ?? null,
      revokedAt: grant.revokedAt?.toISOString() ?? null,
    };
    res.status(201).json(GrantServiceHistoryAccessResponse.parse(result));
  }),
);

router.delete(
  "/sharing/:grantId",
  requireGarageUser,
  requireGarageRole("customer"),
  asyncRoute(async (req, res) => {
    const user = currentGarageUser(res);
    const { grantId } = RevokeServiceHistoryAccessParams.parse(req.params);
    const [grant] = await db
      .select()
      .from(vehicleHistoryGrantsTable)
      .where(
        and(
          eq(vehicleHistoryGrantsTable.id, grantId),
          eq(vehicleHistoryGrantsTable.organizationId, user.organizationId),
          user.role === "customer"
            ? eq(vehicleHistoryGrantsTable.grantedByCustomerId, user.customerId ?? "")
            : undefined,
        ),
      )
      .limit(1);
    if (!grant) throw new HttpError(404, "Access grant not found.", "not_found");
    if (grant.revokedAt) {
      throw new HttpError(409, "This service history grant has already been revoked.", "already_revoked");
    }
    const [updated] = await db
      .update(vehicleHistoryGrantsTable)
      .set({ revokedAt: new Date() })
      .where(eq(vehicleHistoryGrantsTable.id, grant.id))
      .returning();
    if (!updated) throw new HttpError(500, "Access grant could not be revoked.");
    await auditGarageAction(user, "passport.access_revoked", "history_grant", updated.id);
    const [partner] = await db.select({ name: organizationsTable.name })
      .from(organizationsTable)
      .where(eq(organizationsTable.id, updated.receivingOrganizationId))
      .limit(1);
    const result = {
      id: updated.id,
      vehicleId: updated.vehicleId,
      receivingOrganizationId: updated.receivingOrganizationId,
      receivingGarage: partner?.name ?? "Receiving garage",
      scope: updated.scope,
      createdAt: updated.createdAt.toISOString(),
      expiresAt: updated.expiresAt?.toISOString() ?? null,
      revokedAt: updated.revokedAt?.toISOString() ?? null,
    };
    res.json(RevokeServiceHistoryAccessResponse.parse(result));
  }),
);

router.get(
  "/sharing/:grantId/records",
  requireGarageUser,
  asyncRoute(async (req, res) => {
    const user = currentGarageUser(res);
    const { grantId } = GetSharedServiceHistoryParams.parse(req.params);
    const [grant] = await db
      .select()
      .from(vehicleHistoryGrantsTable)
      .where(eq(vehicleHistoryGrantsTable.id, grantId))
      .limit(1);
    if (!grant) throw new HttpError(404, "Access grant not found.", "not_found");
    const isGrantOwner =
      user.organizationId === grant.organizationId &&
      (user.role !== "customer" || user.customerId === grant.grantedByCustomerId);
    const isReceivingGarage = user.organizationId === grant.receivingOrganizationId;
    if (!isGrantOwner && !isReceivingGarage) {
      throw new HttpError(403, "This account is not part of the sharing agreement.", "role_not_allowed");
    }
    if (grant.revokedAt || (grant.expiresAt && grant.expiresAt < new Date())) {
      throw new HttpError(410, "This service history grant has expired or was revoked.", "grant_inactive");
    }
    if (grant.scope === "one_time" && grant.usedAt) {
      throw new HttpError(410, "This one-time service history grant has already been used.", "grant_used");
    }
    if (grant.scope === "one_time" && isReceivingGarage) {
      await db
        .update(vehicleHistoryGrantsTable)
        .set({ usedAt: new Date() })
        .where(eq(vehicleHistoryGrantsTable.id, grant.id));
    }
    const records = await db
      .select()
      .from(portableServiceRecordsTable)
      .where(
        and(
          eq(portableServiceRecordsTable.vehicleId, grant.vehicleId),
          eq(portableServiceRecordsTable.organizationId, grant.organizationId),
          eq(portableServiceRecordsTable.status, "published"),
        ),
      )
      .orderBy(desc(portableServiceRecordsTable.serviceDate));
    res.json(GetSharedServiceHistoryResponse.parse(records.map((record) => ({
      id: record.id,
      organizationId: record.organizationId,
      locationId: record.locationId,
      vehicleId: record.vehicleId,
      serviceDate: record.serviceDate.toISOString(),
      mileage: record.mileage,
      serviceType: record.serviceType,
      workPerformed: record.workPerformed,
      partsInstalled: record.partsInstalled,
      partManufacturer: record.partManufacturer,
      partNumber: record.partNumber,
      fluids: record.fluids,
      technicalResult: record.technicalResult,
      serviceGarage: record.serviceGarage,
      verificationStatus: record.verificationStatus,
    }))));
  }),
);

export default router;
