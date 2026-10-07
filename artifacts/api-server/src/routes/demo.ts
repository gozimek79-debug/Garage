import { eq } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  ResetDemoResponse,
  SwitchDemoRoleBody,
} from "@workspace/api-zod";
import { db, usersTable } from "@workspace/db";
import {
  currentGarageUser,
  isDemoToolsEnabled,
  requireGarageUser,
} from "../lib/auth";
import { auditGarageAction } from "../lib/audit";
import { resetDemoData } from "../lib/demo-seed";
import { asyncRoute, HttpError } from "../lib/http";

const router: IRouter = Router();

router.post(
  "/demo/role",
  requireGarageUser,
  asyncRoute(async (req, res) => {
    const user = currentGarageUser(res);
    if (!isDemoToolsEnabled()) {
      throw new HttpError(403, "Role switching is disabled outside the demo workspace.", "demo_tools_disabled");
    }
    const body = SwitchDemoRoleBody.parse(req.body);
    const [updated] = await db.update(usersTable)
      .set({ role: body.role })
      .where(eq(usersTable.id, user.id))
      .returning();
    if (!updated) throw new HttpError(404, "Garage membership not found.", "not_found");
    await auditGarageAction(user, "demo.role_switched", "user", user.id, {
      from: user.role,
      to: body.role,
    });
    res.json({
      userId: updated.id,
      userName: updated.name,
      organizationId: user.organizationId,
      organizationName: user.organizationName,
      locationId: user.locationId,
      role: updated.role,
      demoToolsEnabled: true,
    });
  }),
);

router.post(
  "/demo/reset",
  requireGarageUser,
  asyncRoute(async (_req, res) => {
    const user = currentGarageUser(res);
    if (!isDemoToolsEnabled()) {
      throw new HttpError(403, "Demo reset is disabled outside the demo workspace.", "demo_tools_disabled");
    }
    if (user.role !== "owner") {
      throw new HttpError(403, "Only the demo owner can restore the seeded data.", "role_not_allowed");
    }
    await resetDemoData();
    res.json(ResetDemoResponse.parse({
      ok: true,
      message: "The fictional Van Dijk Auto Service demo data has been restored.",
    }));
  }),
);

export default router;
