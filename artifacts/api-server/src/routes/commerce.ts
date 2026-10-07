import { and, desc, eq, gte, sql } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  CreateInventoryItemBody,
  CreateInventoryItemResponse,
  CreateUsedVehicleBody,
  CreateUsedVehicleLeadBody,
  CreateUsedVehicleLeadParams,
  CreateUsedVehicleLeadResponse,
  CreateUsedVehicleResponse,
  DemoCheckoutBody,
  DemoCheckoutResponse,
  GetIntegrationOverviewResponse,
  ListInventoryResponse,
  ListShopProductsResponse,
  ListUsedVehiclesResponse,
  UpdateUsedVehicleBody,
  UpdateUsedVehicleParams,
  UpdateUsedVehicleResponse,
} from "@workspace/api-zod";
import { db } from "@workspace/db";
import {
  demoOrdersTable,
  inventoryItemsTable,
  shopProductsTable,
  usedVehicleLeadsTable,
  usedVehiclesTable,
} from "@workspace/db";
import { currentGarageUser, requireGarageRole, requireGarageUser } from "../lib/auth";
import { auditGarageAction } from "../lib/audit";
import { numberValue } from "../lib/garage-data";
import { DEMO_LOCATION_ID, DEMO_ORG_ID } from "../lib/demo-seed";
import { asyncRoute, HttpError } from "../lib/http";
import { paymentProvider } from "../lib/integrations/mock-commerce";

const router: IRouter = Router();

router.get(
  "/inventory",
  requireGarageUser,
  requireGarageRole("owner", "manager", "mechanic", "warehouse"),
  asyncRoute(async (_req, res) => {
    const user = currentGarageUser(res);
    const items = await db.select().from(inventoryItemsTable)
      .where(and(
        eq(inventoryItemsTable.organizationId, user.organizationId),
        eq(inventoryItemsTable.status, "active"),
      ))
      .orderBy(inventoryItemsTable.name);
    res.json(ListInventoryResponse.parse(items.map((item) => ({
      id: item.id,
      organizationId: item.organizationId,
      locationId: item.locationId,
      sku: item.sku,
      partNumber: item.partNumber,
      name: item.name,
      brand: item.brand,
      purchasePrice: numberValue(item.purchasePrice),
      salePrice: numberValue(item.salePrice),
      vatRate: numberValue(item.vatRate),
      stock: item.stock,
      minimumStock: item.minimumStock,
      storageLocation: item.storageLocation,
    }))));
  }),
);

router.post(
  "/inventory",
  requireGarageUser,
  requireGarageRole("owner", "manager", "warehouse"),
  asyncRoute(async (req, res) => {
    const user = currentGarageUser(res);
    const body = CreateInventoryItemBody.parse(req.body);
    const [item] = await db.insert(inventoryItemsTable).values({
      ...body,
      organizationId: user.organizationId,
      locationId: user.locationId,
      purchasePrice: body.purchasePrice.toFixed(2),
      salePrice: body.salePrice.toFixed(2),
      vatRate: body.vatRate.toFixed(2),
      compatibleVehicles: [],
      status: "active",
      createdBy: user.id,
    }).returning();
    if (!item) throw new HttpError(500, "Stock item could not be created.");
    await auditGarageAction(user, "inventory.item_created", "inventory_item", item.id);
    res.status(201).json(CreateInventoryItemResponse.parse({
      id: item.id,
      organizationId: item.organizationId,
      locationId: item.locationId,
      sku: item.sku,
      partNumber: item.partNumber,
      name: item.name,
      brand: item.brand,
      purchasePrice: numberValue(item.purchasePrice),
      salePrice: numberValue(item.salePrice),
      vatRate: numberValue(item.vatRate),
      stock: item.stock,
      minimumStock: item.minimumStock,
      storageLocation: item.storageLocation,
    }));
  }),
);

router.get(
  "/used-vehicles",
  asyncRoute(async (_req, res) => {
    const vehicles = await db.select().from(usedVehiclesTable)
      .where(and(
        eq(usedVehiclesTable.organizationId, DEMO_ORG_ID),
        eq(usedVehiclesTable.status, "published"),
      ))
      .orderBy(desc(usedVehiclesTable.updatedAt));
    res.json(ListUsedVehiclesResponse.parse(vehicles.map((vehicle) => ({
      id: vehicle.id,
      organizationId: vehicle.organizationId,
      locationId: vehicle.locationId,
      registration: vehicle.registration,
      make: vehicle.make,
      model: vehicle.model,
      variant: vehicle.variant,
      year: vehicle.year,
      mileage: vehicle.mileage,
      fuel: vehicle.fuel,
      transmission: vehicle.transmission,
      price: numberValue(vehicle.price),
      description: vehicle.description,
      features: vehicle.features,
      imageUrl: vehicle.imageUrl || undefined,
      apk: vehicle.apk,
      serviceHistoryAvailable: vehicle.serviceHistoryAvailable,
      status: vehicle.status,
    }))));
  }),
);

router.post(
  "/used-vehicles",
  requireGarageUser,
  requireGarageRole("owner", "manager", "sales"),
  asyncRoute(async (req, res) => {
    const user = currentGarageUser(res);
    const body = CreateUsedVehicleBody.parse(req.body);
    const [vehicle] = await db.insert(usedVehiclesTable).values({
      ...body,
      organizationId: user.organizationId,
      locationId: user.locationId,
      variant: body.variant ?? "",
      price: body.price.toFixed(2),
      description: body.description,
      features: body.features ?? [],
      imageUrl: "",
      apk: body.apk ?? "",
      serviceHistoryAvailable: body.serviceHistoryAvailable ?? false,
      status: body.status ?? "draft",
      createdBy: user.id,
    }).returning();
    if (!vehicle) throw new HttpError(500, "Used vehicle listing could not be created.");
    await auditGarageAction(user, "used_vehicle.created", "used_vehicle", vehicle.id);
    res.status(201).json(CreateUsedVehicleResponse.parse({
      id: vehicle.id,
      organizationId: vehicle.organizationId,
      locationId: vehicle.locationId,
      registration: vehicle.registration,
      make: vehicle.make,
      model: vehicle.model,
      variant: vehicle.variant,
      year: vehicle.year,
      mileage: vehicle.mileage,
      fuel: vehicle.fuel,
      transmission: vehicle.transmission,
      price: numberValue(vehicle.price),
      description: vehicle.description,
      features: vehicle.features,
      imageUrl: vehicle.imageUrl || undefined,
      apk: vehicle.apk,
      serviceHistoryAvailable: vehicle.serviceHistoryAvailable,
      status: vehicle.status,
    }));
  }),
);

router.patch(
  "/used-vehicles/:usedVehicleId",
  requireGarageUser,
  requireGarageRole("owner", "manager", "sales"),
  asyncRoute(async (req, res) => {
    const user = currentGarageUser(res);
    const { usedVehicleId } = UpdateUsedVehicleParams.parse(req.params);
    const body = UpdateUsedVehicleBody.parse(req.body);
    const [vehicle] = await db.update(usedVehiclesTable).set({
      ...(body.price !== undefined ? { price: body.price.toFixed(2) } : {}),
      ...(body.description !== undefined ? { description: body.description } : {}),
      ...(body.status !== undefined ? { status: body.status } : {}),
      ...(body.serviceHistoryAvailable !== undefined
        ? { serviceHistoryAvailable: body.serviceHistoryAvailable }
        : {}),
    }).where(and(
      eq(usedVehiclesTable.id, usedVehicleId),
      eq(usedVehiclesTable.organizationId, user.organizationId),
    )).returning();
    if (!vehicle) throw new HttpError(404, "Used vehicle listing not found.", "not_found");
    await auditGarageAction(user, "used_vehicle.updated", "used_vehicle", vehicle.id, {
      fields: Object.keys(body),
    });
    res.json(UpdateUsedVehicleResponse.parse({
      id: vehicle.id,
      organizationId: vehicle.organizationId,
      locationId: vehicle.locationId,
      registration: vehicle.registration,
      make: vehicle.make,
      model: vehicle.model,
      variant: vehicle.variant,
      year: vehicle.year,
      mileage: vehicle.mileage,
      fuel: vehicle.fuel,
      transmission: vehicle.transmission,
      price: numberValue(vehicle.price),
      description: vehicle.description,
      features: vehicle.features,
      imageUrl: vehicle.imageUrl || undefined,
      apk: vehicle.apk,
      serviceHistoryAvailable: vehicle.serviceHistoryAvailable,
      status: vehicle.status,
    }));
  }),
);

router.post(
  "/used-vehicles/:usedVehicleId/leads",
  asyncRoute(async (req, res) => {
    const { usedVehicleId } = CreateUsedVehicleLeadParams.parse(req.params);
    const body = CreateUsedVehicleLeadBody.parse(req.body);
    const [vehicle] = await db.select().from(usedVehiclesTable)
      .where(and(
        eq(usedVehiclesTable.id, usedVehicleId),
        eq(usedVehiclesTable.organizationId, DEMO_ORG_ID),
        eq(usedVehiclesTable.status, "published"),
      )).limit(1);
    if (!vehicle) throw new HttpError(404, "This vehicle listing is not available.", "not_found");
    const [lead] = await db.insert(usedVehicleLeadsTable).values({
      organizationId: DEMO_ORG_ID,
      locationId: DEMO_LOCATION_ID,
      usedVehicleId,
      name: body.name.trim(),
      email: body.email.trim().toLowerCase(),
      phone: body.phone.trim(),
      type: body.type,
      message: body.message ?? "",
      status: "new",
    }).returning();
    if (!lead) throw new HttpError(500, "Enquiry could not be saved.");
    res.status(201).json(CreateUsedVehicleLeadResponse.parse({
      id: lead.id,
      usedVehicleId: lead.usedVehicleId,
      name: lead.name,
      type: lead.type,
      createdAt: lead.createdAt.toISOString(),
    }));
  }),
);

router.get(
  "/shop/products",
  asyncRoute(async (_req, res) => {
    const products = await db.select().from(shopProductsTable)
      .where(and(
        eq(shopProductsTable.organizationId, DEMO_ORG_ID),
        eq(shopProductsTable.status, "active"),
      ))
      .orderBy(shopProductsTable.category, shopProductsTable.name);
    res.json(ListShopProductsResponse.parse(products.map((product) => ({
      id: product.id,
      name: product.name,
      category: product.category,
      brand: product.brand,
      price: numberValue(product.price),
      stock: product.stock,
      description: product.description,
      imageUrl: product.imageUrl || undefined,
    }))));
  }),
);

router.post(
  "/shop/demo-checkout",
  asyncRoute(async (req, res) => {
    const body = DemoCheckoutBody.parse(req.body);
    const quantityById = new Map<string, number>();
    for (const item of body.items) {
      quantityById.set(item.productId, (quantityById.get(item.productId) ?? 0) + item.quantity);
    }
    const productIds = [...quantityById.keys()];
    const products = await db.select().from(shopProductsTable)
      .where(and(
        eq(shopProductsTable.organizationId, DEMO_ORG_ID),
        eq(shopProductsTable.status, "active"),
        // A tenant's catalogue is intentionally the only catalogue the public shop can read.
      ));
    const items = products.filter((product) => quantityById.has(product.id));
    if (items.length !== productIds.length) {
      throw new HttpError(404, "One or more products are no longer available.", "product_not_found");
    }
    let total = 0;
    const orderItems = items.map((product) => {
      const quantity = quantityById.get(product.id)!;
      if (product.stock < quantity) {
        throw new HttpError(409, `${product.name} does not have enough demo stock.`, "insufficient_stock");
      }
      const price = numberValue(product.price);
      total += price * quantity;
      return { productId: product.id, name: product.name, quantity, price };
    });
    total = Math.round((total + Number.EPSILON) * 100) / 100;
    const orderNumber = `DEMO-${Date.now().toString().slice(-8)}`;
    const [order] = await db.transaction(async (tx) => {
      for (const item of orderItems) {
        const [updated] = await tx.update(shopProductsTable).set({
          stock: sql`${shopProductsTable.stock} - ${item.quantity}`,
        }).where(and(
          eq(shopProductsTable.id, item.productId),
          eq(shopProductsTable.organizationId, DEMO_ORG_ID),
          gte(shopProductsTable.stock, item.quantity),
        )).returning();
        if (!updated) {
          throw new HttpError(409, `${item.name} does not have enough demo stock.`, "insufficient_stock");
        }
      }
      return tx.insert(demoOrdersTable).values({
        organizationId: DEMO_ORG_ID,
        locationId: DEMO_LOCATION_ID,
        orderNumber,
        items: orderItems,
        total: total.toFixed(2),
        status: "demo",
      }).returning();
    });
    if (!order) throw new HttpError(500, "Demo checkout could not be saved.");
    const providerResult = await paymentProvider.checkout(order.orderNumber);
    res.status(201).json(DemoCheckoutResponse.parse({
      demo: true,
      orderNumber: order.orderNumber,
      total,
      message: providerResult.message,
    }));
  }),
);

router.get(
  "/integration/overview",
  asyncRoute(async (_req, res) => {
    res.json(GetIntegrationOverviewResponse.parse({
      garageName: "Van Dijk Auto Service",
      widgets: [
        {
          id: "rdw",
          name: "Vehicle data",
          description: "Fictional registration lookup; no live RDW connection.",
          demo: true,
        },
        {
          id: "notifications",
          name: "Customer updates",
          description: "Email and SMS adapter records demo events only; nothing is sent.",
          demo: true,
        },
        {
          id: "payments",
          name: "Payments",
          description: "Shop checkout writes a demo order and never takes a payment.",
          demo: true,
        },
        {
          id: "service-passport",
          name: "Service Passport",
          description: "Share only price-free technical records after customer consent.",
          demo: true,
        },
      ],
    }));
  }),
);

export default router;
