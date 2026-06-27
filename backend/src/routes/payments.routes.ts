import { Router } from "express";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";

export const paymentsRouter = Router();

paymentsRouter.use(authenticate);

paymentsRouter.get("/", async (req, res, next) => {
  try {
    const queryWeaverId = req.query.weaverId ? Number(req.query.weaverId) : undefined;

    if (req.user?.role === "weaver") {
      const payments = await prisma.payment.findMany({
        where: { weaverId: req.user.weaverId! },
        orderBy: { paymentDate: "desc" },
        take: 100,
      });
      res.json(payments);
      return;
    }

    if (req.user?.role !== "admin") {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }

    const payments = await prisma.payment.findMany({
      where: queryWeaverId ? { weaverId: queryWeaverId } : undefined,
      include: { weaver: true },
      orderBy: { paymentDate: "desc" },
      take: 100,
    });
    res.json(payments);
  } catch (error) {
    next(error);
  }
});

paymentsRouter.get("/:id", async (req, res, next) => {
  try {
    const payment = await prisma.payment.findUnique({
      where: { paymentId: Number(req.params.id) },
      include: {
        weaver: true,
        fabricReturns: {
          include: { fabricVariant: { include: { product: true } } },
        },
        yarnGiven: true,
        sales: true,
      },
    });

    if (!payment) {
      res.status(404).json({ error: "Payment not found" });
      return;
    }

    if (req.user?.role === "weaver" && req.user.weaverId !== payment.weaverId) {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }

    if (req.user?.role !== "admin" && req.user?.role !== "weaver") {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }

    res.json(payment);
  } catch (error) {
    next(error);
  }
});

paymentsRouter.use(requireAdmin);