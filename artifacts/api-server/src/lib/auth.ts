import { getAuth } from "@clerk/express";
import { and, eq } from "drizzle-orm";
import type { RequestHandler, Response } from "express";
import { db } from "@workspace/db";
import { organizationsTable, usersTable } from "@workspace/db";
import { DEMO_LOCATION_ID, DEMO_ORG_ID, EMMA_CUSTOMER_ID } from "./demo-seed";
import { HttpError } from "./http";

export type GarageRole =
  | "owner"
  | "manager"
  | "reception"
  | "mechanic"
  | "sales"
  | "warehouse"
  | "customer";

export type GarageUser = {
  id: string;
  clerkUserId: string;
  organizationId: string;
  organizationName: string;
  locationId: string;
  customerId: string | null;
  name: string;
  email: string;
  role: GarageRole;
};

export const isDemoToolsEnabled = () =>
  process.env.ENABLE_DEMO_TOOLS === "true" &&
  process.env.NODE_ENV !== "production";

export const requireGarageUser: RequestHandler = asyncRouteForAuth(
  async (req, res, next) => {
    const auth = getAuth(req);
    const clerkUserId = auth.userId;
    if (!clerkUserId) {
      return res.status(401).json({
        error: "authentication_required",
        message: "Sign in to access this garage workspace.",
      });
    }

    let [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.clerkUserId, clerkUserId))
      .limit(1);

    if (!user && !isDemoToolsEnabled()) {
      return res.status(403).json({
        error: "garage_membership_required",
        message: "This account is not linked to a garage workspace yet.",
      });
    }

    if (!user) {
      const claims = (auth.sessionClaims ?? {}) as Record<string, unknown>;
      const name =
        typeof claims.name === "string" && claims.name.trim()
          ? claims.name.trim()
          : "Demo team member";
      const email =
        typeof claims.email === "string" && claims.email.trim()
          ? claims.email.trim()
          : "signed-in-demo-user@example.test";
      await db
        .insert(usersTable)
        .values({
          clerkUserId,
          organizationId: DEMO_ORG_ID,
          locationId: DEMO_LOCATION_ID,
          customerId: EMMA_CUSTOMER_ID,
          name,
          email,
          role: "owner",
          status: "active",
        })
        .onConflictDoNothing({ target: usersTable.clerkUserId });
      [user] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.clerkUserId, clerkUserId))
        .limit(1);
    }

    if (!user || user.status !== "active") {
      return res.status(403).json({
        error: "garage_membership_inactive",
        message: "This garage membership is not active.",
      });
    }
    const [organization] = await db
      .select({ name: organizationsTable.name })
      .from(organizationsTable)
      .where(
        and(
          eq(organizationsTable.id, user.organizationId),
          eq(organizationsTable.status, "active"),
        ),
      )
      .limit(1);
    if (!organization) {
      throw new HttpError(403, "The garage workspace is not active.", "garage_inactive");
    }

    res.locals.garageUser = {
      id: user.id,
      clerkUserId: user.clerkUserId,
      organizationId: user.organizationId,
      organizationName: organization.name,
      locationId: user.locationId,
      customerId: user.customerId,
      name: user.name,
      email: user.email,
      role: user.role as GarageRole,
    } satisfies GarageUser;
    return next();
  },
);

function asyncRouteForAuth(
  handler: (
    req: Parameters<RequestHandler>[0],
    res: Parameters<RequestHandler>[1],
    next: Parameters<RequestHandler>[2],
  ) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

export function requireGarageRole(...roles: GarageRole[]): RequestHandler {
  return (_req, res, next) => {
    const user = res.locals.garageUser as GarageUser | undefined;
    if (!user) {
      return res.status(401).json({
        error: "authentication_required",
        message: "Sign in to access this garage workspace.",
      });
    }
    if (!roles.includes(user.role)) {
      return res.status(403).json({
        error: "role_not_allowed",
        message: "Your current garage role cannot perform this action.",
      });
    }
    return next();
  };
}

export function currentGarageUser(res: Response): GarageUser {
  const user = res.locals.garageUser as GarageUser | undefined;
  if (!user) throw new HttpError(401, "Sign in to continue.", "authentication_required");
  return user;
}
