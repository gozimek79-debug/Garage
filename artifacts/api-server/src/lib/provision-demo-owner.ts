import { db, pool, usersTable } from "@workspace/db";
import { DEMO_LOCATION_ID, DEMO_ORG_ID } from "./demo-seed";

// Explicit operator action: never assign privileges to browser sign-ups.
try {
  const clerkUserId = process.env.GARAGE_OWNER_CLERK_USER_ID?.trim();
  const name = process.env.GARAGE_OWNER_NAME?.trim();
  const email = process.env.GARAGE_OWNER_EMAIL?.trim();
  if (!clerkUserId?.startsWith("user_") || !name || !email) {
    throw new Error("Set GARAGE_OWNER_CLERK_USER_ID (user_...), GARAGE_OWNER_NAME and GARAGE_OWNER_EMAIL. Run seed:demo first.");
  }
  const added = await db.insert(usersTable).values({
    clerkUserId, name, email,
    organizationId: DEMO_ORG_ID,
    locationId: DEMO_LOCATION_ID,
    role: "owner",
    status: "active",
  }).onConflictDoNothing({ target: usersTable.clerkUserId }).returning({ id: usersTable.id });
  if (!added.length) {
    throw new Error("This Clerk identity already has a membership. No privileges or tenant assignments were changed.");
  }
  console.log("Demo garage owner membership created.");
} finally {
  await pool.end();
}
