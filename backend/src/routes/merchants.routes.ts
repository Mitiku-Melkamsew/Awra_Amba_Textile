import { Router } from "express";
import { z } from "zod";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";

export const merchantsRouter = Router();

merchantsRouter.use(authenticate);

const createSchema = z.object({
  companyName: z.string().min(1).max(120).optional(),
  contactPhone: z.string().min(1).max(30),
  contactEmail: z.string().email().max(120).optional(),
});

merchantsRouter.get("/", async (_req, res, next) => {
  try {
    const merchants = await prisma.merchant.findMany({
      where: { isActive: true },
      orderBy: { merchantId: "asc" },
    });
    res.json(merchants);
  } catch (error) {
    next(error);
  }
});

merchantsRouter.post("/", requireAdmin, async (req, res, next) => {
  try {
    const body = createSchema.parse(req.body);
    const merchant = await prisma.merchant.create({
      data: {
        companyName: body.companyName,
        contactPhone: body.contactPhone,
        contactEmail: body.contactEmail,
      },
    });
    res.status(201).json(merchant);
  } catch (error) {
    next(error);
  }
});