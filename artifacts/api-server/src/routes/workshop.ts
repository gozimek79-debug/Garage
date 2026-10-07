import {
  and,
  desc,
  eq,
  gte,
  inArray,
  isNull,
  lt,
  or,
} from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  CompleteWorkOrderParams,
  CompleteWorkOrderResponse,
  CreateBookingBody,
  CreateBookingResponse,
  CreateEstimateParams,
  CreateEstimateResponse,
  DecideEstimateBody,
  DecideEstimateParams,
  DecideEstimateResponse,
  GetDashboardResponse,
  GetWorkOrderParams,
  GetWorkOrderResponse,
  ListBookingsResponse,
  ListInvoicesResponse,
  ListNotificationsResponse,
  ListWorkOrdersResponse,
  ReceiveBookingBody,
  ReceiveBookingParams,
  ReceiveBookingResponse,
  UpdateWorkOrderBody,
  UpdateWorkOrderParams,
  UpdateWorkOrderResponse,
} from "@workspace/api-zod";
import { db } from "@workspace/db";
import {
  bookingsTable,
  customersTable,
  estimatesTable,
  inventoryItemsTable,
  invoicesTable,
  locationsTable,
  notificationsTable,
  servicesTable,
  vehiclesTable,
  workOrderItemsTable,
  workOrdersTable,
  workshopResourcesTable,
  portableServiceRecordsTable,
  garageCommercialRecordsTable,
  usedVehicleLeadsTable,
} from "@workspace/db";
import {
  currentGarageUser,
  requireGarageRole,
  requireGarageUser,
} from "../lib/auth";
import { addGarageNotification, auditGarageAction } from "../lib/audit";
import {
  bookingDtoFromRow,
  estimateDto,
  getBookingDto,
  getWorkOrderDto,
  numberValue,
} from "../lib/garage-data";
import { DEMO_LOCATION_ID, DEMO_ORG_ID } from "../lib/demo-seed";
import { asyncRoute, HttpError } from "../lib/http";
import { messageProvider } from "../lib/integrations/mock-commerce";
import { requireLookupResult, vehicleDataProvider } from "../lib/integrations/mock-rdw";
import { sql } from "drizzle-orm";

const router: IRouter = Router();
const round2 = (amount: number) =>
  Math.round((amount + Number.EPSILON) * 100) / 100;

const addLocalDayRange = (date = new Date()) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
};

function linesFromItems(
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    vatRate: number;
  }>,
) {
  const lines = items.map((item) => ({
    description: item.description,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    vatRate: item.vatRate,
    total: round2(item.quantity * item.unitPrice),
  }));
  const subtotal = round2(lines.reduce((sum, line) => sum + line.total, 0));
  const vatTotal = round2(
    lines.reduce((sum, line) => sum + round2(line.total * line.vatRate / 100), 0),
  );
  return { lines, subtotal, vatTotal, total: round2(subtotal + vatTotal) };
}

function toInvoiceDto(
  invoice: typeof invoicesTable.$inferSelect,
  customerName: string,
) {
  return {
    id: invoice.id,
    organizationId: invoice.organizationId,
    locationId: invoice.locationId,
    invoiceNumber: invoice.invoiceNumber,
    customerName,
    date: invoice.date.toISOString(),
    total: numberValue(invoice.total),
    vatTotal: numberValue(invoice.vatTotal),
    paymentStatus: invoice.paymentStatus,
    lines: invoice.lines,
  };
}

router.get(
  "/dashboard",
  requireGarageUser,
  requireGarageRole("owner", "manager", "reception"),
  asyncRoute(async (_req, res) => {
    const user = currentGarageUser(res);
    const { start: todayStart, end: tomorrowStart } = addLocalDayRange();
    const monthStart = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1);
    const [
      bookings,
      workOrders,
      estimates,
      invoices,
      inventory,
      leads,
      resources,
    ] = await Promise.all([
      db.select().from(bookingsTable)
        .where(and(
          eq(bookingsTable.organizationId, user.organizationId),
          gte(bookingsTable.startsAt, todayStart),
          lt(bookingsTable.startsAt, tomorrowStart),
        )),
      db.select().from(workOrdersTable)
        .where(eq(workOrdersTable.organizationId, user.organizationId)),
      db.select().from(estimatesTable)
        .where(eq(estimatesTable.organizationId, user.organizationId)),
      db.select().from(invoicesTable)
        .where(and(
          eq(invoicesTable.organizationId, user.organizationId),
          gte(invoicesTable.date, monthStart),
        )),
      db.select().from(inventoryItemsTable)
        .where(eq(inventoryItemsTable.organizationId, user.organizationId)),
      db.select().from(usedVehicleLeadsTable)
        .where(and(
          eq(usedVehicleLeadsTable.organizationId, user.organizationId),
          eq(usedVehicleLeadsTable.status, "new"),
        )),
      db.select().from(workshopResourcesTable)
        .where(and(
          eq(workshopResourcesTable.organizationId, user.organizationId),
          eq(workshopResourcesTable.status, "active"),
        )),
    ]);

    const scheduledBookings = bookings.filter((booking) => booking.status !== "cancelled");
    const bookingsForToday = await Promise.all(
      scheduledBookings.map((booking) =>
        db.select({
          booking: bookingsTable,
          customerName: customersTable.name,
          vehicle: vehiclesTable,
          serviceName: servicesTable.name,
        })
          .from(bookingsTable)
          .innerJoin(customersTable, eq(bookingsTable.customerId, customersTable.id))
          .innerJoin(vehiclesTable, eq(bookingsTable.vehicleId, vehiclesTable.id))
          .innerJoin(servicesTable, eq(bookingsTable.serviceId, servicesTable.id))
          .where(eq(bookingsTable.id, booking.id))
          .limit(1),
      ),
    );
    const schedule = bookingsForToday.flatMap((rows) =>
      rows[0] ? [bookingDtoFromRow(rows[0])] : [],
    ).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    const inWorkshop = workOrders.filter((workOrder) =>
      ["vehicle_received", "diagnosis", "waiting_approval", "approved", "in_repair", "ready"].includes(workOrder.status),
    ).length;
    const openEstimates = estimates.filter((estimate) =>
      ["draft", "sent", "contact_requested"].includes(estimate.status),
    );
    const monthInvoices = invoices.filter((invoice) => invoice.date < tomorrowStart);
    const todayRevenue = invoices
      .filter((invoice) => invoice.date >= todayStart && invoice.date < tomorrowStart)
      .reduce((sum, invoice) => sum + numberValue(invoice.total), 0);
    const monthRevenue = monthInvoices.reduce(
      (sum, invoice) => sum + numberValue(invoice.total),
      0,
    );
    const unpaidInvoices = invoices
      .filter((invoice) => invoice.paymentStatus !== "paid")
      .reduce((sum, invoice) => sum + numberValue(invoice.total), 0);
    const availableMinutes = Math.max(1, resources.length * 8 * 60);
    const workshopUtilization = Math.min(
      100,
      Math.round(scheduledBookings.reduce((sum, booking) => sum + booking.durationMinutes, 0) / availableMinutes * 100),
    );
    const payload = {
      date: todayStart.toISOString().slice(0, 10),
      appointments: scheduledBookings.length,
      vehiclesInWorkshop: inWorkshop,
      waitingApproval: workOrders.filter((workOrder) => workOrder.status === "waiting_approval").length,
      readyForCollection: workOrders.filter((workOrder) => workOrder.status === "ready").length,
      openEstimates: openEstimates.length,
      newLeads: leads.length,
      todayRevenue: round2(todayRevenue),
      monthRevenue: round2(monthRevenue),
      workshopUtilization,
      unpaidInvoices: round2(unpaidInvoices),
      lowStockParts: inventory.filter((item) => item.stock <= item.minimumStock).length,
      schedule,
    };
    res.json(GetDashboardResponse.parse(payload));
  }),
);

router.get(
  "/bookings",
  requireGarageUser,
  requireGarageRole("owner", "manager", "reception", "mechanic", "customer"),
  asyncRoute(async (_req, res) => {
    const user = currentGarageUser(res);
    const rows = await db
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
      .where(and(
        eq(bookingsTable.organizationId, user.organizationId),
        user.role === "customer"
          ? eq(bookingsTable.customerId, user.customerId ?? "")
          : undefined,
      ))
      .orderBy(desc(bookingsTable.startsAt));
    res.json(ListBookingsResponse.parse(rows.map(bookingDtoFromRow)));
  }),
);

router.post(
  "/bookings",
  asyncRoute(async (req, res) => {
    const body = CreateBookingBody.parse(req.body);
    if (body.startsAt <= new Date()) {
      throw new HttpError(400, "Choose a future appointment time.", "appointment_in_past");
    }
    if (body.startsAt.getTime() > Date.now() + 90 * 86_400_000) {
      throw new HttpError(400, "Appointments can be booked up to 90 days ahead.", "appointment_too_far");
    }
    const plate = body.registrationNumber.toUpperCase().replace(/[^A-Z0-9]/g, "");
    const [service] = await db
      .select()
      .from(servicesTable)
      .where(and(
        eq(servicesTable.id, body.serviceId),
        eq(servicesTable.organizationId, DEMO_ORG_ID),
        eq(servicesTable.status, "active"),
      ))
      .limit(1);
    if (!service) throw new HttpError(404, "Service not found.", "not_found");
    const vehicleDetails = requireLookupResult(
      await vehicleDataProvider.lookup(body.registrationNumber),
    );
    const existingCustomer = await db
      .select()
      .from(customersTable)
      .where(and(
        eq(customersTable.organizationId, DEMO_ORG_ID),
        eq(customersTable.email, body.email.trim().toLowerCase()),
      ))
      .limit(1);
    const existingVehicle = await db
      .select()
      .from(vehiclesTable)
      .where(and(
        eq(vehiclesTable.organizationId, DEMO_ORG_ID),
        eq(vehiclesTable.registrationNumber, vehicleDetails.registrationNumber),
      ))
      .limit(1);
    let customer = existingCustomer[0];
    if (existingVehicle[0] && (!customer || existingVehicle[0].customerId !== customer.id)) {
      throw new HttpError(
        409,
        "For a vehicle already registered with this garage, use the email address on file or contact reception.",
        "vehicle_customer_mismatch",
      );
    }
    if (!customer) {
      [customer] = await db
        .insert(customersTable)
        .values({
          organizationId: DEMO_ORG_ID,
          locationId: DEMO_LOCATION_ID,
          name: body.customerName.trim(),
          email: body.email.trim().toLowerCase(),
          phone: body.phone.trim(),
          preferredLanguage: body.preferredLanguage ?? "nl",
          address: null,
          notes: "",
        })
        .returning();
    }
    if (!customer) throw new HttpError(500, "Customer record could not be created.");
    let vehicle = existingVehicle[0];
    if (!vehicle) {
      const apkExpiry = new Date();
      apkExpiry.setFullYear(apkExpiry.getFullYear() + 1);
      [vehicle] = await db
        .insert(vehiclesTable)
        .values({
          organizationId: DEMO_ORG_ID,
          locationId: DEMO_LOCATION_ID,
          customerId: customer.id,
          registrationNumber: vehicleDetails.registrationNumber,
          vin: null,
          make: vehicleDetails.make,
          model: vehicleDetails.model,
          variant: vehicleDetails.variant,
          fuelType: vehicleDetails.fuelType,
          year: vehicleDetails.year,
          mileage: 0,
          apkExpiry: apkExpiry.toISOString().slice(0, 10),
          status: "active",
        })
        .returning();
    }
    if (!vehicle) throw new HttpError(500, "Vehicle record could not be created.");

    const candidates = await db
      .select()
      .from(workshopResourcesTable)
      .where(and(
        eq(workshopResourcesTable.organizationId, DEMO_ORG_ID),
        eq(workshopResourcesTable.locationId, DEMO_LOCATION_ID),
        eq(workshopResourcesTable.type, service.requiredResourceType),
        eq(workshopResourcesTable.status, "active"),
      ));
    if (!candidates.length) {
      throw new HttpError(409, "No workshop resource is configured for this service.", "resource_unavailable");
    }
    const { start, end } = addLocalDayRange(body.startsAt);
    const sameDayBookings = await db
      .select()
      .from(bookingsTable)
      .where(and(
        eq(bookingsTable.organizationId, DEMO_ORG_ID),
        eq(bookingsTable.locationId, DEMO_LOCATION_ID),
        gte(bookingsTable.startsAt, start),
        lt(bookingsTable.startsAt, end),
        inArray(bookingsTable.status, ["requested", "confirmed", "vehicle_received"]),
      ));
    const requestedEnd = body.startsAt.getTime() + service.estimatedDurationMinutes * 60_000;
    const resource = candidates.find((candidate) => {
      if (!candidate.capacity || candidate.capacity < 1) return false;
      const sameResourceBookings = sameDayBookings.filter(
        (booking) => booking.resource === candidate.name,
      );
      return sameResourceBookings.every((booking) => {
        const bookedStart = booking.startsAt.getTime();
        const bookedEnd = bookedStart + booking.durationMinutes * 60_000;
        return requestedEnd <= bookedStart || body.startsAt.getTime() >= bookedEnd;
      });
    });
    if (!resource) {
      throw new HttpError(409, "That time is full. Please choose another appointment.", "time_slot_full");
    }

    const [booking] = await db
      .insert(bookingsTable)
      .values({
        organizationId: DEMO_ORG_ID,
        locationId: DEMO_LOCATION_ID,
        customerId: customer.id,
        vehicleId: vehicle.id,
        serviceId: service.id,
        startsAt: body.startsAt,
        durationMinutes: service.estimatedDurationMinutes,
        status: "confirmed",
        source: body.source ?? "website",
        problemDescription: body.problemDescription ?? null,
        assignedMechanic: null,
        resource: resource.name,
      })
      .returning();
    if (!booking) throw new HttpError(500, "Appointment could not be created.");
    const dto = await getBookingDto(booking.id, DEMO_ORG_ID);
    await addGarageNotification(DEMO_ORG_ID, DEMO_LOCATION_ID, {
      title: "New online booking",
      message: `${customer.name} booked ${service.name} for ${vehicle.make} ${vehicle.model}.`,
      type: "booking",
    });
    await messageProvider.send({ channel: "email", recipient: customer.email });
    req.log.info({ bookingId: booking.id, source: booking.source }, "Demo booking created");
    res.status(201).json(CreateBookingResponse.parse(dto));
  }),
);

router.post(
  "/bookings/:bookingId/receive",
  requireGarageUser,
  requireGarageRole("owner", "manager", "reception", "mechanic"),
  asyncRoute(async (req, res) => {
    const user = currentGarageUser(res);
    const { bookingId } = ReceiveBookingParams.parse(req.params);
    const body = ReceiveBookingBody.parse(req.body);
    const [booking] = await db
      .select()
      .from(bookingsTable)
      .where(and(
        eq(bookingsTable.id, bookingId),
        eq(bookingsTable.organizationId, user.organizationId),
      ))
      .limit(1);
    if (!booking) throw new HttpError(404, "Booking not found.", "not_found");
    if (!["requested", "confirmed"].includes(booking.status)) {
      throw new HttpError(409, "This booking has already been received or cancelled.", "booking_not_receivable");
    }
    const [customer] = await db.select().from(customersTable)
      .where(eq(customersTable.id, booking.customerId)).limit(1);
    if (!customer) throw new HttpError(404, "Booking customer not found.", "not_found");
    const [created] = await db.transaction(async (tx) => {
      const [order] = await tx.insert(workOrdersTable).values({
        organizationId: user.organizationId,
        locationId: user.locationId,
        bookingId: booking.id,
        customerId: booking.customerId,
        vehicleId: booking.vehicleId,
        status: "vehicle_received",
        complaint: body.customerComplaint,
        diagnosis: "",
        workPerformed: "",
        assignedMechanic: booking.assignedMechanic ?? "",
        mileage: body.mileage,
        fuelLevel: body.fuelLevel ?? null,
        visibleDamageNotes: body.visibleDamageNotes ?? "",
        additionalNotes: body.additionalNotes ?? "",
        createdBy: user.id,
      }).onConflictDoNothing({
        target: [workOrdersTable.organizationId, workOrdersTable.bookingId],
      }).returning();
      if (order) {
        await tx.update(bookingsTable)
          .set({ status: "vehicle_received" })
          .where(eq(bookingsTable.id, booking.id));
      }
      return [order];
    });
    if (!created) {
      throw new HttpError(409, "A work order already exists for this booking.", "work_order_exists");
    }
    await auditGarageAction(user, "booking.vehicle_received", "booking", booking.id, {
      workOrderId: created.id,
      mileage: body.mileage,
    });
    const dto = await getWorkOrderDto(created.id, user.organizationId);
    const result = {
      ...dto,
      status: dto.status,
      items: dto.items,
    };
    res.status(201).json(ReceiveBookingResponse.parse(result));
  }),
);

router.get(
  "/work-orders",
  requireGarageUser,
  requireGarageRole("owner", "manager", "reception", "mechanic", "customer"),
  asyncRoute(async (_req, res) => {
    const user = currentGarageUser(res);
    if (user.role === "customer" && !user.customerId) {
      throw new HttpError(403, "Customer account is not linked to a garage record.", "customer_unlinked");
    }
    const orders = await db
      .select({ id: workOrdersTable.id })
      .from(workOrdersTable)
      .where(and(
        eq(workOrdersTable.organizationId, user.organizationId),
        user.role === "customer"
          ? eq(workOrdersTable.customerId, user.customerId ?? "")
          : undefined,
      ))
      .orderBy(desc(workOrdersTable.updatedAt));
    const dtos = await Promise.all(orders.map(({ id }) =>
      getWorkOrderDto(id, user.organizationId, {
        customerId: user.role === "customer" ? user.customerId ?? undefined : undefined,
        hideInternalNotes: user.role === "customer",
      }),
    ));
    res.json(ListWorkOrdersResponse.parse(dtos));
  }),
);

router.get(
  "/work-orders/:workOrderId",
  requireGarageUser,
  asyncRoute(async (req, res) => {
    const user = currentGarageUser(res);
    if (user.role === "customer" && !user.customerId) {
      throw new HttpError(403, "Customer account is not linked to a garage record.", "customer_unlinked");
    }
    const { workOrderId } = GetWorkOrderParams.parse(req.params);
    const dto = await getWorkOrderDto(workOrderId, user.organizationId, {
      customerId: user.role === "customer" ? user.customerId ?? undefined : undefined,
      hideInternalNotes: user.role === "customer",
    });
    res.json(GetWorkOrderResponse.parse(dto));
  }),
);

router.patch(
  "/work-orders/:workOrderId",
  requireGarageUser,
  requireGarageRole("owner", "manager", "mechanic"),
  asyncRoute(async (req, res) => {
    const user = currentGarageUser(res);
    const { workOrderId } = UpdateWorkOrderParams.parse(req.params);
    const body = UpdateWorkOrderBody.parse(req.body);
    const [existing] = await db.select().from(workOrdersTable)
      .where(and(
        eq(workOrdersTable.id, workOrderId),
        eq(workOrdersTable.organizationId, user.organizationId),
      )).limit(1);
    if (!existing) throw new HttpError(404, "Work order not found.", "not_found");
    if (existing.status === "completed" || existing.status === "cancelled") {
      throw new HttpError(409, "This work order is closed.", "work_order_closed");
    }
    if (body.status === "completed") {
      throw new HttpError(409, "Use the completion action to close a work order.", "use_completion_action");
    }
    if (body.status === "approved" && existing.status !== "approved") {
      throw new HttpError(409, "Only the customer can approve an estimate.", "customer_approval_required");
    }
    if (body.status === "in_repair" && !["approved", "in_repair"].includes(existing.status)) {
      throw new HttpError(409, "Customer approval is required before work can begin.", "approval_required");
    }
    if (body.status === "ready" && !["approved", "in_repair", "ready"].includes(existing.status)) {
      throw new HttpError(409, "The work order must be approved before it can be marked ready.", "approval_required");
    }
    const values: Partial<typeof workOrdersTable.$inferInsert> = {
      ...(body.status ? { status: body.status } : {}),
      ...(body.diagnosis !== undefined ? { diagnosis: body.diagnosis } : {}),
      ...(body.assignedMechanic !== undefined ? { assignedMechanic: body.assignedMechanic } : {}),
      ...(body.workPerformed !== undefined ? { workPerformed: body.workPerformed } : {}),
    };
    if (body.items && ["approved", "in_repair", "ready"].includes(existing.status)) {
      values.status = "diagnosis";
    }
    await db.transaction(async (tx) => {
      if (body.items) {
        for (const item of body.items) {
          if (item.inventoryItemId) {
            const [inventoryItem] = await tx.select().from(inventoryItemsTable)
              .where(and(
                eq(inventoryItemsTable.id, item.inventoryItemId),
                eq(inventoryItemsTable.organizationId, user.organizationId),
                eq(inventoryItemsTable.status, "active"),
              )).limit(1);
            if (!inventoryItem) {
              throw new HttpError(404, "A selected part is not available in this garage.", "inventory_item_not_found");
            }
            if (item.kind === "part" && !Number.isInteger(item.quantity)) {
              throw new HttpError(400, "Part quantities must be whole numbers.", "invalid_part_quantity");
            }
          }
        }
        await tx.delete(workOrderItemsTable).where(and(
          eq(workOrderItemsTable.workOrderId, existing.id),
          eq(workOrderItemsTable.organizationId, user.organizationId),
        ));
        if (body.items.length) {
          await tx.insert(workOrderItemsTable).values(body.items.map((item) => ({
            organizationId: user.organizationId,
            locationId: user.locationId,
            workOrderId: existing.id,
            kind: item.kind,
            description: item.description,
            quantity: String(item.quantity),
            unitPrice: item.unitPrice.toFixed(2),
            vatRate: item.vatRate.toFixed(2),
            total: round2(item.quantity * item.unitPrice).toFixed(2),
            inventoryItemId: item.inventoryItemId ?? null,
            status: "active",
            createdBy: user.id,
          })));
        }
        await tx.update(estimatesTable).set({
          status: "declined",
          decision: "decline",
          decisionTimestamp: new Date(),
          customerMessage: "This estimate was replaced by an updated work order.",
        }).where(and(
          eq(estimatesTable.workOrderId, existing.id),
          eq(estimatesTable.organizationId, user.organizationId),
          inArray(estimatesTable.status, ["draft", "sent"]),
          isNull(estimatesTable.decisionTimestamp),
        ));
      }
      await tx.update(workOrdersTable)
        .set(values)
        .where(and(
          eq(workOrdersTable.id, existing.id),
          eq(workOrdersTable.organizationId, user.organizationId),
        ));
    });
    await auditGarageAction(user, "work_order.updated", "work_order", existing.id, {
      fields: Object.keys(body),
    });
    const dto = await getWorkOrderDto(existing.id, user.organizationId);
    res.json(UpdateWorkOrderResponse.parse(dto));
  }),
);

router.post(
  "/work-orders/:workOrderId/estimate",
  requireGarageUser,
  requireGarageRole("owner", "manager", "mechanic"),
  asyncRoute(async (req, res) => {
    const user = currentGarageUser(res);
    const { workOrderId } = CreateEstimateParams.parse(req.params);
    const [workOrder] = await db.select().from(workOrdersTable)
      .where(and(
        eq(workOrdersTable.id, workOrderId),
        eq(workOrdersTable.organizationId, user.organizationId),
      )).limit(1);
    if (!workOrder) throw new HttpError(404, "Work order not found.", "not_found");
    if (!workOrder.diagnosis.trim()) {
      throw new HttpError(409, "Add a diagnosis before creating an estimate.", "diagnosis_required");
    }
    const items = await db.select().from(workOrderItemsTable).where(and(
      eq(workOrderItemsTable.workOrderId, workOrderId),
      eq(workOrderItemsTable.organizationId, user.organizationId),
      eq(workOrderItemsTable.status, "active"),
    ));
    if (!items.length) throw new HttpError(409, "Add labour or parts before creating an estimate.", "estimate_items_required");
    const amounts = linesFromItems(items.map((item) => ({
      description: item.description,
      quantity: numberValue(item.quantity),
      unitPrice: numberValue(item.unitPrice),
      vatRate: numberValue(item.vatRate),
    })));
    const [openEstimate] = await db.select().from(estimatesTable)
      .where(and(
        eq(estimatesTable.workOrderId, workOrderId),
        eq(estimatesTable.organizationId, user.organizationId),
        inArray(estimatesTable.status, ["draft", "sent"]),
        isNull(estimatesTable.decisionTimestamp),
      ))
      .orderBy(desc(estimatesTable.createdAt))
      .limit(1);
    let estimate: typeof estimatesTable.$inferSelect | undefined;
    if (openEstimate) {
      [estimate] = await db.update(estimatesTable).set({
        status: "sent",
        decision: null,
        lines: amounts.lines,
        subtotal: amounts.subtotal.toFixed(2),
        vatTotal: amounts.vatTotal.toFixed(2),
        total: amounts.total.toFixed(2),
        decisionTimestamp: null,
        createdBy: user.id,
      }).where(eq(estimatesTable.id, openEstimate.id)).returning();
    } else {
      [estimate] = await db.insert(estimatesTable).values({
        organizationId: user.organizationId,
        locationId: user.locationId,
        workOrderId,
        status: "sent",
        decision: null,
        lines: amounts.lines,
        subtotal: amounts.subtotal.toFixed(2),
        vatTotal: amounts.vatTotal.toFixed(2),
        total: amounts.total.toFixed(2),
        decisionTimestamp: null,
        createdBy: user.id,
      }).returning();
    }
    await db.update(workOrdersTable)
      .set({ status: "waiting_approval" })
      .where(eq(workOrdersTable.id, workOrderId));
    if (!estimate) throw new HttpError(500, "Estimate could not be saved.");
    const [customer] = await db.select().from(customersTable)
      .where(eq(customersTable.id, workOrder.customerId)).limit(1);
    if (customer) {
      await addGarageNotification(user.organizationId, user.locationId, {
        title: "Estimate ready for review",
        message: `A repair estimate for ${workOrder.complaint} is ready to review.`,
        type: "estimate",
        customerId: customer.id,
      });
      await messageProvider.send({ channel: "email", recipient: customer.email });
    }
    await auditGarageAction(user, "estimate.sent", "estimate", estimate.id, {
      workOrderId,
      total: amounts.total,
    });
    res.status(201).json(CreateEstimateResponse.parse(estimateDto(estimate)));
  }),
);

router.post(
  "/estimates/:estimateId/decision",
  requireGarageUser,
  requireGarageRole("customer"),
  asyncRoute(async (req, res) => {
    const user = currentGarageUser(res);
    if (!user.customerId) {
      throw new HttpError(403, "Customer account is not linked to a garage record.", "customer_unlinked");
    }
    const { estimateId } = DecideEstimateParams.parse(req.params);
    const body = DecideEstimateBody.parse(req.body);
    const [record] = await db.select({
      estimate: estimatesTable,
      workOrder: workOrdersTable,
    }).from(estimatesTable)
      .innerJoin(workOrdersTable, eq(estimatesTable.workOrderId, workOrdersTable.id))
      .where(and(
        eq(estimatesTable.id, estimateId),
        eq(estimatesTable.organizationId, user.organizationId),
        eq(workOrdersTable.customerId, user.customerId),
      )).limit(1);
    if (!record) throw new HttpError(404, "Estimate not found.", "not_found");
    if (record.estimate.decisionTimestamp) {
      throw new HttpError(409, "A decision has already been recorded for this estimate.", "decision_exists");
    }
    const status = body.decision === "approve"
      ? "approved"
      : body.decision === "decline"
        ? "declined"
        : "contact_requested";
    const [updated] = await db.transaction(async (tx) => {
      const [estimate] = await tx.update(estimatesTable).set({
        status,
        decision: body.decision,
        decisionTimestamp: new Date(),
        customerMessage: body.customerMessage ?? "",
      }).where(and(
        eq(estimatesTable.id, estimateId),
        isNull(estimatesTable.decisionTimestamp),
      )).returning();
      if (estimate) {
        await tx.update(workOrdersTable).set({
          status: body.decision === "approve" ? "approved" : "waiting_approval",
        }).where(eq(workOrdersTable.id, record.workOrder.id));
      }
      return [estimate];
    });
    if (!updated) throw new HttpError(409, "A decision was recorded by another session.", "decision_exists");
    await addGarageNotification(user.organizationId, user.locationId, {
      title: body.decision === "approve" ? "Estimate approved" : "Customer responded to estimate",
      message: `${user.name} selected ${body.decision} for ${record.workOrder.complaint}.`,
      type: "estimate",
    });
    await auditGarageAction(user, `estimate.${body.decision}`, "estimate", estimateId, {
      workOrderId: record.workOrder.id,
      customerMessage: body.customerMessage ?? "",
    });
    res.json(DecideEstimateResponse.parse(estimateDto(updated)));
  }),
);

router.post(
  "/work-orders/:workOrderId/complete",
  requireGarageUser,
  requireGarageRole("owner", "manager", "mechanic"),
  asyncRoute(async (req, res) => {
    const user = currentGarageUser(res);
    const { workOrderId } = CompleteWorkOrderParams.parse(req.params);
    const [record] = await db.select({
      workOrder: workOrdersTable,
      customer: customersTable,
      vehicle: vehiclesTable,
      service: servicesTable,
    }).from(workOrdersTable)
      .innerJoin(customersTable, eq(workOrdersTable.customerId, customersTable.id))
      .innerJoin(vehiclesTable, eq(workOrdersTable.vehicleId, vehiclesTable.id))
      .innerJoin(bookingsTable, eq(workOrdersTable.bookingId, bookingsTable.id))
      .innerJoin(servicesTable, eq(bookingsTable.serviceId, servicesTable.id))
      .where(and(
        eq(workOrdersTable.id, workOrderId),
        eq(workOrdersTable.organizationId, user.organizationId),
      )).limit(1);
    if (!record) throw new HttpError(404, "Work order not found.", "not_found");
    if (record.workOrder.status === "completed") {
      throw new HttpError(409, "This work order is already complete.", "already_completed");
    }
    if (!["ready", "approved", "in_repair"].includes(record.workOrder.status)) {
      throw new HttpError(409, "Complete the approved repair before closing the work order.", "work_not_ready");
    }
    const [estimate] = await db.select().from(estimatesTable)
      .where(and(
        eq(estimatesTable.workOrderId, workOrderId),
        eq(estimatesTable.organizationId, user.organizationId),
      ))
      .orderBy(desc(estimatesTable.createdAt))
      .limit(1);
    if (estimate && estimate.status !== "approved") {
      throw new HttpError(409, "The customer's estimate decision is required before completion.", "approval_required");
    }
    const items = await db.select().from(workOrderItemsTable).where(and(
      eq(workOrderItemsTable.workOrderId, workOrderId),
      eq(workOrderItemsTable.organizationId, user.organizationId),
      eq(workOrderItemsTable.status, "active"),
    ));
    const amounts = linesFromItems(items.map((item) => ({
      description: item.description,
      quantity: numberValue(item.quantity),
      unitPrice: numberValue(item.unitPrice),
      vatRate: numberValue(item.vatRate),
    })));
    if (!items.length) throw new HttpError(409, "Add completed labour or parts before closing the work order.", "work_items_required");

    const invoiceNumber = `VD-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
    const serviceGarage = `${user.organizationName} · ${record.workOrder.locationId === user.locationId ? "Utrecht" : "Werkplaats"}`;
    const technicalWork = record.workOrder.workPerformed.trim() || record.workOrder.diagnosis.trim();
    const serviceType = record.service.name;

    const [createdInvoice, createdRecord] = await db.transaction(async (tx) => {
      for (const item of items) {
        if (!item.inventoryItemId || item.kind !== "part") continue;
        const qty = numberValue(item.quantity);
        if (!Number.isInteger(qty)) {
          throw new HttpError(400, "Part quantities must be whole numbers.", "invalid_part_quantity");
        }
        const [updatedItem] = await tx.update(inventoryItemsTable).set({
          stock: sql`${inventoryItemsTable.stock} - ${qty}`,
        }).where(and(
          eq(inventoryItemsTable.id, item.inventoryItemId),
          eq(inventoryItemsTable.organizationId, user.organizationId),
          gte(inventoryItemsTable.stock, qty),
        )).returning();
        if (!updatedItem) {
          throw new HttpError(409, `Not enough stock for ${item.description}.`, "insufficient_stock");
        }
      }
      const [invoice] = await tx.insert(invoicesTable).values({
        organizationId: user.organizationId,
        locationId: user.locationId,
        workOrderId,
        customerId: record.workOrder.customerId,
        invoiceNumber,
        date: new Date(),
        lines: amounts.lines,
        vatTotal: amounts.vatTotal.toFixed(2),
        total: amounts.total.toFixed(2),
        paymentStatus: "unpaid",
        status: "issued",
        createdBy: user.id,
      }).returning();
      const [serviceRecord] = await tx.insert(portableServiceRecordsTable).values({
        organizationId: user.organizationId,
        locationId: user.locationId,
        vehicleId: record.workOrder.vehicleId,
        workOrderId,
        serviceDate: new Date(),
        mileage: record.workOrder.mileage,
        serviceType,
        workPerformed: technicalWork,
        partsInstalled: items.filter((item) => item.kind === "part").map((item) => item.description),
        partManufacturer: "",
        partNumber: "",
        fluids: items.filter((item) => item.description.toLowerCase().includes("olie"))
          .map((item) => item.description).join(", "),
        technicalResult: record.workOrder.diagnosis || "Werk volgens opdracht uitgevoerd.",
        serviceGarage,
        verificationStatus: "verified",
        status: "published",
        createdBy: user.id,
      }).returning();
      if (!invoice || !serviceRecord) {
        throw new HttpError(500, "Invoice or technical service record could not be created.");
      }
      await tx.insert(garageCommercialRecordsTable).values({
        organizationId: user.organizationId,
        locationId: user.locationId,
        workOrderId,
        invoiceId: invoice.id,
        privateNotes: `Private commercial record for invoice ${invoice.invoiceNumber}.`,
        status: "completed",
        createdBy: user.id,
      });
      await tx.update(workOrdersTable).set({ status: "completed" })
        .where(and(
          eq(workOrdersTable.id, workOrderId),
          eq(workOrdersTable.organizationId, user.organizationId),
        ));
      return [invoice, serviceRecord];
    });
    if (!createdInvoice || !createdRecord) {
      throw new HttpError(500, "Work order completion could not be recorded.");
    }
    await auditGarageAction(user, "work_order.completed", "work_order", workOrderId, {
      invoiceId: createdInvoice.id,
      serviceRecordId: createdRecord.id,
      inventoryItemsConsumed: items.filter((item) => Boolean(item.inventoryItemId)).length,
    });
    await addGarageNotification(user.organizationId, user.locationId, {
      title: "Work order completed",
      message: `${record.vehicle.make} ${record.vehicle.model} is ready. Invoice ${createdInvoice.invoiceNumber} is available.`,
      type: "vehicle",
      customerId: record.workOrder.customerId,
    });
    await messageProvider.send({ channel: "email", recipient: record.customer.email });
    const workOrderDto = await getWorkOrderDto(workOrderId, user.organizationId);
    const serviceRecordDto = {
      id: createdRecord.id,
      organizationId: createdRecord.organizationId,
      locationId: createdRecord.locationId,
      vehicleId: createdRecord.vehicleId,
      serviceDate: createdRecord.serviceDate.toISOString(),
      mileage: createdRecord.mileage,
      serviceType: createdRecord.serviceType,
      workPerformed: createdRecord.workPerformed,
      partsInstalled: createdRecord.partsInstalled,
      partManufacturer: createdRecord.partManufacturer,
      partNumber: createdRecord.partNumber,
      fluids: createdRecord.fluids,
      technicalResult: createdRecord.technicalResult,
      serviceGarage: createdRecord.serviceGarage,
      verificationStatus: createdRecord.verificationStatus,
    };
    const result = {
      workOrder: workOrderDto,
      invoice: toInvoiceDto(createdInvoice, record.customer.name),
      serviceRecord: serviceRecordDto,
    };
    res.json(CompleteWorkOrderResponse.parse(result));
  }),
);

router.get(
  "/invoices",
  requireGarageUser,
  requireGarageRole("owner", "manager", "reception", "customer"),
  asyncRoute(async (_req, res) => {
    const user = currentGarageUser(res);
    if (user.role === "customer" && !user.customerId) {
      throw new HttpError(403, "Customer account is not linked to a garage record.", "customer_unlinked");
    }
    const rows = await db
      .select({ invoice: invoicesTable, customerName: customersTable.name })
      .from(invoicesTable)
      .innerJoin(customersTable, eq(invoicesTable.customerId, customersTable.id))
      .where(and(
        eq(invoicesTable.organizationId, user.organizationId),
        user.role === "customer"
          ? eq(invoicesTable.customerId, user.customerId ?? "")
          : undefined,
      ))
      .orderBy(desc(invoicesTable.date));
    res.json(ListInvoicesResponse.parse(rows.map(({ invoice, customerName }) =>
      toInvoiceDto(invoice, customerName),
    )));
  }),
);

router.get(
  "/notifications",
  requireGarageUser,
  asyncRoute(async (_req, res) => {
    const user = currentGarageUser(res);
    const notifications = await db.select().from(notificationsTable)
      .where(and(
        eq(notificationsTable.organizationId, user.organizationId),
        user.role === "customer"
          ? or(
              eq(notificationsTable.customerId, user.customerId ?? ""),
              isNull(notificationsTable.customerId),
            )
          : undefined,
      ))
      .orderBy(desc(notificationsTable.createdAt));
    res.json(ListNotificationsResponse.parse(notifications.map((notification) => ({
      id: notification.id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      createdAt: notification.createdAt.toISOString(),
      read: notification.read,
    }))));
  }),
);

export default router;
