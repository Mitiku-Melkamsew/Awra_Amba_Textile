import { UserRole } from "@prisma/client";
import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { buildHisabReport, hisabToCsv } from "../services/hisab-report.service.js";
import { snapshotToCsv } from "../services/settlement-preview.service.js";

export const reportsRouter = Router();

reportsRouter.use(authenticate);

// GET /api/v1/reports/hisab/:id
reportsRouter.get("/hisab/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const format = (req.query.format as string) ?? "json";

    const report = await buildHisabReport(id);

    const isWeaver = req.user?.roles?.includes(UserRole.weaver) && !req.user?.roles?.includes(UserRole.admin);
    if (isWeaver && req.user?.userId !== report.weaver.userId) {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }

    if (format === "csv") {
      const csv = hisabToCsv(report);
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="HISAB-${id}.csv"`,
      );
      res.send(csv);
      return;
    }

    res.json(report);
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/reports/hisab/batch/:previewId
reportsRouter.get("/hisab/batch/:previewId", async (req, res, next) => {
  try {
    const isAdmin = req.user?.roles?.includes(UserRole.admin);
    if (!isAdmin) {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }
    const previewId = req.params.previewId;
    const format = (req.query.format as string) ?? "json";

    const preview = await prisma.settlementPreview.findUnique({
      where: { previewId },
    });

    if (!preview) {
      res.status(404).json({ error: "Settlement preview not found" });
      return;
    }

    if (format === "csv") {
      res.status(400).json({ error: "Use export on specific settlement." });
      return;
    }

    res.json({
      previewId,
      status: preview.status,
      createdAt: preview.createdAt,
      committedAt: preview.committedAt,
      snapshot: preview.snapshot,
    });
  } catch (error) {
    next(error);
  }
});
