import { Router } from "express";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import { buildHisabReport, hisabToCsv } from "../services/hisab-report.service.js";

export const reportsRouter = Router();

reportsRouter.use(authenticate, requireAdmin);

reportsRouter.get("/hisab/:paymentId", async (req, res, next) => {
  try {
    const paymentId = Number(req.params.paymentId);
    const format = (req.query.format as string) ?? "json";
    const report = await buildHisabReport(paymentId);

    if (format === "csv") {
      const csv = hisabToCsv(report);
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="HISAB-${paymentId}.csv"`,
      );
      res.send(csv);
      return;
    }

    res.json(report);
  } catch (error) {
    next(error);
  }
});