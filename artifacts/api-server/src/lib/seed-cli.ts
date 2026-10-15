import { pool } from "@workspace/db";
import { ensureDemoSeed } from "./demo-seed";

try {
  await ensureDemoSeed();
  console.log("Fictional garage demo data initialized.");
} finally {
  await pool.end();
}
