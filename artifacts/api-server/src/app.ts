import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { clerkMiddleware } from "@clerk/express";
import { publishableKeyFromHost } from "@clerk/shared/keys";
import {
  CLERK_PROXY_PATH,
  clerkProxyMiddleware,
  getClerkProxyHost,
} from "./middlewares/clerkProxyMiddleware";
import router from "./routes";
import { logger } from "./lib/logger";
import { apiErrorHandler } from "./lib/http";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
const useClerkProxy = process.env.CLERK_PROXY_ENABLED === "true" ||
  (process.env.REPL_ID !== undefined && process.env.VERCEL !== "1");
if (useClerkProxy) app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  clerkMiddleware((req) => {
    // Standard Clerk instances on Vercel connect directly to Clerk.
    // Keep the Replit proxy opt-in and use the same mode in the browser.
    if (!useClerkProxy) return {};
    const host = getClerkProxyHost(req) ?? "";
    const forwardedProto = req.headers["x-forwarded-proto"];
    const protocol = Array.isArray(forwardedProto)
      ? forwardedProto[0]
      : forwardedProto;
    return {
      publishableKey: publishableKeyFromHost(
        host,
        process.env.CLERK_PUBLISHABLE_KEY,
      ),
      proxyUrl: `${protocol || "https"}://${host}${CLERK_PROXY_PATH}`,
    };
  }),
);

app.use("/api", router);
app.use("/api", (_req, res) => {
  res.status(404).json({ error: "not_found", message: "API route not found." });
});
app.use(apiErrorHandler);

export default app;
