import { UserRole } from "@prisma/client";
import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";

export const paymentsRouter = Router();

paymentsRouter.use(authenticate);

// GET /api/v1/payments
paymentsRouter.get("/", async (req, res, next) => {
  try {
    const isWeaver = req.user?.roles?.includes(UserRole.weaver) && !req.user?.roles?.includes(UserRole.admin);
    const weaverUserId = isWeaver ? req.user?.userId : undefined;
    const filterUserId = req.query.weaverUserId
      ? Number(req.query.weaverUserId)
      : req.query.weaverId
        ? Number(req.query.weaverId)
        : weaverUserId ?? undefined;

    const payments = await prisma.settlementPayment.findMany({
      where: filterUserId ? { settlement: { weaverUserId: filterUserId } } : undefined,
      include: {
        settlement: {
          include: {
            weaver: { select: { userId: true, fullName: true, username: true } },
          },
        },
        recordedBy: { select: { username: true } },
      },
      orderBy: { paymentDate: "desc" },
      take: 100,
    });

    res.json(
      payments.map((p) => ({
        paymentId: p.settlementPaymentId,
        settlementPaymentId: p.settlementPaymentId,
        settlementId: p.settlementId,
        weaverId: p.settlement.weaverUserId,
        weaverUserId: p.settlement.weaverUserId,
        weaver: p.settlement.weaver,
        amount: Number(p.amount),
        paymentMethod: p.paymentMethod,
        paymentDate: p.paymentDate,
        recordedBy: p.recordedBy,
        notes: p.notes,
      })),
    );
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/payments/:id
paymentsRouter.get("/:id", async (req, res, next) => {
  try {
    const paymentId = Number(req.params.id);
    const payment = await prisma.settlementPayment.findUnique({
      where: { settlementPaymentId: paymentId },
      include: {
        settlement: {
          include: {
            weaver: { select: { userId: true, fullName: true, username: true } },
            lines: { include: { fabric: true } },
            yarnLines: { include: { yarnVariant: { include: { yarn: true } } } },
          },
        },
        recordedBy: { select: { username: true } },
      },
    });

    if (!payment) {
      res.status(404).json({ error: "Payment not found" });
      return;
    }

    const isWeaver = req.user?.roles?.includes(UserRole.weaver) && !req.user?.roles?.includes(UserRole.admin);
    if (isWeaver && req.user?.userId !== payment.settlement.weaverUserId) {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }

    res.json({
      paymentId: payment.settlementPaymentId,
      settlementPaymentId: payment.settlementPaymentId,
      settlementId: payment.settlementId,
      weaverId: payment.settlement.weaverUserId,
      weaverUserId: payment.settlement.weaverUserId,
      weaver: payment.settlement.weaver,
      amount: Number(payment.amount),
      paymentMethod: payment.paymentMethod,
      paymentDate: payment.paymentDate,
      recordedBy: payment.recordedBy,
      notes: payment.notes,
      settlement: payment.settlement,
    });
  } catch (error) {
    next(error);
  }
});
