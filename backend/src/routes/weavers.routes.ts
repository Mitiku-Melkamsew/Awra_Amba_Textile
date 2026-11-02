import { UserRole } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";

export const weaversRouter = Router();

weaversRouter.use(authenticate);

const createWeaverSchema = z.object({
  fullName: z.string().min(1).max(120).optional(),
  firstName: z.string().min(1).max(80).optional(),
  lastName: z.string().min(1).max(80).optional(),
  username: z.string().min(3).max(60).optional(),
  phone: z.string().max(30).optional(),
  email: z.string().email().optional(),
});

function formatWeaverResponse(user: {
  userId: number;
  username: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  isActive: boolean;
  createdAt: Date;
}) {
  const parts = user.fullName.split(" ");
  const firstName = parts[0] || user.fullName;
  const lastName = parts.slice(1).join(" ") || "";

  return {
    weaverId: user.userId,
    userId: user.userId,
    username: user.username,
    fullName: user.fullName,
    firstName,
    lastName,
    phone: user.phone,
    email: user.email,
    isActive: user.isActive,
    createdAt: user.createdAt,
  };
}

// GET /api/v1/weavers
weaversRouter.get("/", requireAdmin, async (req, res, next) => {
  try {
    const search = (req.query.search as string | undefined)?.trim();
    const sort = (req.query.sort as string | undefined) ?? "id";
    const activeOnly = req.query.active !== "false";

    const users = await prisma.user.findMany({
      where: {
        roles: { some: { role: UserRole.weaver } },
        ...(activeOnly ? { isActive: true } : {}),
        ...(search
          ? {
              OR: [
                { fullName: { contains: search, mode: "insensitive" } },
                { username: { contains: search, mode: "insensitive" } },
                { phone: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: sort === "name" ? [{ fullName: "asc" }] : [{ userId: "asc" }],
    });

    res.json(users.map(formatWeaverResponse));
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/weavers/:id
weaversRouter.get("/:id", async (req, res, next) => {
  try {
    const weaverUserId = Number(req.params.id);
    const isWeaver = req.user?.roles?.includes(UserRole.weaver) && !req.user?.roles?.includes(UserRole.admin);
    if (isWeaver && req.user?.userId !== weaverUserId) {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }

    const user = await prisma.user.findFirst({
      where: {
        userId: weaverUserId,
        roles: { some: { role: UserRole.weaver } },
      },
    });

    if (!user) {
      res.status(404).json({ error: "Weaver not found" });
      return;
    }

    res.json(formatWeaverResponse(user));
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/weavers
weaversRouter.post("/", requireAdmin, async (req, res, next) => {
  try {
    const body = createWeaverSchema.parse(req.body);
    const fullName =
      body.fullName?.trim() ||
      `${body.firstName?.trim() ?? ""} ${body.lastName?.trim() ?? ""}`.trim() ||
      "Unnamed Weaver";

    const baseUsername =
      body.username?.trim() ||
      fullName.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 20) ||
      `weaver_${Date.now()}`;

    let username = baseUsername;
    let count = 1;
    while (await prisma.user.findUnique({ where: { username } })) {
      username = `${baseUsername}_${count++}`;
    }

    const user = await prisma.user.create({
      data: {
        username,
        fullName,
        phone: body.phone,
        email: body.email,
        roles: {
          create: [{ role: UserRole.weaver }],
        },
      },
    });

    res.status(201).json(formatWeaverResponse(user));
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/weavers/:id/unsettled
weaversRouter.get("/:id/unsettled", async (req, res, next) => {
  try {
    const weaverUserId = Number(req.params.id);
    const isWeaver = req.user?.roles?.includes(UserRole.weaver) && !req.user?.roles?.includes(UserRole.admin);
    if (isWeaver && req.user?.userId !== weaverUserId) {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }

    const [returns, yarnGiven, directTxns] = await Promise.all([
      prisma.fabricReturn.findMany({
        where: {
          settlementLineReturns: { none: {} },
          workOrder: { weaverUserId },
        },
        include: {
          fabricVariant: { include: { fabric: true } },
          workOrder: true,
        },
        orderBy: { returnId: "asc" },
      }),
      prisma.yarnGiven.findMany({
        where: {
          workOrder: { weaverUserId, status: { notIn: ["reconciled", "cancelled"] } },
        },
        include: {
          yarnVariant: { include: { yarn: true, color: true, supplier: true } },
        },
        orderBy: { yarnGivenId: "asc" },
      }),
      prisma.directTransaction.findMany({
        where: {
          weaverUserId,
          status: { in: ["unpaid", "partially_paid"] },
        },
        include: { lines: true, payments: true },
        orderBy: { transactionDate: "desc" },
      }),
    ]);

    res.json({
      returns: returns.map((r) => ({
        ...r,
        fabricVariant: {
          ...r.fabricVariant,
          product: r.fabricVariant.fabric, // alias
        },
      })),
      yarnGiven,
      directTransactions: directTxns,
      sales: [], // legacy alias
    });
  } catch (error) {
    next(error);
  }
});
