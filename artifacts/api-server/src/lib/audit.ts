import { db, auditEventsTable, notificationsTable } from "@workspace/db";
import type { GarageUser } from "./auth";

export async function auditGarageAction(
  user: GarageUser,
  action: string,
  resourceType: string,
  resourceId: string,
  details: Record<string, unknown> = {},
) {
  await db.insert(auditEventsTable).values({
    organizationId: user.organizationId,
    locationId: user.locationId,
    actorUserId: user.id,
    action,
    resourceType,
    resourceId,
    details,
  });
}

export async function addGarageNotification(
  organizationId: string,
  locationId: string,
  input: {
    title: string;
    message: string;
    type: string;
    customerId?: string | null;
  },
) {
  const [notification] = await db
    .insert(notificationsTable)
    .values({
      organizationId,
      locationId,
      customerId: input.customerId ?? null,
      title: input.title,
      message: input.message,
      type: input.type,
      read: false,
    })
    .returning();
  return notification;
}
