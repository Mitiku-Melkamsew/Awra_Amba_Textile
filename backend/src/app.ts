import cors from "cors";
import express from "express";
import { securityHeaders } from "./presentation/middleware/security-headers.js";
import { errorHandler } from "./presentation/middleware/error-handler.js";
import { healthRouter } from "./presentation/routes/health.routes.js";
import { authRouter } from "./presentation/routes/auth.routes.js";
import { usersRouter } from "./presentation/routes/users.routes.js";
import { catalogRouter } from "./presentation/routes/catalog.routes.js";
import { workOrdersRouter } from "./presentation/routes/work-orders.routes.js";
import { settlementsRouter } from "./presentation/routes/settlements.routes.js";
import { directTransactionsRouter } from "./presentation/routes/direct-transactions.routes.js";
import { procurementRouter } from "./presentation/routes/procurement.routes.js";
import { stockRouter } from "./presentation/routes/stock.routes.js";
import { reportsRouter } from "./presentation/routes/reports.routes.js";
import { auditRouter } from "./presentation/routes/audit.routes.js";
import { weaverPortalRouter } from "./presentation/routes/weaver.routes.js";
import { merchantPortalRouter } from "./presentation/routes/merchant.routes.js";

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.use(securityHeaders);

  const configuredOrigins = (process.env.CORS_ORIGIN ?? "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow mobile apps, curl, server-to-server (no origin header)
        if (!origin) return callback(null, true);
        // In production, only allow configured origins
        if (process.env.NODE_ENV === "production") {
          if (configuredOrigins.includes(origin)) {
            return callback(null, true);
          }
          return callback(new Error(`Not allowed by CORS: ${origin}`));
        }
        // In development, also allow any localhost port
        if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
          return callback(null, true);
        }
        if (configuredOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error(`Not allowed by CORS: ${origin}`));
      },
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "1mb" }));

  // Canonical REST Routes
  app.use("/api/v1/health", healthRouter);
  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/users", usersRouter);
  app.use("/api/v1/catalog", catalogRouter);
  app.use("/api/v1/work-orders", workOrdersRouter);
  app.use("/api/v1/settlements", settlementsRouter);
  app.use("/api/v1/direct-transactions", directTransactionsRouter);
  app.use("/api/v1/transactions", directTransactionsRouter);
  app.use("/api/v1/procurement", procurementRouter);
  app.use("/api/v1/stock", stockRouter);
  app.use("/api/v1/reports", reportsRouter);
  app.use("/api/v1/audit-logs", auditRouter);
  app.use("/api/v1/weaver", weaverPortalRouter);
  app.use("/api/v1/merchant", merchantPortalRouter);

  // Central Domain-Aware Error Handler
  app.use(errorHandler);

  return app;
}
