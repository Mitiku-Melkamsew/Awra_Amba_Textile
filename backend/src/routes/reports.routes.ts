import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { buildHisabReport, hisabToCsv } from "../services/hisab-report.service.js";
import { snapshotToCsv } from "../services/settlement-preview.service.js";

export const reportsRouter = Router();

reportsRouter.use(authenticate);

reportsRouter.get("/hisab/:paymentId", async (req, res, next) => {
  try {
    const paymentId = Number(req.params.paymentId);
    const format = (req.query.format as string) ?? "json";

    if (req.user?.role === "weaver") {
      const payment = await prisma.payment.findUnique({ where: { paymentId } });
      if (!payment || payment.weaverId !== req.user.weaverId) {
        res.status(403).json({ error: "Insufficient permissions" });
        return;
      }
    } else if (req.user?.role !== "admin") {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }

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

reportsRouter.get("/hisab/batch/:previewId", async (req, res, next) => {
  try {
    if (req.user?.role !== "admin") {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }
    const previewId = req.params.previewId;
    const format = (req.query.format as string) ?? "json";

    const preview = await prisma.settlementPreview.findUnique({ where: { previewId } });
    if (!preview) {
      res.status(404).json({ error: "Preview not found" });
      return;
    }

    const snapshot = preview.snapshot as unknown as Parameters<typeof snapshotToCsv>[0];

    if (format === "csv") {
      const csv = snapshotToCsv(snapshot);
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="HISAB-batch-${previewId}.csv"`,
      );
      res.send(csv);
      return;
    }

    res.json({
      previewId: preview.previewId,
      status: preview.status,
      committedAt: preview.committedAt,
      ...snapshot,
    });
  } catch (error) {
    next(error);
  }
});