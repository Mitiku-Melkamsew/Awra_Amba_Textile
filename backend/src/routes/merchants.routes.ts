import { UserRole } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";

export const merchantsRouter = Router();

merchantsRouter.use(authenticate);

const createSchema = z.object({
  fullName: z.string().min(1).max(120).optional(),
  companyName: z.string().min(1).max(120).optional(),
  contactPhone: z.string().min(1).max(30).optional(),
  phone: z.string().min(1).max(30).optional(),
  contactEmail: z.string().email().max(120).optional(),
  email: z.string().email().max(120).optional(),
  username: z.string().min(3).max(60).optional(),
});

function formatMerchant(user: {
  userId: number;
  username: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  isActive: boolean;
  createdAt: Date;
}) {
  return {
    merchantId: user.userId,
    userId: user.userId,
    username: user.username,
    fullName: user.fullName,
    companyName: user.fullName,
    contactPhone: user.phone ?? "",
    phone: user.phone,
    contactEmail: user.email,
    email: user.email,
    isActive: user.isActive,
    createdAt: user.createdAt,
  };
}

// GET /api/v1/merchants
merchantsRouter.get("/", async (_req, res, next) => {
  try {
    const merchants = await prisma.user.findMany({
      where: {
        roles: { some: { role: UserRole.merchant } },
        isActive: true,
      },
      orderBy: { userId: "asc" },
    });
    res.json(merchants.map(formatMerchant));
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/merchants
merchantsRouter.post("/", requireAdmin, async (req, res, next) => {
  try {
    const body = createSchema.parse(req.body);
    const fullName = body.fullName?.trim() || body.companyName?.trim() || "Unnamed Merchant";
    const phone = body.phone ?? body.contactPhone;
    const email = body.email ?? body.contactEmail;

    const baseUsername =
      body.username?.trim() ||
      fullName.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 20) ||
      `merchant_${Date.now()}`;

    let username = baseUsername;
    let count = 1;
    while (await prisma.user.findUnique({ where: { username } })) {
      username = `${baseUsername}_${count++}`;
    }

    const merchant = await prisma.user.create({
      data: {
        username,
        fullName,
        phone,
        email,
        roles: {
          create: [{ role: UserRole.merchant }],
        },
      },
    });

    res.status(201).json(formatMerchant(merchant));
  } catch (error) {
    next(error);
  }
});
