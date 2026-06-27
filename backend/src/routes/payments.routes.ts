import { Router } from "express";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";

export const paymentsRouter = Router();

paymentsRouter.use(authenticate, requireAdmin);

paymentsRouter.get("/", async (req, res, next) => {
  try {
    const weaverId = req.query.weaverId ? Number(req.query.weaverId) : undefined;
    const payments = await prisma.payment.findMany({
      where: weaverId ? { weaverId } : undefined,
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
        fabricReturns: true,
        yarnGiven: true,
        sales: true,
      },
    });
    if (!payment) {
      res.status(404).json({ error: "Payment not found" });
      return;
    }
    res.json(payment);
  } catch (error) {
    next(error);
  }
});