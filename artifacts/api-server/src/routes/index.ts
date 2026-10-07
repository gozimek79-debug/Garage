import { Router, type IRouter } from "express";
import healthRouter from "./health";
import tenantRouter from "./tenant";
import workshopRouter from "./workshop";
import commerceRouter from "./commerce";
import demoRouter from "./demo";
import { ensureDemoSeed } from "../lib/demo-seed";
import { HttpError } from "../lib/http";

const router: IRouter = Router();

router.use(healthRouter);
router.use(async (_req, _res, next) => {
  try {
    await ensureDemoSeed();
    next();
  } catch (error) {
    next(
      error instanceof Error
        ? error
        : new HttpError(500, "Demo data could not be initialized."),
    );
  }
});
router.use(tenantRouter);
router.use(workshopRouter);
router.use(commerceRouter);
router.use(demoRouter);

export default router;
