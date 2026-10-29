import cors from "cors";
import express from "express";
import { errorHandler } from "./middleware/error-handler.js";
import { authRouter } from "./routes/auth.routes.js";
import { calculationRouter } from "./routes/calculation.routes.js";
import { catalogRouter } from "./routes/catalog.routes.js";
import { fabricReturnsRouter } from "./routes/fabric-returns.routes.js";
import { healthRouter } from "./routes/health.routes.js";
import { paymentsRouter } from "./routes/payments.routes.js";
import { reportsRouter } from "./routes/reports.routes.js";
import { weaversRouter } from "./routes/weavers.routes.js";
import { workOrdersRouter } from "./routes/work-orders.routes.js";
import { procurementRouter } from "./routes/procurement.routes.js";
import { stockRouter } from "./routes/stock.routes.js";
import { yarnGivenRouter } from "./routes/yarn-given.routes.js";
import { transactionsRouter } from "./routes/transactions.routes.js";
import { merchantsRouter } from "./routes/merchants.routes.js";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow mobile apps, curl, server-to-server with no origin
        if (!origin) return callback(null, true);
        const configuredOrigin = process.env.CORS_ORIGIN;
        if (
          configuredOrigin === "*" ||
          origin === configuredOrigin ||
          /^http:\/\/localhost(:\d+)?$/.test(origin) ||
          /^http:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)
        ) {
          return callback(null, true);
        }
        return callback(null, true); // Dev-friendly fallback
      },
      credentials: true,
    }),
  );
  app.use(express.json());

  app.use("/api/v1/health", healthRouter);
  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/catalog", catalogRouter);
  app.use("/api/v1/weavers", weaversRouter);
  app.use("/api/v1/work-orders", workOrdersRouter);
  app.use("/api/v1/yarn-given", yarnGivenRouter);
  app.use("/api/v1/fabric-returns", fabricReturnsRouter);
  app.use("/api/v1/calculations", calculationRouter);
  app.use("/api/v1/payments", paymentsRouter);
  app.use("/api/v1/reports", reportsRouter);
  app.use("/api/v1/stock", stockRouter);
  app.use("/api/v1/procurement", procurementRouter);
  app.use("/api/v1/transactions", transactionsRouter);
  app.use("/api/v1/merchants", merchantsRouter);

  app.use(errorHandler);

  return app;
}